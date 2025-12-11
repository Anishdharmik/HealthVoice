import { GoogleGenAI, Schema, Type } from "@google/genai";
import { Language, Message, Sender } from "../types";

// Initialize Gemini
// Note: In a real backend architecture, the API Key would be server-side.
// Since this is a frontend demo using Gemini to *simulate* the backend intelligence,
// we use the environment variable here.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MODEL_NAME = "gemini-2.5-flash";

// Helper to convert Blob to Base64
export const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Remove data url prefix (e.g. "data:audio/wav;base64,")
      const base64Content = base64String.split(",")[1];
      resolve(base64Content);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

interface SimulationResponse {
  transcription: string;
  responseText: string;
  symptoms: string[];
  diagnosis: string;
  confidence: number;
  recommendedAction: string;
  detectedLanguage: string;
  patientName?: string;
}

/**
 * Simulates the Backend Pipeline:
 * 1. ASR (Audio -> Text)
 * 2. NLP (Symptom Extraction)
 * 3. Model Inference (Prediction)
 * 4. Response Generation
 * 
 * We do this in one robust Gemini call for the purpose of this frontend demo.
 */
export const processAudioInput = async (
  audioBlob: Blob | null,
  textInput: string | null,
  language: Language,
  history: Message[]
): Promise<SimulationResponse> => {
  
  // Construct the prompt context based on history
  const historyContext = history.map(m => `${m.sender}: ${m.text}`).join("\n");

  const systemInstruction = `
    You are a highly advanced medical AI assistant named "HealthVoice".
    
    Current Language Setting: ${language}
    
    CRITICAL INSTRUCTION - NAME EXTRACTION:
    1. If the user input contains a name (e.g., "I am Sarah", "My name is Raj", "Sarah"), YOU MUST extract it into the 'patientName' JSON field.
    2. If the previous message from the BOT asked "May I know your name?", assume the User's next input is their name.
    
    CRITICAL INSTRUCTION - SYMPTOM EXTRACTION:
    1. Extract specific symptoms (e.g., "headache", "nausea", "rash") into the 'symptoms' JSON array.
    2. If the user describes a feeling (e.g., "I feel hot"), map it to a clinical symptom (e.g., "Fever").

    Flow:
    1. Check for Name -> 2. Check for Symptoms -> 3. Triage/Diagnose.
    
    Task:
    1. Transcribe audio if provided.
    2. Extract 'patientName' if detected.
    3. Extract 'symptoms' array.
    4. Predict potential 'diagnosis' and 'confidence' (0-100).
    5. 'recommendedAction': Suggest next steps (Doctor visit vs Home care).
    6. 'responseText': Polite, empathetic response in ${language}.
    
    Output JSON format only.
  `;

  const responseSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      transcription: { type: Type.STRING, description: "The transcription of the user audio, or the text input provided." },
      responseText: { type: Type.STRING, description: "The response to speak back to the user." },
      symptoms: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of extracted symptoms." },
      diagnosis: { type: Type.STRING, description: "Top predicted condition (or 'Pending' if gathering info)." },
      confidence: { type: Type.NUMBER, description: "Confidence score 0-100." },
      recommendedAction: { type: Type.STRING, description: "Short advice on what to do next." },
      detectedLanguage: { type: Type.STRING, description: "The language code detected (en, hi, ta)." },
      patientName: { type: Type.STRING, description: "The patient's name if found in the user's input." }
    },
    required: ["transcription", "responseText", "symptoms", "diagnosis", "confidence", "recommendedAction", "detectedLanguage"]
  };

  try {
    const parts: any[] = [];
    
    // Add History Context
    if (historyContext) {
        parts.push({ text: `Conversation History:\n${historyContext}\n---End History---\n` });
    }

    // Add current input
    if (audioBlob) {
      const base64Audio = await blobToBase64(audioBlob);
      parts.push({
        inlineData: {
          mimeType: audioBlob.type || "audio/webm",
          data: base64Audio
        }
      });
      parts.push({ text: "Process this audio input." });
    } else if (textInput) {
      parts.push({ text: `User Input: ${textInput}` });
    } else {
      throw new Error("No input provided");
    }

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: { parts },
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.1 // Lower temperature for more deterministic extraction
      }
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("Empty response from AI");

    return JSON.parse(jsonText) as SimulationResponse;

  } catch (error) {
    console.error("AI Processing Error:", error);
    // Fallback error response
    return {
      transcription: "Error processing input.",
      responseText: "I apologize, but I am having trouble understanding right now. Please try again.",
      symptoms: [],
      diagnosis: "Unknown",
      confidence: 0,
      recommendedAction: "Please try again later.",
      detectedLanguage: "en"
    };
  }
};