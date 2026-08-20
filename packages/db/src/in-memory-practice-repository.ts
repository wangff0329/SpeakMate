import type { PracticeRepository } from "../../core/src/practice/ports";
import type { PracticeRecord, PracticeResult } from "../../core/src/practice/types";

export const practiceStore: PracticeRecord[] = [];

export function createPracticeRecord(input: Omit<PracticeRecord, "id" | "createdAt">): PracticeRecord {
  const record: PracticeRecord = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    ...input,
  };

  practiceStore.push(record);
  return record;
}

export function createPracticeResult(input: Omit<PracticeResult, "id" | "evaluatedAt">): PracticeResult {
  return {
    id: crypto.randomUUID(),
    evaluatedAt: new Date().toISOString(),
    ...input,
  };
}

export function clearPracticeStore(): void {
  practiceStore.length = 0;
}

export class InMemoryPracticeRepository implements PracticeRepository {
  async createPractice(input: Omit<PracticeRecord, "id" | "createdAt">): Promise<PracticeRecord> {
    return createPracticeRecord(input);
  }

  async listPracticeRecords(userId: string): Promise<PracticeRecord[]> {
    return practiceStore.filter((practice) => practice.userId === userId);
  }

  async findPracticeById(id: string, userId: string): Promise<PracticeRecord | null> {
    return practiceStore.find((practice) => practice.id === id && practice.userId === userId) ?? null;
  }

  async savePracticeResult(input: Omit<PracticeResult, "id" | "evaluatedAt">): Promise<PracticeResult> {
    const result = createPracticeResult(input);
    const practice = practiceStore.find((item) => item.id === input.practiceId);

    if (practice) {
      practice.lastResult = result;
    }

    return result;
  }
}
