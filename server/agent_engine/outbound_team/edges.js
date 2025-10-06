// File: server/agent_engine/outbound_team/edges.js
// THIS IS THE COMPLETE, CORRECTED FILE

const { END } = require("@langchain/langgraph");

const routeToTool = (state) => {
  // --- THE ROBUSTNESS FIX ---
  // Safely check for agentScratchpad and intelBriefing.
  const toolToCall = state.agentScratchpad?.intelBriefing?.tool;
  // ------------------------------------

  if (!toolToCall || toolToCall === "__end__") {
    console.log("[Outbound Router] Supervisor decided to end the turn.");
    return END;
  }
  console.log(`[Outbound Router] Routing to tool: ${toolToCall}`);
  return toolToCall;
};

module.exports = { routeToTool };