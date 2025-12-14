import { GoogleGenAI } from "@google/genai";
import { base64ToBytes, pcmToWav } from '../utils/audio';
import { VoiceOption, GEMINI_VOICES } from '../types';

const API_KEY = process.env.API_KEY || '';

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: API_KEY });

interface GenerateSpeechParams {
  text: string;
  voice: string;
  model: string;
  systemInstruction?: string;
}

/**
 * Returns the supported Gemini voices.
 * Note: Dynamic fetching from Cloud TTS API is disabled because Gemini models
 * do not support standard Cloud TTS voices (Journey, WaveNet, etc.).
 */
export const fetchVoices = async (): Promise<VoiceOption[]> => {
  // Return the official supported list immediately
  return GEMINI_VOICES;
};

export const generateSpeech = async ({ text, voice, model, systemInstruction }: GenerateSpeechParams): Promise<Blob> => {
  try {
    const config: any = {
      // Use string literal 'AUDIO' to avoid potential runtime enum issues with imports
      responseModalities: ['AUDIO'],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: voice },
        },
      },
    };

    // NOTE: Prepend system instruction to prompt as a workaround for current preview limitations
    let finalPrompt = text;
    if (systemInstruction && systemInstruction.trim()) {
      finalPrompt = `${systemInstruction.trim()}\n${text}`;
    }

    const response = await ai.models.generateContent({
      model: model,
      contents: [{ parts: [{ text: finalPrompt }] }],
      config: config,
    });

    const candidate = response.candidates?.[0];
    const audioPart = candidate?.content?.parts?.find(p => p.inlineData?.mimeType?.startsWith('audio') || p.inlineData?.data);
    
    if (!audioPart || !audioPart.inlineData?.data) {
       // Check if text was returned instead (e.g. refusal)
       const textPart = candidate?.content?.parts?.find(p => p.text)?.text;
       if (textPart) {
         throw new Error(`Model returned text instead of audio: "${textPart.slice(0, 50)}..."`);
       }
       throw new Error("No audio data found in response.");
    }

    const base64Data = audioPart.inlineData.data;
    const pcmBytes = base64ToBytes(base64Data);
    
    // Convert Raw PCM to WAV for browser playback compatibility
    // Gemini TTS defaults: 24kHz sample rate
    return pcmToWav(pcmBytes, 24000, 1);

  } catch (error: any) {
    console.error("Gemini TTS Error Details:", JSON.stringify(error, null, 2));
    
    // Parse Google API Error format which might be buried in the object
    let errorMessage = error.message || "Unknown error occurred";
    
    if (error.error && error.error.message) {
        errorMessage = error.error.message;
    } else if (typeof error === 'string') {
        errorMessage = error;
    }

    if (errorMessage.includes('404')) {
        throw new Error(`Model '${model}' not found (404). It may be deprecated or incorrect.`);
    }
    
    if (errorMessage.includes('modality') || errorMessage.includes('AUDIO')) {
        throw new Error(`The model '${model}' does not support Audio generation. Please select a compatible TTS model.`);
    }

    if (errorMessage.includes('500') || errorMessage.includes('503')) {
        throw new Error("Google API Service Error. Please try again later.");
    }
    
    throw new Error(errorMessage);
  }
};