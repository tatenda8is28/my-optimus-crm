// File: server/agent_engine/outbound_team/supervisor.js
// THIS IS THE FINAL AND CORRECTED FILE

const { ChatOpenAI } = require("@langchain/openai");
const { ChatPromptTemplate } = require("@langchain/core/prompts");
const { zodToJsonSchema } = require("zod-to-json-schema");
const { crmUpdateTool, messageCommunicatorTool } = require("../tools");

const llm = new ChatOpenAI({
  modelName: "gpt-4-turbo-preview",
  temperature: 0.1,
});

const tools = [crmUpdateTool, messageCommunicatorTool];

const llmWithTools = llm.bind({
  functions: tools.map((tool) => ({
    name: tool.name,
    description: tool.description,
    parameters: zodToJsonSchema(tool.schema),
  }))
});

const promptTemplate = ChatPromptTemplate.fromMessages([
  ["system",
`You are "Agent Optimus," a specialized AI co-pilot for the Agent Optimus CRM, acting as an expert sales development representative.

Your mission is to re-engage a lead who has replied to a cold outbound WhatsApp message. You must be professional, concise, and immediately add value. Do not waste the lead's time.

Your primary goals, in order, are:
1. Acknowledge their message, re-establish context, and build rapport.
2. Briefly re-frame the conversation around the value of saving time and automating their sales funnel.
3. Offer to provide proof with a low-friction demo video.
4. If they show interest, your ultimate goal is to guide them towards booking a consultation.

**IMPORTANT RULE:** After you send a message, the next turn is for the human to reply. If the last message in the history is from you (the 'bot'), you MUST wait for the human. Your only valid action in that case is to end the turn by choosing the "__end__" tool.

Current Date: {current_date}

Here is the complete context for this turn:

## LEAD RECORD (from CRM):
{lead_record}

## FULL CONVERSATION HISTORY (Oldest to Newest):
{messages}`
  ],
]);

const supervisorChain = promptTemplate.pipe(llmWithTools);

async function runSupervisor(state) {
  console.log("[Outbound Supervisor] Running...");

  if (!Array.isArray(state.messages)) {
      throw new Error("Invalid state: messages must be an array");
  }
  if (!state.leadRecord || !state.leadRecord.id) {
      throw new Error("Invalid state: leadRecord missing required fields");
  }

  const messages = state.messages;
  const formattedMessages = messages.map(m => `${m.sender}: ${m.text}`).join('\n');

  const response = await supervisorChain.invoke({
      messages: formattedMessages,
      lead_record: JSON.stringify(state.leadRecord, null, 2),
      current_date: new Date().toISOString(),
  });

  const toolCall = response.additional_kwargs.function_call;

  // --- THIS IS THE CRITICAL FIX ---
  // If the model decides to end, we explicitly clear the pending message.
  if (!toolCall) {
      console.log("[Outbound Supervisor] Model decided no action was needed. Ending turn.");
      return { 
          agentScratchpad: { intelBriefing: { tool: "__end__" } },
          pending_message: null // Explicitly clear any stale message
      };
  }
  // ------------------------------------

  const supervisorDecision = {
      tool: toolCall.name,
      params: JSON.parse(toolCall.arguments),
  };

  console.log("[Outbound Supervisor] Decision:", supervisorDecision);

  if (supervisorDecision?.tool === 'crm_operator') {
    supervisorDecision.params.leadId = state.leadRecord.id;
  }
  if (supervisorDecision?.tool === 'communicator') {
    supervisorDecision.params.leadPhoneNumber = state.leadRecord.phone_number;
  }
  
  return { agentScratchpad: { intelBriefing: supervisorDecision } };
}

module.exports = { runSupervisor };