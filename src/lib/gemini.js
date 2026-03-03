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

export const generatePresentationContent = async (topic, config, visualAssets = [], curatedGuidance = "", slidePrompts = null, slideImages = null) => {
  if (!genAI) throw new Error("API Key not set");

  const requestType = config?.options?.requestType || '제안/제언';

  // Define the prompt for generation
  const promptText = `
    You are a world-class presentation designer and editorial director.
    Topic: "${topic}"
    Request Type (Document Purpose): "${requestType}"
    
    [DOCUMENT PURPOSE INSTRUCTION]:
    - Adjust the tone, depth, and structure of the content to perfectly match the Request Type.
    - "제안/제언 (Proposal)": Persuasive, detailed, focus on value propositions, solutions, and strategic benefits.
    - "발표본 (Presentation)": Concise, highly visual, focus on key talking points, bulleted lists, and impactful statements.
    - "요약서 (Summary)": Brief, executive-level focus, key insights, and bottom-line conclusions.
    
    [DESIGN PHILOSOPHY - PREMIUM EDITORIAL]:
- **Mimicry vs. Reuse**: The provided images are for **STYLE REFERENCE ONLY**. 
- **DO NOT** reuse the content or actual images from the reference. Instead, analyze their "Vibe" (e.g., clean white space, thin lines, minimalist photography).
- **Default Theme**: Favor "Premium Light" (White/Soft Gray backgrounds) unless Dark Mode is explicitly requested. Avoid heavy dark gradients.
- **Layout Choices (STRICT ADHERENCE REQUIRED)**: 
  - "premium-cover-spoke": **(MANDATORY for COVER slides)**. Solid black background, large bold typography at bottom-left, spoke graphic on the right.
  - "premium-agenda-spoke": **(MANDATORY for INDEX/AGENDA slides)**. White background, starburst graphic top-right, central agenda list.
  - "premium-section-spoke": **(MANDATORY for SECTION Break / 간지 slides)**. Beige background (#DBD7CA), CHAPTER number + Title at bottom-left, spoke graphic on the right.
  - "modern-editorial": **(DEFAULT for ALL BODY / 속지 slides)**. High-fidelity grid layout with distinct title area and large visual asset.
  - "data-focus": Only for complex data/charts.

    [PRECISE SCHEMAS]:
    1. 'type': "cover", "index", "section", "body1", "body2"
    2. 'title', 'subtitle', 'content' (Professional & Insightful)
    3. 'visualPrompt': Detailed image generation prompt.
    4. 'layoutStyle': Must be exactly one of: "premium-cover-spoke" (Cover), "premium-agenda-spoke" (Index), "premium-section-spoke" (Divider), "modern-editorial" (Body)
    5. 'layoutProps': {
        "headerBadge": "Short label (e.g. INSIGHT, ANALYSIS, STRATEGY, HIGHLIGHT)",
        "accentNote": "Supporting bold info",
        "themeMode": "light" | "dark"
    }

    [CONTENT REQ]:
- **Topic Context**: Use "${topic}" as the core. 
- **Language**: English for slide content, Korean for 'assistantMessage'.
- **Design Intent**: Enforce a High-Density, Premium Editorial aesthetic. Use concise but deeply professional business language. Titles must be bold and short (Max 4 words). Body text must be dense, analytical, and informative.
- **Strict Layout Mapping**:
   - Cover Slide -> MUST use "premium-cover-spoke". Content should be highly strategic.
   - Index/Agenda -> MUST use "premium-agenda-spoke".
   - Section Divider -> MUST use "premium-section-spoke".
   - General Content -> MUST use "modern-editorial". Body content must be at least 3-4 sentences of deep analysis.

    JSON OBJECT ONLY:
    {
      "title": "...",
      "slides": [
        { 
          "type": "...", 
          "title": "...", 
          "content": "Line 1\\n\\nLine 2", 
          "visualPrompt": "Detailed English prompt for NEW image generation",
          "layoutStyle": "modern-editorial",
          "layoutProps": { "themeMode": "light", ... },
          "styleTokens": { "bgBase": "#FFFFFF", "textColor": "#1A1A1A", "primaryColor": "#00C73C" }
        }
      ]
    }
  `;

  // Prepare input parts (Prompt + Images)
  const imageParts = await Promise.all(visualAssets.map(fileToGenerativePart));
  const inputParts = [promptText, ...imageParts];

  // Strategy: Main Brain - Planner (using available 2.5-flash acting as Pro)
  try {
    console.log(`[Gemini Planner] Planning slide structure for topic: "${topic}"...`);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(inputParts);
    return parseGeminiResponse(await result.response.text());
  } catch (err) {
    console.error("[Gemini] Primary Generation failed:", err.message);
    console.warn("Generation: Planner failed, trying fallback:", err.message);
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      const result = await model.generateContent(inputParts);
      return parseGeminiResponse(await result.response.text());
    } catch (finalErr) {
      console.error("[Gemini] All generation models failed. Final Error:", finalErr.message);
      throw finalErr;
    }
  }
};

const parseGeminiResponse = (text) => {
  try {
    let cleanedText = text.trim();
    // Remove Markdown code blocks
    cleanedText = cleanedText.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();

    // Fix common JSON truncation or unescaped characters
    // (Basic attempt to close open braces if truncated)
    let openBraces = (cleanedText.match(/\{/g) || []).length;
    let closeBraces = (cleanedText.match(/\}/g) || []).length;
    if (openBraces > closeBraces) {
      cleanedText += '}'.repeat(openBraces - closeBraces);
    }

    return JSON.parse(cleanedText);
  } catch (err) {
    console.error("JSON Parse Error. Raw text:", text);
    // Attempt a more aggressive clean if first pass fails
    try {
      const match = text.match(/\{[\s\S]*\}/);
      if (match) return JSON.parse(match[0]);
    } catch (innerErr) { }
    throw new Error("Failed to parse AI response: " + err.message);
  }
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

  console.log("[Visual Editor] Generating visual asset for:", fullPrompt);

  try {
    const model = genAI.getGenerativeModel({ model: "imagen-3.0-generate-001" });
    const response = await model.generateContent({
      contents: [
        { role: 'user', parts: [{ text: fullPrompt }] }
      ],
      generationConfig: {
        responseModalities: ["IMAGE"]
      }
    });

    const result = await response.response;
    for (const part of result.candidates[0].content.parts) {
      if (part.inlineData) {
        return {
          success: true,
          imageUrl: `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`,
          prompt: fullPrompt
        };
      }
    }

    throw new Error("No image data returned from generation.");
  } catch (error) {
    console.error("[Gemini] Asset Generation Error:", error.message);
    console.warn("Falling back to placeholder image...");
    const seed = Math.floor(Math.random() * 1000);
    const searchUrl = `https://picsum.photos/seed/${seed}/1200/800`;

    return {
      success: true,
      imageUrl: searchUrl,
      prompt: fullPrompt
    };
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
    
    [AGENT BEHAVIOR]:
    1. Determine if the user wants to **modify slides** (action: "refine") or **just talk/ask questions** (action: "chat").
    2. If the user asks to "Change", "Modify", "FIX", "Update", or "Apply [USE_ASSET]", set action to "refine".
    
    [ASSET USAGE & LAYOUT ENGINE]:
    - If [USE_ASSET: url] is provided alongside the user's message:
      1. Set the 'visualElement' property of the target slide exactly to the provided URL (e.g., "visualElement": "https://...").
      2. Analyze the image type (e.g., photo vs. isolated 3D icon with a white/transparent background).
      3. Set 'imagePlacement' based on context:
         - "icon-floating": Use for 3D icons, characters, or small graphics that should float next to text.
         - "background-cover": Use for wide, high-quality photos meant as a backdrop.
         - "split-right": Use for landscape photos that need their own structural half.
      4. Set 'imageBlendMode' based on the image's background and the slide's theme:
         - "multiply": CRITICAL for 3D icons or cutouts with white backgrounds being placed on dark or colored slides (removes the white box artifact).
         - "normal": Default for photos or images with intentional backgrounds.
      5. Contextual Theming: Analyze the image's dominant color (e.g., Blue) and update the slide's 'theme.accent' to match it, ensuring visual harmony.

    [STRICT TARGETING]:
    - If 'refine', ONLY modify the slide matching '[TARGET_SLIDE: type]'. Never touch other slides.
    - JSON OUTPUT SCHEMA for modified slides must now include:
      "visualElement": "...", "imagePlacement": "...", "imageBlendMode": "..."
    - Keep the output as high-fidelity JSON.
  `;

  // Prepare input parts (Prompt text + Image parts)
  const imageParts = await Promise.all(visualAssets.filter(asset => {
    // 필터 조건 완화: File 객체이거나 url에 data:image가 포함된 경우 모두 허용
    return asset instanceof File || (asset.url && asset.url.startsWith('data:image'));
  }).map(asset => {
    if (asset instanceof File) return fileToGenerativePart(asset);
    // data:image/png;base64,.... 에서 정확히 데이터 부분만 추출하도록 수정
    const base64Data = asset.url.includes(',') ? asset.url.split(',')[1] : asset.url;
    return { inlineData: { data: base64Data, mimeType: 'image/png' } };
  }));

  const inputParts = [prompt, ...imageParts];

  // Strategy: High-speed Engine (Refiner)
  // - For single-slide refinement, tone changing, summarization
  const primaryModelName = "gemini-2.5-flash";
  const fallbackModelName = "gemini-2.0-flash";

  try {
    const model = genAI.getGenerativeModel({ model: primaryModelName });
    const result = await model.generateContent(inputParts);
    return parseGeminiResponse(await result.response.text());
  } catch (err) {
    console.warn(`Refine: ${primaryModelName} failed, trying fallback ${fallbackModelName}:`, err.message);
    try {
      const model = genAI.getGenerativeModel({ model: fallbackModelName });
      const result = await model.generateContent(inputParts);
      return parseGeminiResponse(await result.response.text());
    } catch (finalErr) {
      console.error("All refinement models failed:", finalErr.message);
      throw finalErr;
    }
  }
};

/**
 * True Background Removal & Image Composition Engine
 * Uses "gemini-3-pro-image-preview" with "IMAGE" response modality to literally return a new transparent PNG pixel data.
 */
export const editVisualAsset = async (imageAsset, prompt, themeParams = {}) => {
  if (!genAI) throw new Error("API Key not set");

  // Format the image for Gemini
  let imagePart;
  if (imageAsset instanceof File) {
    imagePart = await fileToGenerativePart(imageAsset);
  } else if (imageAsset.url && imageAsset.url.startsWith('data:image')) {
    const base64Data = imageAsset.url.includes(',') ? imageAsset.url.split(',')[1] : imageAsset.url;
    imagePart = { inlineData: { data: base64Data, mimeType: 'image/png' } };
  } else {
    throw new Error("Invalid image format provided for background removal.");
  }

  // Construct precise editing instructions
  const editingPrompt = `
    Using the provided image, apply the following modifications:
    ${prompt}

    Additional Theme Constraints:
    - Target Slide Background Tone: ${themeParams.themeMode || 'dark'}
    - Accent Color to Match: ${themeParams.accentColor || '#D1D1C4'}
    
    CRITICAL: Ensure the subject is perfectly extracted, leaving the background 100% transparent. Return a high-quality PNG.
  `;

  const inputParts = [imagePart, editingPrompt];

  console.log("[Visual Editor] Starting True Background Removal & Editing");

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-3-pro-image-preview" });
    const response = await model.generateContent({
      contents: inputParts,
      generationConfig: {
        responseModalities: ["IMAGE"]
      }
    });

    const result = await response.response;
    for (const part of result.candidates[0].content.parts) {
      if (part.inlineData) {
        return {
          success: true,
          base64Data: part.inlineData.data,
          mimeType: part.inlineData.mimeType || 'image/png',
          dataUrl: `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`
        };
      }
    }
    throw new Error("No image data returned from Nano Banana Pro (gemini-3-pro-image-preview).");
  } catch (err) {
    console.error("[Gemini] True Background Removal failed:", err.message);
    throw err;
  }
};

/**
 * Full Slide Image Generation Engine
 * Uses "gemini-3-pro-image-preview" with "IMAGE" response modality to render a complete slide incorporating both visual concept and text.
 */
export const generateSlideImage = async (slideData, themeParams = {}, referenceImage = null) => {
  if (!genAI) throw new Error("API Key not set");

  // Construct a prompt leveraging the AI-generated visualPrompt
  const slidePrompt = `
    Create a HIGH-RESOLUTION (1K), perfectly formatted presentation slide (16:9 aspect ratio).
    You must embed the following text exactly as requested into the image itself.
    
    Slide Type: ${slideData.type}
    Theme Mode: ${themeParams.themeMode || 'light'}
    Accent Color: ${themeParams.accentColor || '#3B82F6'}
    
    [VISUAL CONCEPT AUTOMATICALLY GENERATED BY AI]:
    ${slideData.visualPrompt || 'Professional corporate look'}

    [EXACT TEXT TO RENDER ON IMAGE]:
    Title: "${slideData.title}"
    ${slideData.subtitle ? `Subtitle: "${slideData.subtitle}"` : ''}
    ${slideData.content ? `Body Text:\n${slideData.content}` : ''}
    
    [DESIGN INSTRUCTIONS]:
    Make it look like a highly professional corporate presentation. Strictly follow the [VISUAL CONCEPT] above to create the visual elements, background, and mood. Ensure the typography is clean, contrast is readable, and the text MUST be prominently displayed over the visuals. Provide a beautiful layout that balances text readability and the visual assets seamlessly.
  `;

  let modelName = "imagen-3.0-generate-001";
  let finalPrompt = slidePrompt;

  if (referenceImage) {
    console.log(`[Gemini Image Gen] Using Nano Banana Pro for slide: ${slideData.type} with reference image.`);
    modelName = "gemini-3-pro-image-preview";

    finalPrompt += `\n\n[CRITICAL REFERENCE IMAGE INSTRUCTION]:
    An image is attached to this prompt. You MUST use this attached image as your PRIMARY DESIGN REFERENCE.
    - Copy the EXACT structural layout, visual style, and composition of the attached image.
    - Adapt the colors to match the [Theme Mode] and [Accent Color] if necessary, but keep the core aesthetic identical to the reference.
    - Embed the [EXACT TEXT TO RENDER ON IMAGE] perfectly into the design, replacing any placeholder texts in the reference.
    - DO NOT generate a completely different design; use the reference as your blueprint!`;
  } else {
    console.log(`[Gemini Image Gen] Generating full slide using Imagen 3 for type: ${slideData.type}`);
  }

  let inputParts = [{ text: finalPrompt }];

  if (referenceImage && referenceImage instanceof File) {
    const imagePart = await fileToGenerativePart(referenceImage);
    if (imagePart) inputParts.unshift(imagePart);
  }

  try {
    const model = genAI.getGenerativeModel({ model: modelName });
    const response = await model.generateContent({
      contents: [
        { role: 'user', parts: inputParts }
      ],
      generationConfig: {
        responseModalities: ["IMAGE"]
      }
    });

    const result = await response.response;
    for (const part of result.candidates[0].content.parts) {
      if (part.inlineData) {
        return {
          success: true,
          dataUrl: `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`
        };
      }
    }
    throw new Error("No image data returned from imagen-3.0-generate-001 generation.");
  } catch (err) {
    console.error(`[Gemini Image Gen] Failed for slide ${slideData.type}:`, err.message);
    throw err;
  }
};
