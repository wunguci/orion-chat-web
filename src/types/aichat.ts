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

export const AISkill = {
  CODING: "Coding",
  TRANSLATE: "Translate",
  WRITING: "Writing",
  DIGEST: "Digest",
} as const;

export type AISkill = (typeof AISkill)[keyof typeof AISkill];
