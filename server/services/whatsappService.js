// File: server/services/whatsappService.js
// THIS IS THE COMPLETE FILE WITH YOUR SAFE-GUARDING FIXES.

const { createClient } = require('@supabase/supabase-js');
const agentEngine = require('../agent_engine');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

const initializeWhatsAppService = (client) => {
    console.log('Initializing WhatsApp Service (Message Handler)...');
    client.on('message', handleIncomingMessage);
};

// --- THIS IS YOUR FIX FOR SAFE-GUARDING THE MESSAGE HANDLER ---
const handleIncomingMessage = async (msg) => {
    // Optional chaining added for safety
    if (!msg?.from?.endsWith('@c.us') || msg?.fromMe) return;

    try {
        const leadPhoneNumber = msg.from.split('@')[0];
        
        let { data: lead, error: fetchError } = await supabase
            .from('leads')
            .select('*')
            .eq('phone_number', leadPhoneNumber)
            .single();

        if (fetchError || !lead) {
            const { data: newLead, error: createError } = await supabase
                .from('leads')
                .insert({ phone_number: leadPhoneNumber, name: msg.notifyName || 'Unknown Contact' })
                .select()
                .single();
            if (createError) throw createError;
            lead = newLead;
        }

        const newMessage = {
            sender: 'human',
            text: msg.body,
            createdAt: new Date().toISOString(),
            whatsapp_message_id: msg.id.id
        };
        const updatedHistory = [...(lead.conversation_history || []), newMessage];

        const { error: updateError } = await supabase
            .from('leads')
            .update({ conversation_history: updatedHistory })
            .eq('id', lead.id);
        
        if (updateError) throw updateError;

        await agentEngine.handleMessage({ leadId: lead.id });

    } catch (error) {
        console.error('[WhatsApp Service] CRITICAL Error handling incoming message:', error);
    }
};
// ------------------------------------------------------------------

module.exports = { initializeWhatsAppService };