// File: server/agent_engine/outbound_team/graph.js
// THIS IS THE FINAL AND DEFINITIVE FIX FOR THE INFINITE LOOP

const { StateGraph, END } = require("@langchain/langgraph");
const { runSupervisor } = require("./supervisor");
const { routeToTool } = require("./edges");
const { crmUpdateTool } = require("../tools");

const graphState = {
  leadRecord: { value: (x, y) => y, default: () => ({}) },
  agentScratchpad: { value: (x, y) => y, default: () => ({ intelBriefing: null }) },
  messages: { value: (x, y) => x.concat(y), default: () => [] },
  pending_message: { value: (x, y) => y, default: () => null },
};

const workflow = new StateGraph({
  channels: graphState,
});

workflow.addNode("supervisor", async (state) => {
  try {
    const result = await runSupervisor(state);
    return result;
  } catch (error) {
    console.error("[Graph Supervisor Node] Caught critical error:", error);
    return {
      agentScratchpad: { intelBriefing: null },
      pending_message: null,
    };
  }
});

workflow.addNode("crm_operator", async (state) => {
  try {
    const briefing = state.agentScratchpad.intelBriefing;
    if (!briefing || !briefing.params) {
      console.warn("[CRM Operator] Invalid briefing, skipping operation");
      return { agentScratchpad: { intelBriefing: null } };
    }
    const result = await crmUpdateTool.invoke(briefing.params);
    console.log(`[CRM Operator] Result: ${result}`);
    return { agentScratchpad: { intelBriefing: null } };
  } catch (error) {
    console.error("[CRM Operator] Error:", error);
    return { agentScratchpad: { intelBriefing: null } };
  }
});

// --- THIS IS THE CRITICAL FIX ---
workflow.addNode("communicator", (state) => {
  try {
    const briefing = state.agentScratchpad.intelBriefing;
    if (!briefing || !briefing.params || !briefing.params.messageText) {
      return { agentScratchpad: { intelBriefing: null } };
    }
    const messageText = briefing.params.messageText;
    console.log(`[Communicator Node] Queuing message: "${messageText}"`);
    
    // Add the bot's own message to the history. This is the agent's short-term memory.
    const botMessage = { sender: "bot", text: messageText };

    return {
      messages: [botMessage], // This will be concatenated to the existing messages array
      pending_message: messageText,
      agentScratchpad: { intelBriefing: null }
    };
  } catch (error) {
    console.error("[Communicator] Error:", error);
    return {
      pending_message: null,
      agentScratchpad: { intelBriefing: null }
    };
  }
});
// -----------------------------------------------------------------

workflow.setEntryPoint("supervisor");
workflow.addConditionalEdges("supervisor", routeToTool, {
  "crm_operator": "crm_operator",
  "communicator": "communicator",
  [END]: END,
});

workflow.addEdge("crm_operator", "supervisor");
workflow.addEdge("communicator", "supervisor");

const outboundGraph = workflow.compile();

module.exports = { outboundGraph };