import type { LLMProvider } from "../../core/src/practice/ports";
import type {
  PracticeEvaluation,
  PracticeEvaluationRequest,
  PracticePrompt,
  PracticePromptInput,
} from "../../core/src/practice/types";

export class DefaultLLMProvider implements LLMProvider {
  generatePracticePrompt(input: PracticePromptInput): PracticePrompt {
    const prompt = `You are a spoken English coach. Practice topic: ${input.topic}. Difficulty: ${input.difficulty}. Keep the exercise focused and realistic for a ${input.durationMinutes}-minute session.`;

    const instructions = `Please answer in English with clear pronunciation, natural pacing, and complete sentences. Focus on confidence and clarity.`;

    return {
      ...input,
      prompt,
      instructions,
    };
  }

  evaluateResponse(input: PracticeEvaluationRequest): PracticeEvaluation {
    const transcript = input.transcript.trim();
    const wordCount = transcript ? transcript.split(/\s+/).length : 0;
    const score = Math.min(100, Math.max(60, 75 + Math.min(wordCount, 25) * 0.8));

    return {
      score: Math.round(score),
      feedback: `Your answer covered the key idea about ${input.prompt}. Keep your rhythm more natural and add a little more detail to sound more fluent.`,
      strengths: ["Clear topic focus", "Used complete sentences", "Expressed a relevant idea"],
      improvements: ["Increase speaking fluency", "Reduce hesitation", "Add more specific examples"],
      nextAction: "Try a second round with a slightly more detailed answer and smoother pacing.",
    };
  }
}
