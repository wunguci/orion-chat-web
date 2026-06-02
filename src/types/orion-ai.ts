export type AiCardTone = "neutral" | "positive" | "warning" | "danger" | "info";

export interface AiCard {
  id: string;
  title: string;
  subtitle?: string;
  body?: string;
  tone?: AiCardTone;
  icon?: string;
  meta?: Record<string, unknown>;
}

export interface AiTable {
  columns: Array<{ key: string; label: string; width?: string }>;
  rows: Array<Record<string, unknown>>;
}

export interface AiAction {
  id: string;
  label: string;
  type: "create_task" | "create_event" | "open_item" | "copy_text" | "none";
  payload?: Record<string, unknown>;
  disabled?: boolean;
}

export interface AiGridResponse {
  id: string;
  type: string;
  title: string;
  summary: string;
  confidence: number;
  generatedAt: string;
  layout: {
    variant: "grid" | "table" | "compact" | "empty";
    columns: { mobile: number; tablet: number; desktop: number };
  };
  cards: AiCard[];
  table?: AiTable;
  actions: AiAction[];
  meta: Record<string, unknown>;
}

export interface OrionAiSettings {
  smartEmotionDetection: boolean;
  autoWorkflowSuggestions: boolean;
  aiMemoryEnabled: boolean;
  enabledAgents: string[];
}

export type RewriteTone = "professional" | "polite" | "concise";
