import { PracticeService } from "../../../../packages/core/src/practice/practice-service";
import type { PracticeDifficulty, PracticeEvaluationInput } from "../../../../packages/core/src/practice/types";
import type { PublicUser } from "../../../../packages/core/src/auth/types";
import { parseJsonPayload } from "../http";

const parseDifficulty = (value: unknown): PracticeDifficulty =>
  value === "beginner" || value === "intermediate" || value === "advanced" ? value : "intermediate";

export const createPracticeHandlers = (service: PracticeService) => ({
  async list(user: PublicUser) {
    return Response.json({
      items: await service.listPracticeRecords(user.id),
    });
  },

  async create(request: Request, user: PublicUser) {
    const payload = await parseJsonPayload(request);

    const result = await service.generatePractice({
      userId: user.id,
      topic: typeof payload.topic === "string" ? payload.topic : "Daily Conversation",
      difficulty: parseDifficulty(payload.difficulty),
      durationMinutes: typeof payload.durationMinutes === "number" ? payload.durationMinutes : 10,
    });

    return Response.json(result, { status: 201 });
  },

  async get(id: string, user: PublicUser) {
    const practice = await service.getPractice(id, user.id);

    if (!practice) {
      return Response.json({ error: "Practice not found" }, { status: 404 });
    }

    return Response.json(practice);
  },

  async evaluate(id: string, request: Request, user: PublicUser) {
    const payload = await parseJsonPayload(request);

    const input: PracticeEvaluationInput = {
      transcript: typeof payload.transcript === "string" ? payload.transcript : "",
      audioUrl: typeof payload.audioUrl === "string" ? payload.audioUrl : undefined,
    };

    try {
      const result = await service.evaluatePractice(id, user.id, input);
      return Response.json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Evaluation failed";
      return Response.json({ error: message }, { status: 404 });
    }
  },
});
