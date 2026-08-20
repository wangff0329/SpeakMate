import type { AuthTokenPayload, User } from "./types";

export interface UserRepository {
  createUser(input: { email: string; passwordHash: string }): Promise<User>;
  findUserByEmail(email: string): Promise<User | null>;
  findUserById(id: string): Promise<User | null>;
}

export interface PasswordHasher {
  hash(password: string): Promise<string>;
  verify(password: string, passwordHash: string): Promise<boolean>;
}

export interface TokenProvider {
  sign(input: { userId: string; email: string }): Promise<string>;
  verify(token: string): Promise<AuthTokenPayload>;
}
