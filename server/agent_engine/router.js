// File: server/agent_engine/router.js
const { END } = require("@langchain/langgraph");

const routeToTeam = (state) => {
    if (state.leadRecord.is_outbound) {
        return "outbound_team";
    } else {
        return "inbound_team";
    }
};

const routeToTool = (state) => {
  const toolToCall = state.agentScratchpad.intelBriefing?.tool;
  if (!toolToCall || toolToCall === "__end__") {
    return END;
  }
  return toolToCall;
};

module.exports = { routeToTeam, routeToTool };