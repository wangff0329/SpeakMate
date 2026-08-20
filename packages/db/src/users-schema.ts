export const USERS_TABLE = "users";

export type UserRow = {
  id: string;
  email: string;
  password_hash: string;
  created_at: Date;
};

export const createUsersTableSql = `
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS users_email_idx
  ON users (email);
`;
