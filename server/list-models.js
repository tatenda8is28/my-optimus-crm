// --- server/list-models.js ---
// THIS IS THE FINAL SCRIPT, BASED ON OFFICIAL GOOGLE DOCUMENTATION.
require('dotenv').config();
const { GoogleAIFileManager, GoogleGenerativeAI } = require("@google/generative-ai");

async function listAvailableModels() {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        console.error("❌ GEMINI_API_KEY not found in .env file.");
        return;
    }

    console.log("🔑 API Key found. Attempting to list available models...");

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const models = await genAI.listModels();

        console.log("\n--- ✅ SUCCESS! Here are the models your API key can use: ---");

        for (const model of models) {
            if (model.supportedGenerationMethods.includes("generateContent")) {
                console.log(`Model Name: ${model.name}`);
                console.log(`   Description: ${model.description}`);
                console.log("---------------------------------------------------------");
            }
        }

        console.log("\nACTION: Copy the best 'Model Name' from this list and update your agent files.");

    } catch (error) {
        console.error("\n❌ An error occurred. This confirms a problem with your API key or Google project setup.");
        console.error("Error Details:", error.message);
    }
}

listAvailableModels();