/* eslint-disable */
import { GoogleGenAI } from '@google/genai';
import type { Role, Message } from '../types/aichat';

export interface Part {
    text?: string;
    inlineData?: {
        mimeType: string;
        data: string;
    };
}

export class GeminiService {
    private ai: GoogleGenAI;

    constructor() {
        this.ai = new GoogleGenAI({
            apiKey: import.meta.env.VITE_GEMINI_API_KEY as string,
        });
    }

    async *streamChat(
        history: Message[],
        message: string,
        attachment?: { mimeType: string; data: string },
    ) {
        const chat = this.ai.chats.create({
            model: 'gemini-3-flash-preview',
            config: {
                systemInstruction:
                    'You are a premium AI assistant. Be professional, concise, and helpful. Format your responses using markdown when appropriate. You can process text, images, and audio files.',
            },
        });

        const parts: Part[] = [{ text: message }];
        if (attachment) {
            parts.push({
                inlineData: {
                    mimeType: attachment.mimeType,
                    data: attachment.data,
                },
            });
        }

        const result = await chat.sendMessageStream({
            message: parts as any, // Gemini SDK handles parts in sendMessageStream message param
        });

        for await (const chunk of result) {
            yield chunk.text || '';
        }
    }
}

export const gemini = new GeminiService();
