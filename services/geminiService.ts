
import { GoogleGenAI } from "@google/genai";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.warn("Gemini API key not found. AI features will be disabled.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });

const fileToGenerativePart = (base64: string, mimeType: string) => {
  return {
    inlineData: {
      data: base64,
      mimeType,
    },
  };
};

export const generateTripSummary = async (journalEntries: string): Promise<string> => {
  if (!API_KEY) return "API Key not configured. Summary feature disabled.";
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Summarize the following travel journal entries into a short, engaging paragraph. Focus on the key experiences and feelings described:\n\n---\n${journalEntries}\n---`,
    });
    return response.text;
  } catch (error) {
    console.error("Error generating trip summary:", error);
    return "Could not generate summary due to an error.";
  }
};

export const generateCaptionForImage = async (base64Image: string): Promise<string> => {
  if (!API_KEY) return "API Key not configured. Caption feature disabled.";
  try {
    const imagePart = fileToGenerativePart(base64Image.split(',')[1], base64Image.split(';')[0].split(':')[1]);
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: [{ text: "Describe this image for a travel journal. Suggest a short, poetic caption." }, imagePart] },
    });
    return response.text;
  } catch (error) {
    console.error("Error generating image caption:", error);
    return "Could not generate caption due to an error.";
  }
};
