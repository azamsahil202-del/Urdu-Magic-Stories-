
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { StoryContent } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateStory = async (themePrompt: string): Promise<StoryContent> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `${themePrompt}. The story must be exactly 15 pages long. Each page should have about 3-4 sentences of rich, poetic Urdu text. Provide a creative title. Return the result in a JSON format.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          pages: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Exactly 15 pages of story text in Urdu."
          }
        },
        required: ["title", "pages"]
      }
    }
  });

  const content = JSON.parse(response.text || '{}');
  return {
    title: content.title || 'جادوئی کہانی',
    pages: content.pages || []
  };
};

export const generateSpeech = async (text: string): Promise<Uint8Array> => {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: `Read this Urdu story page clearly, slowly and politely: ${text}` }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Puck' } // Consistent male voice
        }
      }
    }
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) throw new Error("No audio data received");

  return decode(base64Audio);
};

function decode(base64: string): Uint8Array {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number = 24000,
  numChannels: number = 1
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}
