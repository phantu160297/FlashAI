import { GoogleGenAI, Type } from "@google/genai";
import { Flashcard, GenerationParams } from "../types";

// Initialize the Gemini API client
// Note: process.env.API_KEY is injected by the environment.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateVocabularyDeck = async (params: GenerationParams): Promise<{ title: string; description: string; cards: Omit<Flashcard, 'id'>[] }> => {
  const modelId = "gemini-2.5-flash"; // Efficient and fast for structured text generation

  const prompt = `
    Act as the Cambridge Dictionary. Create a vocabulary list for learning English.
    Topic: ${params.topic}
    Level: ${params.level}
    Number of words: ${params.count}
    
    Target Audience: Vietnamese speakers learning English.
    
    Return a structured JSON object with a creative title for the deck, a short description, and the list of words.
    
    For each card:
    1. 'word': The English word.
    2. 'pronunciation': The IPA (International Phonetic Alphabet) transcription (e.g., /həˈləʊ/).
    3. 'definition': The definition translated into VIETNAMESE (Tiếng Việt).
    4. 'example': An example sentence in English.
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "A catchy title for this vocabulary set" },
            description: { type: Type.STRING, description: "A brief description of what this set covers" },
            cards: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  word: { type: Type.STRING },
                  definition: { type: Type.STRING, description: "Definition in Vietnamese" },
                  example: { type: Type.STRING },
                  pronunciation: { type: Type.STRING, description: "IPA format" },
                },
                required: ["word", "definition", "example", "pronunciation"],
              },
            },
          },
          required: ["title", "description", "cards"],
        },
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response generated from Gemini.");
    }

    const data = JSON.parse(text);
    return data;

  } catch (error) {
    console.error("Error generating vocabulary deck:", error);
    throw error;
  }
};