export type PracticeDifficulty = "beginner" | "intermediate" | "advanced";

export type CreatePracticeInput = {
  userId?: string;
  topic: string;
  difficulty?: PracticeDifficulty;
  durationMinutes?: number;
};

export type PracticePromptInput = {
  topic: string;
  difficulty: PracticeDifficulty;
  durationMinutes: number;
};

export type PracticePrompt = PracticePromptInput & {
  prompt: string;
  instructions: string;
};

export type PracticeEvaluationInput = {
  transcript: string;
  audioUrl?: string;
};

export type PracticeEvaluationRequest = PracticeEvaluationInput & {
  prompt: string;
};

export type PracticeEvaluation = {
  score: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
  nextAction: string;
};

export type PracticeResult = PracticeEvaluationInput &
  PracticeEvaluation & {
    id: string;
    practiceId: string;
    evaluatedAt: string;
  };

export type PracticeRecord = {
  id: string;
  userId: string;
  topic: string;
  difficulty: PracticeDifficulty;
  durationMinutes: number;
  prompt: string;
  instructions: string;
  createdAt: string;
  lastResult?: PracticeResult;
};
