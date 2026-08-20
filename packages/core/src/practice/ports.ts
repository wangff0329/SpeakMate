import type {
  PracticeEvaluation,
  PracticeEvaluationRequest,
  PracticePrompt,
  PracticePromptInput,
  PracticeRecord,
  PracticeResult,
} from "./types";

export interface LLMProvider {
  generatePracticePrompt(input: PracticePromptInput): PracticePrompt;
  evaluateResponse(input: PracticeEvaluationRequest): PracticeEvaluation;
}

export interface PracticeRepository {
  createPractice(input: Omit<PracticeRecord, "id" | "createdAt">): Promise<PracticeRecord>;
  listPracticeRecords(userId: string): Promise<PracticeRecord[]>;
  findPracticeById(id: string, userId: string): Promise<PracticeRecord | null>;
  savePracticeResult(input: Omit<PracticeResult, "id" | "evaluatedAt">): Promise<PracticeResult>;
}
