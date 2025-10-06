// --- server/check-models.js ---
require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function checkGoogleModels() {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        console.error("❌ GEMINI_API_KEY not found in .env file. Please check your configuration.");
        return;
    }

    console.log("🔑 API Key found. Attempting to connect to Google AI...");

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-pro" }); // A common, stable model to test with

        console.log("\n--- Testing a simple generation request... ---");
        const result = await model.generateContent("What is the capital of France?");
        const response = await result.response;
        const text = response.text();
        console.log("✅ Simple generation successful. Response:", text);
        console.log("\nThis confirms your API key is working and has access to the 'gemini-pro' model.");
        console.log("You can now confidently use 'gemini-pro' as the model name in all agent files.");

    } catch (error) {
        console.error("\n❌ An error occurred while trying to connect to the Google Generative AI API.");
        console.error("--------------------------------------------------------------------");
        console.error("Error Details:", error.message);
        console.error("--------------------------------------------------------------------");
        console.error("\nPossible Reasons for this Failure:");
        console.error("1. Your GEMINI_API_KEY in the .env file might be incorrect or expired.");
        console.error("2. The billing for your Google Cloud project might not be enabled.");
        console.error("3. The 'generativelanguage.googleapis.com' API might not be enabled in your Google Cloud project.");
        console.error("4. The model name 'gemini-pro' might not be available for your account or region.");
        console.error("\nPlease verify these points in your Google AI Studio and Google Cloud Platform console.");
    }
}

checkGoogleModels();