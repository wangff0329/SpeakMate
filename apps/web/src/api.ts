export type AuthResult = {
  user: {
    id: string;
    email: string;
    createdAt: string;
  };
  accessToken: string;
  tokenType: "Bearer";
};

export type PracticeRecord = {
  id: string;
  userId: string;
  topic: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  durationMinutes: number;
  prompt: string;
  instructions: string;
  createdAt: string;
  lastResult?: {
    id: string;
    practiceId: string;
    transcript: string;
    score: number;
    feedback: string;
    strengths: string[];
    improvements: string[];
    nextAction: string;
    evaluatedAt: string;
  };
};

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

type RequestOptions = {
  token?: string | null;
  json?: unknown;
};

async function request<T>(path: string, options: RequestInit & RequestOptions = {}): Promise<T> {
  const headers = new Headers(options.headers);

  if (options.json !== undefined) {
    headers.set("content-type", "application/json");
  }

  if (options.token) {
    headers.set("authorization", `Bearer ${options.token}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    body: options.json === undefined ? undefined : JSON.stringify(options.json),
  });

  const payload = (await response.json().catch(() => ({}))) as Record<string, unknown>;

  if (!response.ok) {
    const message = typeof payload.error === "string" ? payload.error : "Request failed";
    throw new Error(message);
  }

  return payload as T;
}

export const api = {
  register(email: string, password: string) {
    return request<AuthResult>("/api/auth/register", {
      method: "POST",
      json: { email, password },
    });
  },

  login(email: string, password: string) {
    return request<AuthResult>("/api/auth/login", {
      method: "POST",
      json: { email, password },
    });
  },

  me(token: string) {
    return request<{ user: AuthResult["user"] }>("/api/auth/me", {
      token,
    });
  },

  listPractices(token: string) {
    return request<{ items: PracticeRecord[] }>("/api/practice", {
      token,
    });
  },

  createPractice(
    token: string,
    input: {
      topic: string;
      difficulty: PracticeRecord["difficulty"];
      durationMinutes: number;
    },
  ) {
    return request<PracticeRecord>("/api/practice", {
      method: "POST",
      token,
      json: input,
    });
  },

  evaluatePractice(token: string, id: string, transcript: string) {
    return request<PracticeRecord>(`/api/practice/${id}`, {
      method: "POST",
      token,
      json: { transcript },
    });
  },
};
