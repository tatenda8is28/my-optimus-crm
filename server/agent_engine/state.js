// File: server/agent_engine/state.js
// THIS IS THE COMPLETE, CORRECTED FILE

const { z } = require("zod");

const messageSchema = z.object({ sender: z.enum(["bot", "human"]), text: z.string() });
const leadRecordSchema = z.object({
    id: z.string().uuid(), name: z.string().nullable(), phone_number: z.string(),
    is_outbound: z.boolean(), pipeline_stage: z.string().nullable(), intel_tags: z.array(z.string()).nullable(),
    lead_score: z.number().int().nullable(), conversation_summary: z.string().nullable(),
});
const agentScratchpadSchema = z.object({
  intelBriefing: z.object({ tool: z.string(), params: z.record(z.any()) }).nullable().optional(),
});
const AgentState = z.object({
    messages: z.array(messageSchema),
    leadRecord: leadRecordSchema,
    agentScratchpad: agentScratchpadSchema,
    knowledge_results: z.string().nullable().optional(),
    // --- NEW PROPERTY TO HOLD THE AGENT'S DECISION ---
    pending_message: z.string().nullable().optional(),
});

module.exports = { AgentState };