// --- server/inspect-library.js ---
// This script's only purpose is to inspect the Google AI library
// and show us what functions are actually available to call.

require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

function inspectLibrary() {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        console.error("❌ GEMINI_API_KEY not found in .env file.");
        return;
    }

    try {
        const genAI = new GoogleGenerativeAI(apiKey);

        console.log("--- Inspecting the 'GoogleGenerativeAI' object ---");
        console.log("Here is a list of all available methods on the 'genAI' object instance:");
        console.log("---------------------------------------------------------");

        // This will list every function available on the object.
        // This is the most reliable way to see what we can actually call.
        const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(genAI));
        console.log(methods);

        console.log("---------------------------------------------------------");
        console.log("\n--- INSTRUCTION ---");
        console.log("Please look at the list of methods printed above. One of them is the correct function to get models.");
        console.log("It might be named something like 'getGenerativeModel', 'getModel', or something else. Please tell me what you see.");

    } catch (error) {
        console.error("\n❌ An error occurred during instantiation. This points to a problem with the API key itself.");
        console.error("Error Details:", error.message);
    }
}

inspectLibrary();