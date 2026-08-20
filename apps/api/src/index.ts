import { AuthService } from "../../../packages/core/src/auth/auth-service";
import { PracticeService } from "../../../packages/core/src/practice/practice-service";
import { InMemoryPracticeRepository } from "../../../packages/db/src/in-memory-practice-repository";
import { InMemoryUserRepository } from "../../../packages/db/src/in-memory-user-repository";
import { createPostgresClient, runMigrations } from "../../../packages/db/src/postgres";
import { PostgresPracticeSessionRepository } from "../../../packages/db/src/postgres-practice-session-repository";
import { PostgresUserRepository } from "../../../packages/db/src/postgres-user-repository";
import { JwtTokenProvider } from "../../../packages/providers/src/jwt";
import { DefaultLLMProvider } from "../../../packages/providers/src/llm";
import { BunPasswordHasher } from "../../../packages/providers/src/password";
import { corsHeaders, jsonError, withCors } from "./http";
import { createAuthHandlers } from "./routes/auth";
import { createPracticeHandlers } from "./routes/practice";

const jwtSecret = Bun.env.JWT_SECRET ?? "speakmate-dev-secret-change-before-production";
const databaseUrl = Bun.env.DATABASE_URL;
const database = databaseUrl ? createPostgresClient(databaseUrl) : null;

if (database) {
  await runMigrations(database);
  console.log("SpeakMate API is using PostgreSQL storage");
} else {
  console.log("DATABASE_URL is not set; SpeakMate API is using in-memory storage");
}

const userRepository = database ? new PostgresUserRepository(database) : new InMemoryUserRepository();
const practiceRepository = database
  ? new PostgresPracticeSessionRepository(database)
  : new InMemoryPracticeRepository();

const authService = new AuthService({
  users: userRepository,
  passwordHasher: new BunPasswordHasher(),
  tokenProvider: new JwtTokenProvider({
    secret: jwtSecret,
  }),
});
const practiceHandlers = createPracticeHandlers(
  new PracticeService({
    llm: new DefaultLLMProvider(),
    repository: practiceRepository,
  }),
);
const authHandlers = createAuthHandlers(authService);

const server = Bun.serve({
  port: Number(Bun.env.PORT ?? 3000),
  async fetch(request) {
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders,
      });
    }

    return withCors(await handleRequest(request));
  },
});

async function handleRequest(request: Request): Promise<Response> {
  const url = new URL(request.url);

  if (url.pathname === "/health") {
    return Response.json({
      ok: true,
      service: "speakmate-api",
    });
  }

  if (url.pathname === "/api/auth/register" && request.method === "POST") {
    return authHandlers.register(request);
  }

  if (url.pathname === "/api/auth/login" && request.method === "POST") {
    return authHandlers.login(request);
  }

  if (url.pathname === "/api/auth/me" && request.method === "GET") {
    return authHandlers.me(request);
  }

  if (url.pathname === "/api/practice" || url.pathname === "/api/practice/") {
    const user = await authenticate(request);

    if (!user.ok) {
      return user.response;
    }

    if (request.method === "GET") {
      return practiceHandlers.list(user.value);
    }

    if (request.method === "POST") {
      return practiceHandlers.create(request, user.value);
    }
  }

  const match = url.pathname.match(/^\/api\/practice\/([^/]+)$/);
  if (match) {
    const id = match[1];

    if (!id) {
      return Response.json({ error: "Practice id is required" }, { status: 400 });
    }

    const user = await authenticate(request);

    if (!user.ok) {
      return user.response;
    }

    if (request.method === "GET") {
      return practiceHandlers.get(id, user.value);
    }

    if (request.method === "POST") {
      return practiceHandlers.evaluate(id, request, user.value);
    }
  }

  return new Response(JSON.stringify({ error: "Not found" }), {
    status: 404,
    headers: { "content-type": "application/json" },
  });
}

async function authenticate(request: Request) {
  try {
    return {
      ok: true as const,
      value: await authService.authenticateBearerToken(request.headers.get("authorization")),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unauthorized";
    return {
      ok: false as const,
      response: jsonError(message, 401),
    };
  }
}

console.log(`SpeakMate API is running at ${server.url}`);
