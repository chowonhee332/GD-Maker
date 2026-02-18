import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.VITE_GEMINI_API_KEY;

if (!apiKey) {
    console.error("Error: VITE_GEMINI_API_KEY not found in environment variables (check .env).");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

async function listModels() {
    try {
        console.log(`Checking models with API Key: ${apiKey.substring(0, 8)}...`);
        const modelResponse = await genAI.getGenerativeModel({ model: "gemini-1.5-flash" }).apiKey; // Hack to get the client? No, need direct list.

        // The SDK doesn't expose listModels directly on the main class in some versions, 
        // but let's try the standard way if the SDK version supports it, otherwise use fetch.

        // Correction: GoogleGenerativeAI class usually just gets models. 
        // We might need to use the ModelService directly or just fetch.

        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status} - ${await response.text()}`);
        }

        const data = await response.json();
        console.log("\nAvailable Models:");
        if (data.models) {
            data.models.forEach(m => {
                if (m.supportedGenerationMethods && m.supportedGenerationMethods.includes("generateContent")) {
                    console.log(`- ${m.name.replace('models/', '')} (${m.displayName})`);
                }
            });
        } else {
            console.log("No models found in response.");
        }

    } catch (error) {
        console.error("Error listing models:", error.message);
    }
}

listModels();
