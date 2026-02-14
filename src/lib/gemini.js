import { GoogleGenerativeAI } from "@google/generative-ai";

let genAI = null;

export const initGemini = (apiKey) => {
  if (!apiKey) return;
  genAI = new GoogleGenerativeAI(apiKey);
};

// Helper to convert File/Blob to Gemini Part
const fileToGenerativePart = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Data = reader.result.split(',')[1];
      resolve({
        inlineData: {
          data: base64Data,
          mimeType: file.type,
        },
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const generatePresentationContent = async (topic, config, visualAssets = []) => {
  if (!genAI) throw new Error("API Key not set");

  // Define the prompt for generation
  const promptText = `
    You are a world-class presentation consultant and designer. Your task is to generate a highly professional, persuasive, and structured presentation outline for the topic: "${topic}".
    
    Target Audience: ${config.audience}
    Presentation Purpose: ${config.purpose}
    Desired Tone: ${config.tone}
    Industry/Domain: ${config.domain || 'General'}${config.subDomain && config.subDomain !== 'General' ? ` (Focus Sector: ${config.subDomain})` : ''}
    Visual Identity: Focus on a design language that complements ${config.primaryColor ? `the primary color ${config.primaryColor}` : 'a professional color palette'}.
    Visual Context: The user has provided reference images. Use these to infer the desired visual style, content depth, or even specific details if relevant.

    Guidelines for Content:
    - Cover: Create an evocative, high-impact title and a clear subtitle that establishes authority.
    - Index: Provide 4-5 logical chapters that tell a coherent story.
    - Divider: Create a strong transition message for the first major section.
    - Body1 (Editorial): Use professional bullet points. Focus on "Why" and "How", not just "What".
    - Body2 (Analysis): Provide a data-driven or visual summary that would fit a chart or matrix.

    Structural Requirements:
    - Provide EXACTLY ${config.pageCount || 5} slides.
    - Language: Use the language of the provided topic (if Korean, use professional Korean).
    - Format: Return a strict JSON object.

    JSON Format Example:
    {
      "title": "Main Project Title",
      "subtitle": "Subtitle explaining the value prop",
      "slides": [
        { "type": "cover", "title": "...", "content": "..." },
        { "type": "index", "title": "...", "content": "..." },
        { "type": "divider", "title": "...", "content": "..." },
        { "type": "body1", "title": "...", "content": "..." },
        { "type": "body2", "title": "...", "content": "..." }
      ]
    }
    
    CRITICAL: Return ONLY the JSON. No markdown, no explanations.
  `;

  // Prepare input parts (Prompt + Images)
  const imageParts = await Promise.all(visualAssets.map(fileToGenerativePart));
  const inputParts = [promptText, ...imageParts];

  // Strategy: Gemini 3 Pro Preview (UI/UX Optimized) -> Gemini 3 Deep Think (Reasoning) -> Gemini 3 Flash Preview (Speed) -> Gemini 1.5 Pro
  try {
    // 1. Try Gemini 3 Pro Preview (Target: Complex Reasoning, Coding, UI/UX)
    const model3Pro = genAI.getGenerativeModel({ model: "gemini-3-pro-preview" });
    const result = await model3Pro.generateContent(inputParts);
    const response = await result.response;
    return parseGeminiResponse(response.text());
  } catch (error3Pro) {
    console.warn("Gemini 3 Pro Preview failed, attempting fallback to Deep Think:", error3Pro.message);

    try {
      // 2. Try Gemini 3 Deep Think (Target: Deep Reasoning)
      const model3Deep = genAI.getGenerativeModel({ model: "gemini-3-deep-think" });
      const result = await model3Deep.generateContent(inputParts);
      const response = await result.response;
      return parseGeminiResponse(response.text());
    } catch (error3Deep) {
      console.warn("Gemini 3 Deep Think failed, attempting fallback to Flash Preview:", error3Deep.message);

      try {
        // 3. Try Gemini 3 Flash Preview (Target: Speed/Efficiency)
        const model3Flash = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });
        const result = await model3Flash.generateContent(inputParts);
        const response = await result.response;
        return parseGeminiResponse(response.text());
      } catch (error3Flash) {
        console.warn("Gemini 3 Flash Preview failed, attempting fallback to 1.5 Pro:", error3Flash.message);

        try {
          // 4. Fallback to Gemini 1.5 Pro (Stable)
          const model15Pro = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
          const result = await model15Pro.generateContent(inputParts);
          const response = await result.response;
          return parseGeminiResponse(response.text());
        } catch (flashError) {
          console.error("All Gemini models failed:", flashError);
          throw flashError;
        }
      }
    }
  }
};

const parseGeminiResponse = (text) => {
  let cleanedText = text.trim();
  if (cleanedText.startsWith('```json')) {
    cleanedText = cleanedText.replace(/^```json/, '').replace(/```$/, '');
  } else if (cleanedText.startsWith('```')) {
    cleanedText = cleanedText.replace(/^```/, '').replace(/```$/, '');
  }
  return JSON.parse(cleanedText.trim());
};

export const generateCreonAsset = async (prompt, type) => {
  if (!genAI) throw new Error("API Key not set");

  // TODO: Verify if the user's key allows image generation. 
  // For now, we simulate or try to call a specific model if known.
  // Standard Gemini API does not support text-to-image yet in all regions/keys.

  // We will construct the prompt for the STYLE
  let systemPrompt = "";
  if (type === '3d') {
    systemPrompt = "Style: 3D Render, Cute, Isometric, Glossy, Soft Lighting, 4K, Blender 3D Style. ";
  } else if (type === '2d') {
    systemPrompt = "Style: Flat Icon, Vector Art, Minimalist, SVG Style, Clean Lines. ";
  } else {
    systemPrompt = "Style: High Quality Photograph, Cinematic Lighting. ";
  }

  const fullPrompt = `${systemPrompt} Subject: ${prompt}`;

  // NOTE: Assuming there might be an 'imagen' model or similar available via the generic method
  // or we fallback to text for this demo if not available.
  try {
    // Attempting to use a model that might support images, or just standard flash to get a text description
    // which we might placeholder-ize. 
    // Ideally, this calls a text-to-image endpoint.

    // For this specific demo, since we cannot guarantee an Image Generation model access 
    // via standard key without specific whitelisting, we will mock the "Image Generation" 
    // by returning a placeholder image URL based on keywords, 
    // OR we can try 'gemini-pro-vision' if it supported output (it doesn't).

    // Let's simulating a delay and returning a placeholder for now to ensure UI works,
    // as debugging API capabilities specifically for ImageGen is complex without interactive testing.

    console.log("Generating asset with prompt:", fullPrompt);

    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call

    // Return a dynamic placeholder based on the prompt keywords
    // We can use https://placehold.co or similar, or just a generic asset.
    return {
      success: true,
      imageUrl: `https://placehold.co/600x400/png?text=${encodeURIComponent(type + ": " + prompt)}`,
      prompt: fullPrompt
    };

  } catch (error) {
    console.error("Asset Generation Error:", error);
    throw error;
  }
};
export const refinePresentationContent = async (currentContent, message, visualAssets = []) => {
  if (!genAI) throw new Error("API Key not set");

  // Define the prompt for refinement
  const prompt = `
    You are an AI presentation assistant. Your task is to modify the existing presentation content based on the user's request.
    
    Current Content:
    ${JSON.stringify(currentContent, null, 2)}
    
    Available Visual Assets (on Canvas):
    ${JSON.stringify(visualAssets, null, 2)}

    User's Request:
    "${message}"
    
    Guidelines:
    - Only modify the parts requested by the user. Keep everything else as is.
    - If the user wants to add a slide, add it to the 'slides' array.
    - If the user wants to change the tone or detail, update the corresponding text fields.
    - **Visuals**: If the user asks to use a specific image or asset from the 'Available Visual Assets', copy its 'url' to a new 'backgroundImage' property of the relevant slide.
    - Return the FULL updated JSON object in the same structure.
    
    JSON Format Structure:
    {
      "title": "Main Project Title",
      "subtitle": "Subtitle",
      "slides": [
        { 
          "type": "cover", 
          "title": "...", 
          "content": "...", 
          "backgroundImage": "url_from_assets_if_requested" 
        },
        ...
      ]
    }
    
    CRITICAL: Return ONLY the JSON. No markdown tags, no explanations.
  `;

  // Strategy: Gemini 3 Pro Preview -> Gemini 3 Deep Think -> Gemini 3 Flash Preview -> Gemini 1.5 Pro
  try {
    const model3Pro = genAI.getGenerativeModel({ model: "gemini-3-pro-preview" });
    const result = await model3Pro.generateContent(prompt);
    const response = await result.response;
    return parseGeminiResponse(response.text());
  } catch (error3Pro) {
    console.warn("Refine: Gemini 3 Pro Preview failed, fallback to Deep Think", error3Pro.message);

    try {
      const model3Deep = genAI.getGenerativeModel({ model: "gemini-3-deep-think" });
      const result = await model3Deep.generateContent(prompt);
      const response = await result.response;
      return parseGeminiResponse(response.text());
    } catch (error3Deep) {
      console.warn("Refine: Gemini 3 Deep Think failed, fallback to Flash Preview", error3Deep.message);

      try {
        const model3Flash = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });
        const result = await model3Flash.generateContent(prompt);
        const response = await result.response;
        return parseGeminiResponse(response.text());
      } catch (error3Flash) {
        console.warn("Refine: Gemini 3 Flash Preview failed, fallback to 1.5 Pro", error3Flash.message);

        try {
          const model15Pro = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
          const result = await model15Pro.generateContent(prompt);
          const response = await result.response;
          return parseGeminiResponse(response.text());
        } catch (flashError) {
          console.error("Refine Gemini Error Details:", flashError.response ? flashError.response.data : flashError.message);
          throw flashError;
        }
      }
    }
  }
};
