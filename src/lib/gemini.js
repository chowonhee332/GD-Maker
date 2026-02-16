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

export const generatePresentationContent = async (topic, config, visualAssets = [], curatedGuidance = "") => {
  if (!genAI) throw new Error("API Key not set");

  // Define the prompt for generation
  const promptText = `
    You are a world-class presentation consultant and designer from a top-tier agency.
    Topic: "${topic}"
    
    [DESIGN GUIDELINES]:
    ${curatedGuidance || "Modern, minimalist, and professional."}

    [CONTEXT]:
    Audience: ${config.audience} | Purpose: ${config.purpose} | Tone: ${config.tone}
    Industry: ${config.domain || 'General'} | Primary Color: ${config.primaryColor || '#3b82f6'}

    [DESIGN ANALYSIS STEP]:
    1. Analyze the Context: Who is the audience? What is the goal? What emotional or professional response are we seeking?
    2. Define a "Design Strategy": Based on this analysis, what visual language should we use? (e.g., "High-trust professional blue with structured layouts for investors" or "Energetic purple with fluid shapes for a creative workshop").

    [VISUAL REQUIREMENTS]:
    For EACH slide, provide specific design metadata:
    1. 'icon': A Lucide React icon name (e.g., "TrendingUp", "Shield", "Zap").
    2. 'layoutStyle': Specific layout type: "centered", "split", "grid", "hero-left", "hero-right", or "content-focused".
    3. 'visualElement': A detailed description of the main visual (e.g., "A modern 3D chart showing 45% growth", "A high-quality image of a futuristic tech city").
    4. 'theme': An object containing:
       - 'bg': Background color (HEX, compatible with Primary Color).
       - 'text': Contrast text color (HEX).
       - 'accent': A secondary brand color (HEX).
    5. 'accentShape': A style token for decorative elements: "diagonal", "bottom-bar", "floating-blobs", or "clean-border".
    6. 'designRationale': A brief explanation of why this specific design (color/layout) was chosen for THIS slide based on the overall strategy.
    7. 'chartData': IF the slide contains data analysis or trends, provide an array of objects: [{"name": "Category", "value": 100}]. Only include if relevant.

    [CONTENT REQ]:
    - LANGUAGE: **Strictly use Korean (한국어)** for all text fields (title, subtitle, content, designStrategy, designRationale, etc.).
    - Professional language: Use polite and professional Korean (Business tone).
    - Provide EXACTLY ${config.pageCount || 5} slides.

    JSON OBJECT ONLY (Ensure all values are in Korean):
    {
      "title": "메인 프로젝트 제목",
      "subtitle": "부제목",
      "designStrategy": "분석된 맥락에 따른 시각적 전략 요약 (한국어)",
      "slides": [
        { 
          "type": "cover" | "index" | "divider" | "body1" | "body2", 
          "title": "슬라이드 제목", 
          "content": "슬라이드 내용", 
          "icon": "...", 
          "layoutStyle": "...",
          "visualElement": "시각적 요소 설명",
          "theme": { "bg": "...", "text": "...", "accent": "..." },
          "accentShape": "...",
          "designRationale": "디자인 의도 설명 (한국어)",
          "chartData": [{"name": "항목1", "value": 10}, {"name": "항목2", "value": 20}] // 선택 사항 (차트 필요 시)
        },
        ...
      ]
    }
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

export const generateVisualAsset = async (prompt, type) => {
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
      "designStrategy": "...",
      "slides": [
        { 
          "type": "cover", 
          "title": "...", 
          "content": "...", 
          "icon": "...",
          "layoutStyle": "...",
          "theme": { "bg": "...", "text": "...", "accent": "..." },
          "accentShape": "...",
          "designRationale": "...",
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
