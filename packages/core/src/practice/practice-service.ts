import type { LLMProvider, PracticeRepository } from "./ports";
import type { CreatePracticeInput, PracticeEvaluationInput, PracticeRecord } from "./types";

export class PracticeService {
  constructor(
    private readonly dependencies: {
      llm: LLMProvider;
      repository: PracticeRepository;
    },
  ) {}

  async generatePractice(input: CreatePracticeInput): Promise<PracticeRecord> {
    const topic = input.topic.trim() || "Daily Conversation";
    const difficulty = input.difficulty ?? "intermediate";
    const durationMinutes = input.durationMinutes ?? 10;

    const prompt = this.dependencies.llm.generatePracticePrompt({
      topic,
      difficulty,
      durationMinutes,
    });

    const record = await this.dependencies.repository.createPractice({
      userId: input.userId ?? "anonymous",
      topic,
      difficulty,
      durationMinutes,
      prompt: prompt.prompt,
      instructions: prompt.instructions,
    });

    return record;
  }

  listPracticeRecords(userId: string): Promise<PracticeRecord[]> {
    return this.dependencies.repository.listPracticeRecords(userId);
  }

  getPractice(id: string, userId: string): Promise<PracticeRecord | null> {
    return this.dependencies.repository.findPracticeById(id, userId);
  }

  async evaluatePractice(id: string, userId: string, input: PracticeEvaluationInput) {
    const practice = await this.getPractice(id, userId);

    if (!practice) {
      throw new Error("Practice not found");
    }

    const evaluation = this.dependencies.llm.evaluateResponse({
      prompt: practice.prompt,
      transcript: input.transcript,
      audioUrl: input.audioUrl,
    });

    const result = await this.dependencies.repository.savePracticeResult({
      practiceId: practice.id,
      transcript: input.transcript,
      audioUrl: input.audioUrl,
      score: evaluation.score,
      feedback: evaluation.feedback,
      strengths: evaluation.strengths,
      improvements: evaluation.improvements,
      nextAction: evaluation.nextAction,
    });

    return {
      ...practice,
      lastResult: result,
    };
  }
}
