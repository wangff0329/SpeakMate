# SpeakMate Architecture Boundaries

This project is organized so the HTTP API, business use cases, persistence, and AI execution can evolve independently.

## Packages

- `apps/api`: HTTP routing, request parsing, response formatting, and dependency wiring.
- `packages/core`: domain types, use-case services, and ports. This package should not import concrete database, LLM, auth provider, framework, or LangGraph implementations.
- `packages/providers`: AI/auth provider adapters. The current `DefaultLLMProvider` is a local stub and can later be replaced by an OpenAI or LangGraph-backed adapter. JWT and password hashing also live here behind core ports.
- `packages/db`: persistence adapters and database schema files. The current in-memory repositories implement core repository ports. Migrations define the PostgreSQL `users` and `practice_sessions` tables.

## Dependency Direction

```text
apps/api          -> packages/core
apps/api          -> packages/db
apps/api          -> packages/providers
packages/db        -> packages/core
packages/providers -> packages/core
packages/core      -> no concrete adapters
```

The important rule is that `core` owns the contracts and use-case flow, while adapters implement those contracts.

## LangGraph Integration Point

Add LangGraph behind a core port instead of calling it directly from routes.

Good first step:

1. Keep `PracticeService` as the use-case entry point.
2. Add a `PracticeWorkflow` port in `packages/core` if prompt generation and evaluation become multi-step.
3. Implement that port in `packages/providers` with LangGraph nodes.
4. Wire the LangGraph adapter in `apps/api/src/index.ts`.

This keeps the graph replaceable and testable. The API will still call `PracticeService`, and storage will still go through `PracticeRepository`.

## Authentication

Auth follows email/password plus JWT Bearer Token:

1. `AuthService` in `packages/core` validates credentials and orchestrates registration/login.
2. `UserRepository`, `PasswordHasher`, and `TokenProvider` are core ports.
3. `packages/db` provides the current in-memory user repository and PostgreSQL migration.
4. `packages/providers` provides Bun password hashing and HS256 JWT signing/verification.
5. Practice routes authenticate the bearer token and use the token user id, not a client-provided `userId`.

## Persistence

When `DATABASE_URL` is set, `apps/api` creates a Bun SQL PostgreSQL client, runs the SQL migrations, and wires:

- `PostgresUserRepository`
- `PostgresPracticeSessionRepository`

When `DATABASE_URL` is missing, the API falls back to in-memory repositories so local development still starts quickly.
