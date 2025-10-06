// File: server/agent_engine/tools.js
// THIS IS THE COMPLETE, CORRECTED FILE

const { z } = require("zod");
const { DynamicStructuredTool } = require("@langchain/core/tools");
const supabase = require('../config/supabaseClient');

const crmUpdateTool = new DynamicStructuredTool({
  name: "crm_operator",
  description: "Updates a lead's record in the CRM. Use this to change pipeline stages, add intel tags, or update known information.",
  schema: z.object({
    leadId: z.string().uuid().describe("The UUID of the lead to update."),
    updates: z.object({
        pipeline_stage: z.string().optional(),
        name: z.string().optional(),
        intel_tags: z.array(z.string()).optional(),
        conversation_summary: z.string().optional()
    }).describe("An object containing the fields to update.")
  }),
  func: async ({ leadId, updates }) => {
    try {
      console.log(`[CRM Operator] Updating lead ${leadId} with:`, updates);
      const dbUpdates = {};
      if (updates.pipeline_stage) dbUpdates.pipeline_stage = updates.pipeline_stage;
      if (updates.name) dbUpdates.name = updates.name;
      if (updates.intel_tags) dbUpdates.intel_tags = updates.intel_tags;
      if (updates.conversation_summary) dbUpdates.conversation_summary = updates.conversation_summary;

      const { error } = await supabase.from('leads').update(dbUpdates).eq('id', leadId);
      if (error) throw error;
      return `Successfully updated lead ${leadId} in the CRM.`;
    } catch (error) {
      return `Error updating CRM: ${error.message}`;
    }
  },
});

const messageCommunicatorTool = new DynamicStructuredTool({
    name: "communicator",
    description: "Decides on a message to send to the user. The system will handle the actual sending.",
    schema: z.object({
        messageText: z.string().describe("The exact text message to queue for sending.")
    }),
    // --- FIX: This function is now a simple placeholder. It DOES NOT send messages. ---
    func: async ({ messageText }) => {
        console.log(`[Communicator Tool] Acknowledging decision to send message.`);
        return `Message has been queued for sending by the supervisor.`;
    }
});

module.exports = { crmUpdateTool, messageCommunicatorTool };