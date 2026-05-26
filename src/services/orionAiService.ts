import { api } from "./api";
import type {
  AiGridResponse,
  OrionAiSettings,
  RewriteTone,
} from "../types/orion-ai";

const BASE = "/orion-ai";

export const orionAiService = {
  getSettings: () => api.get<OrionAiSettings>(`${BASE}/settings`),

  updateSettings: (payload: Partial<OrionAiSettings>) =>
    api.patch<OrionAiSettings>(`${BASE}/settings`, payload),

  summarizeConversation: (payload: {
    conversationId: string;
    mode?: "range" | "unread";
    rangeMonths?: 1 | 2 | 3;
  }) => api.post<AiGridResponse>(`${BASE}/chat/summarize`, payload),

  suggestReplies: (payload: { conversationId: string; limit?: number }) =>
    api.post<AiGridResponse>(`${BASE}/chat/reply-suggestions`, payload),

  rewriteMessage: (payload: {
    message: string;
    tone: RewriteTone;
    audience?: string;
  }) => api.post<AiGridResponse>(`${BASE}/chat/rewrite`, payload),

  analyzeTextWorkflow: (payload: {
    text: string;
    conversationId?: string;
    workspaceId?: string;
  }) => api.post<AiGridResponse>(`${BASE}/chat/text-to-workflow`, payload),

  detectEmotion: (payload: { messageId?: string; text?: string }) =>
    api.post<AiGridResponse>(`${BASE}/chat/emotion`, payload),

  createTaskDraft: (payload: {
    conversationId?: string;
    workspaceId?: string;
    text?: string;
  }) => api.post<AiGridResponse>(`${BASE}/workhub/task-draft`, payload),

  deadlineInsights: (payload: { workspaceId?: string }) =>
    api.post<AiGridResponse>(`${BASE}/workhub/deadline-insights`, payload),

  sprintSummary: (payload: { workspaceId?: string; sprintId?: string }) =>
    api.post<AiGridResponse>(`${BASE}/workhub/sprint-summary`, payload),

  documentAssist: (payload: {
    prompt: string;
    documentId?: string;
    workspaceId?: string;
    selectedText?: string;
  }) => api.post<AiGridResponse>(`${BASE}/documents/assist`, payload),

  knowledgeSearch: (payload: {
    query: string;
    workspaceId?: string;
    topK?: number;
  }) => api.post<AiGridResponse>(`${BASE}/knowledge/search`, payload),

  askWorkspace: (payload: { workspaceId: string; question: string }) =>
    api.post<AiGridResponse>(`${BASE}/workspace/ask`, payload),
};
