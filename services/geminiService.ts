
import { GoogleGenAI, Type } from "@google/genai";
import { Message, Mission } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const generateMission = async (currentStats: any): Promise<Mission> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Generate a short flight mission for a simulator. 
      Current status: Speed ${currentStats.airspeed.toFixed(1)} knots, Altitude ${currentStats.altitude.toFixed(0)} ft.
      Format as JSON with keys: id, title, description, objective.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          title: { type: Type.STRING },
          description: { type: Type.STRING },
          objective: { type: Type.STRING }
        },
        required: ["id", "title", "description", "objective"]
      }
    }
  });

  try {
    return JSON.parse(response.text.trim());
  } catch (e) {
    return {
      id: 'fallback-01',
      title: 'Routine Patrol',
      description: 'The skies are quiet today. Perform a routine check of the sector boundaries.',
      objective: 'Maintain altitude above 2000ft for 30 seconds.',
      isCompleted: false
    };
  }
};

export const getControlResponse = async (history: Message[], status: any) => {
  const chat = ai.chats.create({
    model: 'gemini-3-flash-preview',
    config: {
      systemInstruction: `You are 'Control', a futuristic radio tower operator for a top-tier fighter pilot. 
        The pilot is flying a high-performance jet. Your tone is professional, authoritative, but supportive.
        Keep responses brief and radio-themed (e.g., 'Copy that', 'Over').
        Current Flight Data: 
        Altitude: ${status.altitude.toFixed(0)} ft
        Airspeed: ${status.airspeed.toFixed(1)} kts
        Throttle: ${status.throttle * 100}%`
    }
  });

  const lastMessage = history[history.length - 1];
  const response = await chat.sendMessage({ message: lastMessage.content });
  return response.text;
};
