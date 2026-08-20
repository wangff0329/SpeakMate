import type { UserRepository } from "../../core/src/auth/ports";
import type { User } from "../../core/src/auth/types";

export const userStore: User[] = [];

export function clearUserStore(): void {
  userStore.length = 0;
}

export class InMemoryUserRepository implements UserRepository {
  async createUser(input: { email: string; passwordHash: string }): Promise<User> {
    const user: User = {
      id: crypto.randomUUID(),
      email: input.email,
      passwordHash: input.passwordHash,
      createdAt: new Date().toISOString(),
    };

    userStore.push(user);
    return user;
  }

  async findUserByEmail(email: string): Promise<User | null> {
    return userStore.find((user) => user.email === email) ?? null;
  }

  async findUserById(id: string): Promise<User | null> {
    return userStore.find((user) => user.id === id) ?? null;
  }
}
