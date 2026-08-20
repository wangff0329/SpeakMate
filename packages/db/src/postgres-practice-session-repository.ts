import type { PracticeRepository } from "../../core/src/practice/ports";
import type { PracticeRecord, PracticeResult } from "../../core/src/practice/types";
import type { PracticeSessionRow } from "./practice-sessions-schema";
import type { Database } from "./postgres";

type PracticeScoresJson = {
  score?: number;
  strengths?: string[];
  improvements?: string[];
  nextAction?: string;
};

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === "string");

const parseScores = (value: Record<string, unknown> | null): PracticeScoresJson => {
  if (!value) {
    return {};
  }

  return {
    score: typeof value.score === "number" ? value.score : undefined,
    strengths: isStringArray(value.strengths) ? value.strengths : undefined,
    improvements: isStringArray(value.improvements) ? value.improvements : undefined,
    nextAction: typeof value.nextAction === "string" ? value.nextAction : undefined,
  };
};

const toPracticeResult = (row: PracticeSessionRow): PracticeResult | undefined => {
  if (!row.answer_text && !row.review && !row.scores_json) {
    return undefined;
  }

  const scores = parseScores(row.scores_json);

  return {
    id: row.id,
    practiceId: row.id,
    transcript: row.answer_text ?? "",
    score: scores.score ?? 0,
    feedback: row.review ?? "",
    strengths: scores.strengths ?? [],
    improvements: scores.improvements ?? [],
    nextAction: scores.nextAction ?? "",
    evaluatedAt: row.created_at.toISOString(),
  };
};

const toPracticeRecord = (row: PracticeSessionRow): PracticeRecord => ({
  id: row.id,
  userId: row.user_id,
  topic: row.scenario,
  difficulty: row.mode === "beginner" || row.mode === "intermediate" || row.mode === "advanced" ? row.mode : "intermediate",
  durationMinutes: 10,
  prompt: row.prompt,
  instructions: "Please answer in English with clear pronunciation, natural pacing, and complete sentences.",
  createdAt: row.created_at.toISOString(),
  lastResult: toPracticeResult(row),
});

export class PostgresPracticeSessionRepository implements PracticeRepository {
  constructor(private readonly db: Database) {}

  async createPractice(input: Omit<PracticeRecord, "id" | "createdAt">): Promise<PracticeRecord> {
    const [row] = await this.db<PracticeSessionRow[]>`
      INSERT INTO practice_sessions (user_id, mode, scenario, prompt)
      VALUES (${input.userId}, ${input.difficulty}, ${input.topic}, ${input.prompt})
      RETURNING id, user_id, mode, scenario, prompt, answer_text, review, scores_json, created_at
    `;

    if (!row) {
      throw new Error("Failed to create practice session");
    }

    return toPracticeRecord(row);
  }

  async listPracticeRecords(userId: string): Promise<PracticeRecord[]> {
    const rows = await this.db<PracticeSessionRow[]>`
      SELECT id, user_id, mode, scenario, prompt, answer_text, review, scores_json, created_at
      FROM practice_sessions
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
    `;

    return rows.map(toPracticeRecord);
  }

  async findPracticeById(id: string, userId: string): Promise<PracticeRecord | null> {
    const [row] = await this.db<PracticeSessionRow[]>`
      SELECT id, user_id, mode, scenario, prompt, answer_text, review, scores_json, created_at
      FROM practice_sessions
      WHERE id = ${id} AND user_id = ${userId}
      LIMIT 1
    `;

    return row ? toPracticeRecord(row) : null;
  }

  async savePracticeResult(input: Omit<PracticeResult, "id" | "evaluatedAt">): Promise<PracticeResult> {
    const scoresJson = {
      score: input.score,
      strengths: input.strengths,
      improvements: input.improvements,
      nextAction: input.nextAction,
    };
    const [row] = await this.db<PracticeSessionRow[]>`
      UPDATE practice_sessions
      SET answer_text = ${input.transcript},
          review = ${input.feedback},
          scores_json = ${JSON.stringify(scoresJson)}::jsonb
      WHERE id = ${input.practiceId}
      RETURNING id, user_id, mode, scenario, prompt, answer_text, review, scores_json, created_at
    `;

    if (!row) {
      throw new Error("Practice not found");
    }

    const result = toPracticeResult(row);

    if (!result) {
      throw new Error("Failed to save practice result");
    }

    return result;
  }
}
