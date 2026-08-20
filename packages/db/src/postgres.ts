import { SQL } from "bun";
import { createPracticeSessionsTableSql } from "./practice-sessions-schema";
import { createUsersTableSql } from "./users-schema";

export type Database = SQL;

export const createPostgresClient = (databaseUrl = Bun.env.DATABASE_URL): Database => {
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required");
  }

  return new SQL(databaseUrl);
};

export async function runMigrations(db: Database): Promise<void> {
  await db.unsafe(createUsersTableSql);
  await db.unsafe(createPracticeSessionsTableSql);
}
