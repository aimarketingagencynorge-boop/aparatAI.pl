import { GoogleGenAI, Type } from "@google/genai";
import { STUDIO_STYLES } from "./legacy-types.mjs";
const parseSafeJson = (text) => {
    if (!text)
        return null;
    try {
        const cleanJson = text.replace(/```json|```/g, "").trim();
        const jsonMatch = cleanJson.match(/[\{\[][\s\S]*[\}\]]/);
        return JSON.parse(jsonMatch ? jsonMatch[0] : cleanJson);
    }
    catch (e) {
        console.error("Critical JSON Parse Error", text);
        throw new Error("AI returned invalid data format.");
    }
};
const getApiKey = () => {
    return process.env.API_KEY || process.env.GEMINI_API_KEY || "";
};
async function withRetry(fn, maxRetries = 5) {
    let lastError;
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await fn();
        }
        catch (error) {
            lastError = error;
            const errorMsg = error.message || (typeof error === 'string' ? error : "");
            const status = error.status || error.response?.status || (error.CODE ? parseInt(error.CODE) : undefined);
            // Handle specific API Key errors
            if (errorMsg.includes("API_KEY_INVALID") ||
                errorMsg.toLowerCase().includes("expired") ||
                status === 401) {
                throw new Error("API_KEY_ERROR: Twój klucz API wygasł lub jest nieprawidłowy. Zaktualizuj go w ustawieniach.");
            }
            // Handle Permission Denied - often means the model is not available for this key/region
            if (status === 403 || errorMsg.toLowerCase().includes("permission_denied") || errorMsg.toLowerCase().includes("forbidden")) {
                throw error;
            }
            // Handle Quota, Gateway and Internal Errors with exponential backoff
            if (status === 429 || status === 502 || status === 503 || status === 504 || errorMsg.includes("RESOURCE_EXHAUSTED") || (status && status >= 500)) {
                console.warn(`Retry attempt ${i + 1} for status ${status}...`);
                // Longer delay for 502/504
                const baseDelay = (status === 502 || status === 504) ? 3000 : 1000;
                const delay = Math.pow(2, i + 1) * baseDelay + Math.random() * 1000;
                await new Promise(r => setTimeout(r, delay));
                continue;
            }
            throw error;
        }
    }
    throw lastError;
}
export const analyzeErrorWithAI = async (error, context) => {
    const apiKey = getApiKey();
    if (!apiKey)
        return "Brak klucza API. Skonfiguruj go w ustawieniach.";
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `An error occurred: ${error}. Context: ${context}. Explain in Polish what happened and how to fix it. Be concise.`;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview', // Using guideline recommended model
            contents: prompt,
        });
        return response.text || "Błąd analizy.";
    }
    catch (err) {
        return "Krytyczny błąd połączenia z silnikiem AI.";
    }
};
export const analyzeFoodImage = async (base64Image) => {
    return withRetry(async () => {
        const apiKey = getApiKey();
        const ai = new GoogleGenAI({ apiKey });
        const prompt = `Analyze this product image and return JSON:
      1. productName, 2. visualCharacteristics, 3. lightingAnalysis, 4. segmentationFocus, 5. aiPromptSuggestion, 6. colorPalette (hex array).`;
        const cleanBase64 = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: {
                parts: [
                    { text: prompt },
                    { inlineData: { mimeType: 'image/jpeg', data: cleanBase64 } }
                ]
            },
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        productName: { type: Type.STRING },
                        visualCharacteristics: { type: Type.STRING },
                        lightingAnalysis: { type: Type.STRING },
                        segmentationFocus: { type: Type.STRING },
                        aiPromptSuggestion: { type: Type.STRING },
                        colorPalette: { type: Type.ARRAY, items: { type: Type.STRING } },
                    },
                    required: ["productName", "visualCharacteristics", "lightingAnalysis", "segmentationFocus", "aiPromptSuggestion", "colorPalette"]
                }
            }
        });
        return parseSafeJson(response.text);
    });
};
export const generateStudioBackground = async (item, settings, forceFlash = false) => {
    const nonce = Math.random().toString(36).substring(7);
    const apiKey = getApiKey();
    const executeGeneration = async (modelName, sizeOverride) => {
        const ai = new GoogleGenAI({ apiKey });
        const selectedStyle = STUDIO_STYLES.find(s => s.id === settings.backgroundStyle) || STUDIO_STYLES[0];
        const isRefresh = !!item.transformedImage;
        const prompt = `MAINTAIN PRODUCT INTEGRITY. Luxury commercial photo of ${item.analysis?.productName || 'product'}.
      STYLE: ${selectedStyle.label} (${selectedStyle.prompt}).
      LIGHTING: ${settings.lightingType}, cinematic HDR.
      COMPOSITION: ${settings.angle}, ${settings.presentationType}.
      REFINEMENT: ${settings.refinementText}.
      ${isRefresh ? "VARIATION: This is a subsequent take. Provide a new, fresh perspective. Change lighting nuances slightly." : ""}
      SEED: ${nonce}`;
        const cleanBase64 = item.originalImage.includes(',') ? item.originalImage.split(',')[1] : item.originalImage;
        // Map quality to resolution
        const size = sizeOverride || (settings.quality === '4k' ? '4K' : (settings.quality === 'hd' ? '2K' : '1K'));
        // Fallback aspect ratio for 2.5-flash if unsupported
        const supportedFlashRatios = ["1:1", "3:4", "4:3", "9:16", "16:9"];
        let finalAspectRatio = settings.aspectRatio;
        if (modelName.includes('2.5-flash') && !supportedFlashRatios.includes(settings.aspectRatio)) {
            if (settings.aspectRatio === '3:2')
                finalAspectRatio = '4:3';
            else if (settings.aspectRatio === '2:3')
                finalAspectRatio = '3:4';
            else
                finalAspectRatio = '1:1';
        }
        const response = await ai.models.generateContent({
            model: modelName,
            contents: {
                parts: [
                    { inlineData: { data: cleanBase64, mimeType: 'image/jpeg' } },
                    { text: prompt }
                ]
            },
            config: {
                imageConfig: {
                    aspectRatio: finalAspectRatio,
                    ...(modelName.includes('pro') || modelName.includes('3.1-flash') ? { imageSize: size } : {})
                }
            }
        });
        for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData)
                return `data:image/png;base64,${part.inlineData.data}`;
        }
        throw new Error("No image in response.");
    };
    try {
        let preferredModel = forceFlash ? 'gemini-2.5-flash-image' :
            (settings.modelPreference === 'flash' ? 'gemini-2.5-flash-image' : 'gemini-3.1-flash-image-preview');
        return await withRetry(() => executeGeneration(preferredModel));
    }
    catch (err) {
        const errorMsg = err.message?.toLowerCase() || "";
        const status = err.status || err.response?.status || (err.CODE ? parseInt(err.CODE) : undefined);
        // If it's a 502/504 on a high-res model, try 1K first before switching to Flash
        if ((status === 502 || status === 504 || errorMsg.includes("502")) && !forceFlash && settings.quality !== 'standard') {
            console.warn("Retrying with 1K resolution due to Gateway error...");
            try {
                return await withRetry(() => executeGeneration('gemini-3.1-flash-image-preview', '1K'));
            }
            catch (innerErr) {
                // Fall through to Flash fallback
            }
        }
        if (status === 429 || status === 502 || status === 503 || status === 504 ||
            errorMsg.includes("resource_exhausted") || errorMsg.includes("502") || errorMsg.includes("gateway") ||
            status === 403 || errorMsg.toLowerCase().includes("permission_denied") || errorMsg.toLowerCase().includes("forbidden") || errorMsg.includes("not found")) {
            console.warn("Retrying with Flash due to Pro Quota, Gateway or Permission issues...");
            return await withRetry(() => executeGeneration('gemini-2.5-flash-image'));
        }
        throw err;
    }
};
export const generateStudioVideo = async (item, settings) => {
    return withRetry(async () => {
        const apiKey = getApiKey();
        const ai = new GoogleGenAI({ apiKey });
        const baseImg = item.transformedImage || item.originalImage;
        const cleanBase64 = baseImg.includes(',') ? baseImg.split(',')[1] : baseImg;
        let operation = await ai.models.generateVideos({
            model: 'veo-3.1-lite-generate-preview',
            prompt: `Professional cinematic food commercial of ${item.analysis?.productName || 'product'}. High quality.`,
            image: {
                imageBytes: cleanBase64,
                mimeType: 'image/png',
            },
            config: {
                numberOfVideos: 1,
                resolution: '1080p',
                aspectRatio: settings.aspectRatio === '16:9' ? '16:9' : '9:16'
            }
        });
        while (!operation.done) {
            await new Promise(resolve => setTimeout(resolve, 10000));
            operation = await ai.operations.getVideosOperation({ operation: operation });
        }
        const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (!downloadLink)
            throw new Error("Video generation failed - no URI.");
        const videoResponse = await fetch(downloadLink, {
            method: 'GET',
            headers: {
                'x-goog-api-key': apiKey,
            },
        });
        if (!videoResponse.ok) {
            const errorText = await videoResponse.text();
            throw new Error(`Video download failed (${videoResponse.status}): ${errorText}`);
        }
        const blob = await videoResponse.blob();
        return URL.createObjectURL(blob);
    });
};
export const generateDishImageFromMenu = async (dish, settings, individualRefinement, forceFlash = false, isRefresh = false) => {
    const nonce = Math.random().toString(36).substring(7);
    const apiKey = getApiKey();
    const executeGeneration = async (modelName, sizeOverride) => {
        const ai = new GoogleGenAI({ apiKey });
        const selectedStyle = STUDIO_STYLES.find(s => s.id === settings.backgroundStyle) || STUDIO_STYLES[0];
        const prompt = `CRITICAL: WORLD-CLASS LUXURY FOOD PHOTOGRAPHY.
      SUBJECT: A gourmet presentation of "${dish.name}".
      DESCRIPTION: ${dish.description}.
      SCENOGRAPHY: ${dish.suggestedScenography || "Elegant restaurant setting"}.
      STYLE: ${selectedStyle.label} (${selectedStyle.prompt}).
      LIGHTING: ${settings.lightingType}, professional culinary lighting, cinematic soft-box.
      COMPOSITION: ${settings.angle}, ${settings.presentationType}.
      REFINEMENT: ${individualRefinement || "Appetizing, high-end restaurant magazine quality"}.
      ${isRefresh ? "VARIATION: This is a REFRESH attempt. Ensure visual differences from previous generations. New composition." : ""}
      TECHNICAL: 8k resolution, ultra-realistic textures, perfect focus, photorealistic.
      SEED: ${nonce}`;
        const size = sizeOverride || (settings.quality === '4k' ? '4K' : (settings.quality === 'hd' ? '2K' : '1K'));
        // Fallback aspect ratio for 2.5-flash if unsupported
        const supportedFlashRatios = ["1:1", "3:4", "4:3", "9:16", "16:9"];
        let finalAspectRatio = settings.aspectRatio;
        if (modelName.includes('2.5-flash') && !supportedFlashRatios.includes(settings.aspectRatio)) {
            if (settings.aspectRatio === '3:2')
                finalAspectRatio = '4:3';
            else if (settings.aspectRatio === '2:3')
                finalAspectRatio = '3:4';
            else
                finalAspectRatio = '1:1';
        }
        const response = await ai.models.generateContent({
            model: modelName,
            contents: { parts: [{ text: prompt }] },
            config: {
                imageConfig: {
                    aspectRatio: finalAspectRatio,
                    ...(modelName.includes('pro') || modelName.includes('3.1-flash') ? { imageSize: size } : {})
                }
            }
        });
        for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData)
                return `data:image/png;base64,${part.inlineData.data}`;
        }
        throw new Error("No image generated.");
    };
    try {
        let preferredModel = forceFlash ? 'gemini-2.5-flash-image' :
            (settings.modelPreference === 'flash' ? 'gemini-2.5-flash-image' : 'gemini-3.1-flash-image-preview');
        return await withRetry(() => executeGeneration(preferredModel));
    }
    catch (err) {
        const errorMsg = err.message?.toLowerCase() || "";
        const status = err.status || err.response?.status || (err.CODE ? parseInt(err.CODE) : undefined);
        // If it's a 502/504 on a high-res model, try 1K first before switching to Flash
        if ((status === 502 || status === 504 || errorMsg.includes("502")) && !forceFlash && settings.quality !== 'standard') {
            console.warn("Retrying with 1K resolution for Menu Dish due to Gateway error...");
            try {
                return await withRetry(() => executeGeneration('gemini-3.1-flash-image-preview', '1K'));
            }
            catch (innerErr) {
                // Fall through to Flash fallback
            }
        }
        if (status === 429 || status === 502 || status === 503 || status === 504 ||
            errorMsg.includes("resource_exhausted") || errorMsg.includes("502") || errorMsg.includes("gateway") ||
            status === 403 || errorMsg.toLowerCase().includes("permission_denied") || errorMsg.toLowerCase().includes("forbidden") || errorMsg.includes("not found")) {
            console.warn("Retrying with Flash for Menu Dish due to Pro Quota, Gateway or Permission issues...");
            return await withRetry(() => executeGeneration('gemini-2.5-flash-image'));
        }
        throw err;
    }
};
export const generateSocialAsset = async (item, style, customPrompt, ratio) => {
    const apiKey = getApiKey();
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `Social media ad for ${item.analysis?.productName}. Style: ${style.label}.`;
    const baseImg = item.transformedImage || item.originalImage;
    const cleanBase = baseImg.includes(',') ? baseImg.split(',')[1] : baseImg;
    const supportedFlashRatios = ["1:1", "3:4", "4:3", "9:16", "16:9"];
    let finalAspectRatio = ratio;
    if (!supportedFlashRatios.includes(ratio)) {
        if (ratio === '3:2')
            finalAspectRatio = '4:3';
        else if (ratio === '2:3')
            finalAspectRatio = '3:4';
        else
            finalAspectRatio = '1:1';
    }
    const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-image-preview',
        contents: {
            parts: [
                { inlineData: { data: cleanBase, mimeType: 'image/jpeg' } },
                { text: prompt }
            ]
        },
        config: { imageConfig: { aspectRatio: finalAspectRatio } }
    });
    for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData)
            return `data:image/png;base64,${part.inlineData.data}`;
    }
    throw new Error("Social generation failed.");
};
export const generateSocialCopy = async (dishName, characteristics, styleLabel) => {
    const apiKey = getApiKey();
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Social media copy for ${dishName} in ${styleLabel} style. Output JSON.`,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    elegant: { type: Type.OBJECT, properties: { slogan: { type: Type.STRING }, content: { type: Type.STRING }, hashtags: { type: Type.ARRAY, items: { type: Type.STRING } }, cta: { type: Type.STRING } }, required: ["slogan", "content", "hashtags", "cta"] },
                    promo: { type: Type.OBJECT, properties: { slogan: { type: Type.STRING }, content: { type: Type.STRING }, hashtags: { type: Type.ARRAY, items: { type: Type.STRING } }, cta: { type: Type.STRING } }, required: ["slogan", "content", "hashtags", "cta"] },
                    storytelling: { type: Type.OBJECT, properties: { slogan: { type: Type.STRING }, content: { type: Type.STRING }, hashtags: { type: Type.ARRAY, items: { type: Type.STRING } }, cta: { type: Type.STRING } }, required: ["slogan", "content", "hashtags", "cta"] }
                },
                required: ["elegant", "promo", "storytelling"]
            }
        }
    });
    return parseSafeJson(response.text);
};
export const parseMenuText = async (text) => {
    const apiKey = getApiKey();
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `Extract all dishes from the following menu text and return them as a JSON array of objects.
    Each object must have:
    - name: The name of the dish.
    - description: A brief, appetizing description of the dish.
    - price: The price as listed in the text.
    - suggestedScenography: A short suggestion for a background/setting for a professional photo of this dish.
    
    Menu Text:
    ${text}`;
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING },
                        description: { type: Type.STRING },
                        price: { type: Type.STRING },
                        suggestedScenography: { type: Type.STRING },
                    },
                    required: ["name", "description", "price", "suggestedScenography"]
                }
            }
        }
    });
    return parseSafeJson(response.text);
};
export const extractMenuFromImage = async (base64Image) => {
    return withRetry(async () => {
        const apiKey = getApiKey();
        const ai = new GoogleGenAI({ apiKey });
        const cleanBase64 = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;
        const prompt = "Extract all text from this menu image. Preserve the structure and all details about dishes, descriptions, and prices.";
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: {
                parts: [
                    { text: prompt },
                    { inlineData: { mimeType: 'image/jpeg', data: cleanBase64 } }
                ]
            }
        });
        return response.text || "";
    });
};
export const runDiagnosticAudit = async (report) => {
    const apiKey = getApiKey();
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Analyze system health report: ${JSON.stringify(report)}`,
    });
    return response.text || "Diagnostic failed.";
};
export const runAutoFixEngine = async (error, context) => {
    const apiKey = getApiKey();
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Fix this error: ${error} in context: ${context}. Output JSON.`,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    action: { type: Type.STRING },
                    explanation: { type: Type.STRING }
                },
                required: ["action", "explanation"]
            }
        }
    });
    return parseSafeJson(response.text);
};
