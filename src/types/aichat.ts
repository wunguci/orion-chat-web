export const Role = {
  USER: "user",
  MODEL: "model",
} as const;

export type Role = (typeof Role)[keyof typeof Role];

export interface Message {
  id: string;
  role: Role;
  content: string;
  timestamp: number;
}

export interface ChatSession {
  id: string;
  title: string;
  preview: string;
  messages: Message[];
  updatedAt: number;
}

export type AIActionType =
  | "create_task"
  | "summarize_unread"
  | "schedule_meeting"
  | "update_task"
  | "set_priority"
  | "follow_up";

export interface AIActionSuggestion {
  id: string;
  type: AIActionType;
  title: string;
  description: string;
  payload?: Record<string, unknown>;
  requiresApproval: boolean;
  requiredFields?: string[];
}

export interface AIActionExecutionResult {
  status: "executed" | "rejected" | "needs_input";
  message?: string;
  requiredFields?: string[];
  data?: unknown;
}

export const AISkill = {
  CODING: "Coding",
  TRANSLATE: "Translate",
  WRITING: "Writing",
  DIGEST: "Digest",
} as const;

export type AISkill = (typeof AISkill)[keyof typeof AISkill];
