import type { PasswordHasher } from "../../core/src/auth/ports";

export class BunPasswordHasher implements PasswordHasher {
  hash(password: string): Promise<string> {
    return Bun.password.hash(password, {
      algorithm: "argon2id",
    });
  }

  verify(password: string, passwordHash: string): Promise<boolean> {
    return Bun.password.verify(password, passwordHash);
  }
}
