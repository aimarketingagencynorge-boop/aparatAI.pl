import { GoogleGenAI } from "@google/genai";

async function test() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-image-preview',
      contents: "A test image",
      config: {
        imageConfig: {
          aspectRatio: "3:2" as any
        }
      }
    });
    console.log("Success!");
  } catch (e) {
    console.error("Error:", e);
  }
}

test();
