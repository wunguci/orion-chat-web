import { api } from "./api";
import {
  Role,
  type ChatSession,
  type Message,
  type AIActionSuggestion,
} from "../types/aichat";

const BASE = "/ai-sessions";

interface AISessionDto {
  _id: string;
  title?: string;
  aiModel: string;
  systemPrompt?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface AIMessageDto {
  _id: string;
  content: string;
  aiMessageRole: "USER" | "ASSISTANT";
  createdAt?: string;
}

interface SendMessageResponse {
  assistantMessage: string;
  tokenUsed?: number;
  suggestedActions?: AIActionSuggestion[];
}

const toTimestamp = (value?: string): number => {
  if (!value) return Date.now();
  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? Date.now() : parsed;
};

const mapMessage = (item: AIMessageDto): Message => ({
  id: item._id,
  role: item.aiMessageRole === "USER" ? Role.USER : Role.MODEL,
  content: item.content,
  timestamp: toTimestamp(item.createdAt),
});

const mapSession = (session: AISessionDto, messages: Message[] = []): ChatSession => ({
  id: session._id,
  title: session.title || "New Conversation",
  preview: messages[messages.length - 1]?.content?.slice(0, 30) || "Start chatting...",
  messages,
  updatedAt: toTimestamp(session.updatedAt || session.createdAt),
});

export const aiChatService = {
  async listSessions(): Promise<ChatSession[]> {
    const sessions = await api.get<AISessionDto[]>(`${BASE}/me`);
    return sessions.map((item) => mapSession(item));
  },

  async createSession(payload?: {
    title?: string;
    aiModel?: string;
    systemPrompt?: string;
  }): Promise<ChatSession> {
    const session = await api.post<AISessionDto>(`${BASE}`, {
      title: payload?.title,
      aiModel: payload?.aiModel || "gemini-2.5-flash",
      systemPrompt: payload?.systemPrompt,
    });
    return mapSession(session);
  },

  async getMessages(sessionId: string): Promise<Message[]> {
    const messages = await api.get<AIMessageDto[]>(`${BASE}/${sessionId}/messages`);
    return messages.map(mapMessage);
  },

  async sendMessage(
    sessionId: string,
    payload: {
      message?: string;
      attachment?: { mimeType: string; data: string };
    },
  ): Promise<SendMessageResponse> {
    return api.post<SendMessageResponse>(`${BASE}/${sessionId}/send`, payload);
  },

  async renameSession(sessionId: string, title: string): Promise<void> {
    await api.patch(`${BASE}/${sessionId}`, { title });
  },

  async deleteSession(sessionId: string): Promise<void> {
    await api.delete(`${BASE}/${sessionId}`);
  },
};
