// File: server/services/outreachService.js
// THIS IS THE COMPLETE FILE WITH THE OUTREACH FUNCTION REPAIRED.

const { createClient } = require('@supabase/supabase-js');
const { sendMessage } = require('./whatsappClient');

const JOB_INTERVAL_MS = 30000;
let isWorkerRunning = false;

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

const initializeWorker = () => {
    console.log('Persistent Outreach Worker initialized.');
    setInterval(processQueue, JOB_INTERVAL_MS);
};

const processQueue = async () => {
    if (isWorkerRunning) return;
    isWorkerRunning = true;
    let lead = null;

    try {
        const { data: leadData, error: leadError } = await supabase
            .from('leads')
            .select(`*`)
            .eq('pipeline_stage', 'New Lead')
            .not('campaign_id', 'is', null)
            .limit(1)
            .single();

        if (leadError) {
            if (leadError.code !== 'PGRST116') {
                console.error('Outreach Worker - Error finding job:', leadError.message);
            }
            isWorkerRunning = false;
            return;
        }

        lead = leadData;

        // --- THIS IS THE FIX FOR THE OUTREACH SERVICE ---
        let safeConversationHistory = [];
        try {
            if (Array.isArray(lead.conversation_history)) {
                safeConversationHistory = lead.conversation_history;
            } else if (typeof lead.conversation_history === 'string') {
                safeConversationHistory = JSON.parse(lead.conversation_history);
            }
        } catch (e) {
            console.warn(`[Outreach Worker] Failed to parse conversation_history for lead ${lead.id}. Skipping.`);
            isWorkerRunning = false;
            return; // Skip this lead if history is corrupted
        }
        // --------------------------------------------------

        const pendingMessageIndex = safeConversationHistory.findIndex(m => m.status === 'pending');
        const messageToSend = pendingMessageIndex !== -1 ? safeConversationHistory[pendingMessageIndex] : null;

        if (messageToSend) {
            console.log(`🚀 Found job for lead: ${lead.name} (${lead.phone_number})`);
            
            const sentMessage = await sendMessage(lead.phone_number, messageToSend.text);
            
            if (sentMessage) {
                const today = new Date().toISOString().split('T')[0];
                const updatedHistory = [...safeConversationHistory];
                updatedHistory[pendingMessageIndex].status = 'sent';

                const { error: updateError } = await supabase
                    .from('leads')
                    .update({ 
                        pipeline_stage: 'Outreach #1 Sent', 
                        outreach_batch_date: today,
                        conversation_history: updatedHistory // Save the array back, Supabase will stringify it.
                    })
                    .eq('id', lead.id);

                if (updateError) throw updateError;
                console.log(`✅ Message sent to ${lead.name}. Stage and conversation history updated.`);
            }
        }
    } catch (error) {
        console.error(`CRITICAL Error in outreach worker for lead ID ${lead ? lead.id : 'UNKNOWN'}:`, error.message);
    } finally {
        isWorkerRunning = false;
    }
};

module.exports = { initializeWorker };