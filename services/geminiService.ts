import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AnalysisResult, TranslatedBubble, MangaContext } from "../types";

// Helper to get client. Note: API_KEY is injected via process.env.API_KEY
const getClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

// Helper to clean JSON string from Markdown fences
const cleanJsonString = (text: string): string => {
    let clean = text.trim();
    // Remove markdown code blocks if present
    if (clean.startsWith('```json')) {
        clean = clean.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (clean.startsWith('```')) {
        clean = clean.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    return clean;
};

/**
 * 1. Identifies the manga series from a page image.
 */
export const identifyMangaTitle = async (base64Image: string, mimeType: string): Promise<string> => {
    const ai = getClient();
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    { inlineData: { mimeType, data: base64Image } },
                    { text: "Identify the manga series shown in this image. Return ONLY the exact title of the series. If you cannot identify it with certainty, return 'Unknown Series'." }
                ]
            }
        });
        return response.text?.trim() || "Unknown Series";
    } catch (error) {
        console.error("Identification failed:", error);
        return "Unknown Series";
    }
};

/**
 * 2. Fetches context (plot, characters) using Google Search grounding.
 */
export const getMangaContext = async (title: string): Promise<MangaContext> => {
    const ai = getClient();
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Search for the manga series "${title}". Provide a structured summary including:
            1. A brief plot summary (max 2 sentences).
            2. A list of main character names with their official localized spellings.
            3. Key terminology, specific glossary terms, or lore definitions.
            4. The genre and general tone (e.g., comedic, dark, formal).
            Keep the total output under 400 words.`,
            config: {
                tools: [{ googleSearch: {} }]
            }
        });

        const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks
            ?.map((chunk: any) => chunk.web ? { uri: chunk.web.uri, title: chunk.web.title } : null)
            .filter(Boolean) as { uri: string, title: string }[] || [];

        return {
            title,
            info: response.text || "No context found.",
            sources
        };
    } catch (error) {
        console.error("Context search failed:", error);
        throw error;
    }
};

/**
 * Translates manga page text using Gemini 2.5 Flash with JSON schema for structured output.
 * Optionally accepts series context to improve accuracy.
 */
export const translateMangaPage = async (
    base64Image: string, 
    mimeType: string, 
    context?: string,
    targetLanguage: string = 'English'
): Promise<AnalysisResult> => {
    const ai = getClient();
    
    const bubbleSchema: Schema = {
        type: Type.OBJECT,
        properties: {
            id: { type: Type.STRING, description: "Unique identifier for the bubble, e.g., 'b1'" },
            originalText: { type: Type.STRING, description: "The original text detected." },
            translatedText: { type: Type.STRING, description: `The ${targetLanguage} translation of the text.` },
            speaker: { type: Type.STRING, description: "Inferred speaker or 'SFX' for sound effects." },
            boundingBox: {
                type: Type.ARRAY,
                description: "The bounding box of the text bubble in [ymin, xmin, ymax, xmax] format, normalized to 0-1000. It must be TIGHT around the text.",
                items: { type: Type.INTEGER }
            }
        },
        required: ["id", "originalText", "translatedText", "boundingBox"]
    };

    const responseSchema: Schema = {
        type: Type.OBJECT,
        properties: {
            summary: { type: Type.STRING, description: "A brief summary of what is happening in this page." },
            bubbles: {
                type: Type.ARRAY,
                items: bubbleSchema,
                description: "List of all text bubbles and sound effects detected."
            }
        },
        required: ["summary", "bubbles"]
    };

    const prompt = `
    You are an expert Manga Translator and Localizer.

    TARGET LANGUAGE: ${targetLanguage}

    ${context ? `
    === SERIES CONTEXT & GLOSSARY ===
    ${context}
    =================================
    INSTRUCTION: 
    - You MUST use the character names and terminology provided in the context above.
    - Match the tone described in the context.
    ` : ''}

    TASK:
    Analyze the provided manga page image.
    1. Detect ALL text elements: speech bubbles, narration boxes, floating text, and sound effects (SFX).
    2. Extract original text and translate to ${targetLanguage}.
    3. Return STRICT JSON.

    CRITICAL RULES - READ CAREFULLY:
    1. **ONE VISUAL BUBBLE = ONE JSON OBJECT**.
       - NEVER merge text from multiple bubbles into a single result, even if they form one sentence.
       - If a character says "Hello..." in one bubble and "...world" in another, output TWO separate objects with their own bounding boxes.
       - Do not combine text from adjacent bubbles.
    2. **PRECISE BOUNDING BOXES**:
       - Coordinates [ymin, xmin, ymax, xmax] (0-1000 scale) must frame the TEXT closely, not the whole white bubble space.
    3. **SFX & SIDE TEXT**:
       - Include small handwriting and sound effects. Label speaker as "SFX" for sound effects.
    4. **NO HALLUCINATIONS**:
       - Do not invent text that isn't visually present.
    `;

    try {
        // Create a timeout promise to prevent indefinite hanging
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error("Translation request timed out after 60 seconds")), 60000)
        );

        const apiCall = ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    { inlineData: { mimeType, data: base64Image } },
                    { text: prompt }
                ]
            },
            config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
                systemInstruction: `You are a professional manga translator. You provide accurate translations in ${targetLanguage}. You NEVER merge distinct text bubbles. Each visual text area gets its own bounding box.`,
                temperature: 0.4,
            }
        });

        const response: any = await Promise.race([apiCall, timeoutPromise]);
        const text = response.text;
        
        if (!text) throw new Error("No response text from Gemini");
        
        // Clean and parse JSON
        let result;
        try {
            result = JSON.parse(cleanJsonString(text)) as { bubbles: any[], summary: string };
        } catch (parseError) {
            console.error("JSON Parsing failed. Raw text:", text);
            throw new Error("Failed to parse model response.");
        }
        
        // Map schema result to internal type
        const typedBubbles: TranslatedBubble[] = result.bubbles.map((b: any) => ({
            id: b.id,
            originalText: b.originalText,
            translatedText: b.translatedText,
            speaker: b.speaker,
            boundingBox: b.boundingBox && b.boundingBox.length === 4 ? {
                ymin: b.boundingBox[0],
                xmin: b.boundingBox[1],
                ymax: b.boundingBox[2],
                xmax: b.boundingBox[3]
            } : undefined
        }));

        return {
            summary: result.summary,
            bubbles: typedBubbles
        };

    } catch (error) {
        console.error("Translation failed:", error);
        throw error;
    }
};

/**
 * Streaming chat with Gemini 3 Pro Preview
 */
export const createChatSession = () => {
    const ai = getClient();
    return ai.chats.create({
        model: 'gemini-3-pro-preview',
        config: {
            systemInstruction: "You are a knowledgeable anime and manga assistant. You help users find series, understand lore, and discuss plot points. Be enthusiastic and helpful.",
        }
    });
};

/**
 * Generates an image using Gemini 3 Pro Image Preview (Nano Banana Pro).
 */
export const generateMangaImage = async (prompt: string, size: string): Promise<string> => {
    const ai = getClient();
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-image-preview',
            contents: {
                parts: [{ text: prompt }]
            },
            config: {
                imageConfig: {
                    imageSize: size,
                    aspectRatio: "1:1"
                }
            }
        });

        // Find the image part. The output response may contain both image and text parts.
        const candidates = response.candidates;
        if (candidates && candidates.length > 0) {
            const parts = candidates[0].content?.parts;
            if (parts) {
                for (const part of parts) {
                    if (part.inlineData && part.inlineData.data) {
                        const mimeType = part.inlineData.mimeType || 'image/png';
                        return `data:${mimeType};base64,${part.inlineData.data}`;
                    }
                }
            }
        }
        
        throw new Error("No image data found in response");
    } catch (error) {
        console.error("Image generation failed:", error);
        throw error;
    }
};