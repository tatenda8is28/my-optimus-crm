// File: server/agent_engine/index.js
// THIS IS THE FINAL AND CORRECTED FILE

const supabase = require('../config/supabaseClient');
const { AgentState } = require('./state');
const { outboundGraph } = require('./outbound_team/graph');
const { sendMessage } = require('../services/whatsappClient');

const normalizeAgentMemory = (memory) => {
    if (!memory) return { langgraph_state: { intelBriefing: null } };
    const normalized = { ...memory };
    if (!normalized.langgraph_state) {
        normalized.langgraph_state = { intelBriefing: null };
    }
    if (!normalized.langgraph_state.intelBriefing) {
        normalized.langgraph_state.intelBriefing = null;
    }
    if (normalized.langgraph_state.intelBriefing && typeof normalized.langgraph_state.intelBriefing.params === 'undefined') {
        normalized.langgraph_state.intelBriefing.params = {}; // Ensure params is an object
    }
    return normalized;
};

async function handleMessage({ leadId }) {
    console.log(`[Master Supervisor] Handling new turn for Lead ID: ${leadId}`);
    try {
        const { data: lead, error: leadError } = await supabase
            .from('leads')
            .select('*')
            .eq('id', leadId)
            .single();

        if (leadError) throw new Error(`Failed to fetch lead: ${leadError.message}`);

        const safeConversationHistory = Array.isArray(lead.conversation_history)
            ? lead.conversation_history : (typeof lead.conversation_history === 'string' ? JSON.parse(lead.conversation_history) : []);

        const normalizedMemory = normalizeAgentMemory(lead.agent_memory);

        const currentState = {
            messages: safeConversationHistory.map(m => ({ sender: m.sender || 'bot', text: m.text || '' })),
            leadRecord: {
                id: lead.id, name: lead.name || 'Unknown', phone_number: lead.phone_number,
                is_outbound: Boolean(lead.is_outbound), pipeline_stage: lead.pipeline_stage || 'New Lead',
                intel_tags: Array.isArray(lead.intel_tags) ? lead.intel_tags : [],
                lead_score: Number(lead.lead_score || 0), conversation_summary: lead.conversation_summary || '',
            },
            agentScratchpad: normalizedMemory.langgraph_state,
            pending_message: null,
        };

        AgentState.parse(currentState);
        console.log('[Master Supervisor] State built and validated successfully.');

        let graphResult;
        if (currentState.leadRecord.is_outbound) {
            console.log('[Master Supervisor] Routing to Outbound Team...');
            graphResult = await outboundGraph.invoke(currentState);
        } else {
            graphResult = currentState;
        }

        const finalState = { ...currentState, ...graphResult };

        if (finalState.pending_message) {
            console.log(`[Master Supervisor] Executing agent's decision to send message: "${finalState.pending_message}"`);
            await sendMessage(finalState.leadRecord.phone_number, finalState.pending_message);
            
            // --- THIS IS THE SECOND CRITICAL FIX ---
            // After sending, immediately clear the pending message from the state we are about to save.
            finalState.pending_message = null;
            // -----------------------------------------
        }

        const finalAgentStateToSave = {
            ...lead.agent_memory,
            langgraph_state: finalState.agentScratchpad || { intelBriefing: null }
        };

        const { error: updateError } = await supabase
            .from('leads')
            .update({ agent_memory: finalAgentStateToSave })
            .eq('id', leadId);

        if (updateError) throw new Error(`Failed to save agent state: ${updateError.message}`);
        console.log(`[Master Supervisor] Successfully completed turn for Lead ID: ${leadId}`);
        return { success: true };

    } catch (error) {
        console.error(`[Master Supervisor] FINAL RESORT CRITICAL ERROR for Lead ID ${leadId}:`, error);
        return { success: false, error: error.message };
    }
}

module.exports = { handleMessage };