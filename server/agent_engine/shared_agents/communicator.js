// File: server/agent_engine/shared_agents/communicator.js
const { z } = require("zod");
const { DynamicStructuredTool } = require("@langchain/core/tools");
const { sendMessage } = require('../../services/whatsappService'); // Import the REAL service

const messageCommunicatorTool = new DynamicStructuredTool({
    name: "communicator",
    description: "Sends a message to the user via WhatsApp. This is your primary way of communicating.",
    schema: z.object({
        leadPhoneNumber: z.string().describe("The phone number of the lead to send the message to."),
        messageText: z.string().describe("The exact text message to send to the user.")
    }),
    func: async ({ leadPhoneNumber, messageText }) => {
        try {
            await sendMessage(leadPhoneNumber, messageText);
            return `Message successfully sent to ${leadPhoneNumber}.`;
        } catch (error) {
            console.error(`[Communicator] Failed to send message:`, error);
            return `Error: Failed to send message. Please try again.`;
        }
    }
});

module.exports = { messageCommunicatorTool };