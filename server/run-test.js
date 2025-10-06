// --- START OF FILE: server/run-test.js ---
// THIS IS THE FINAL, CORRECTED FILE.

require('dotenv').config();
const crypto = require('crypto'); // <-- NEW: Import the built-in crypto library
const agentEngine = require('./agent_engine');
const { initializeRetriever } = require('./agent_engine/retriever');
const { INBOUND_PLAYBOOK } = require('./agent_engine/playbooks');

async function runTest() {
    console.log("--- Starting Local Agent Test ---");
    
    // 1. Initialize dependencies
    await initializeRetriever();

    // 2. Define a sample input message with a VALID UUID
    const testLeadId = crypto.randomUUID(); // <-- FIX: Generate a real UUID
    console.log(`Generated Test Lead ID: ${testLeadId}`);

    const turnInput = {
        leadId: testLeadId,
        latestMessage: "Hello, my name is Bob. I'm with ACME Corp. Can you tell me about your pricing?",
        crmData: {
            id: testLeadId,
            name: "Inbound Lead",
            phoneNumber: "1234567890",
        },
        isOutbound: false,
        playbook: {
            name: INBOUND_PLAYBOOK.name,
            step: 1,
            goal: INBOUND_PLAYBOOK.steps[0].goal,
        },
    };

    console.log("Invoking agent with this turn's input:", JSON.stringify(turnInput, null, 2));

    // 3. Run the agent engine
    try {
        const result = await agentEngine.handleMessage(turnInput);
        console.log("--- Agent Run Complete ---");
        console.log("Final State:", JSON.stringify(result, null, 2));
        console.log("AI's Drafted Message:", result.draftedMessage);
        console.log("\n✅ Test successful! Check the LangSmith dashboard for the trace.");
    } catch (error) {
        console.error("❌ Test failed with an error:", error);
    }
}

runTest();
// --- END OF FILE ---