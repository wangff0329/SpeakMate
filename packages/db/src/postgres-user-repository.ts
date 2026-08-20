import type { UserRepository } from "../../core/src/auth/ports";
import type { User } from "../../core/src/auth/types";
import type { UserRow } from "./users-schema";
import type { Database } from "./postgres";

const toUser = (row: UserRow): User => ({
  id: row.id,
  email: row.email,
  passwordHash: row.password_hash,
  createdAt: row.created_at.toISOString(),
});

export class PostgresUserRepository implements UserRepository {
  constructor(private readonly db: Database) {}

  async createUser(input: { email: string; passwordHash: string }): Promise<User> {
    const [row] = await this.db<UserRow[]>`
      INSERT INTO users (email, password_hash)
      VALUES (${input.email}, ${input.passwordHash})
      RETURNING id, email, password_hash, created_at
    `;

    if (!row) {
      throw new Error("Failed to create user");
    }

    return toUser(row);
  }

  async findUserByEmail(email: string): Promise<User | null> {
    const [row] = await this.db<UserRow[]>`
      SELECT id, email, password_hash, created_at
      FROM users
      WHERE email = ${email}
      LIMIT 1
    `;

    return row ? toUser(row) : null;
  }

  async findUserById(id: string): Promise<User | null> {
    const [row] = await this.db<UserRow[]>`
      SELECT id, email, password_hash, created_at
      FROM users
      WHERE id = ${id}
      LIMIT 1
    `;

    return row ? toUser(row) : null;
  }
}
