import { api } from "./api";
import type {
  AIActionExecutionResult,
  AIActionSuggestion,
} from "../types/aichat";

export const aiActionsService = {
  executeAction: (action: AIActionSuggestion) =>
    api.post<AIActionExecutionResult>("/ai-actions/execute", { action }),
};
