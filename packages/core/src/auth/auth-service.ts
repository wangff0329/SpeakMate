import type { PasswordHasher, TokenProvider, UserRepository } from "./ports";
import type { AuthResult, LoginInput, PublicUser, RegisterInput, User } from "./types";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

const toPublicUser = (user: User): PublicUser => ({
  id: user.id,
  email: user.email,
  createdAt: user.createdAt,
});

export class AuthService {
  constructor(
    private readonly dependencies: {
      users: UserRepository;
      passwordHasher: PasswordHasher;
      tokenProvider: TokenProvider;
    },
  ) {}

  async register(input: RegisterInput): Promise<AuthResult> {
    const email = normalizeEmail(input.email);
    validateEmail(email);
    validatePassword(input.password);

    if (await this.dependencies.users.findUserByEmail(email)) {
      throw new Error("Email already registered");
    }

    const passwordHash = await this.dependencies.passwordHasher.hash(input.password);
    const user = await this.dependencies.users.createUser({ email, passwordHash });
    const accessToken = await this.dependencies.tokenProvider.sign({ userId: user.id, email: user.email });

    return {
      user: toPublicUser(user),
      accessToken,
      tokenType: "Bearer",
    };
  }

  async login(input: LoginInput): Promise<AuthResult> {
    const email = normalizeEmail(input.email);
    const user = await this.dependencies.users.findUserByEmail(email);

    if (!user) {
      throw new Error("Invalid email or password");
    }

    const passwordMatches = await this.dependencies.passwordHasher.verify(input.password, user.passwordHash);

    if (!passwordMatches) {
      throw new Error("Invalid email or password");
    }

    const accessToken = await this.dependencies.tokenProvider.sign({ userId: user.id, email: user.email });

    return {
      user: toPublicUser(user),
      accessToken,
      tokenType: "Bearer",
    };
  }

  async authenticateBearerToken(authorizationHeader: string | null): Promise<PublicUser> {
    const token = parseBearerToken(authorizationHeader);
    const payload = await this.dependencies.tokenProvider.verify(token);
    const user = await this.dependencies.users.findUserById(payload.sub);

    if (!user) {
      throw new Error("Invalid bearer token");
    }

    return toPublicUser(user);
  }
}

export const normalizeEmail = (email: string): string => email.trim().toLowerCase();

export function validateEmail(email: string): void {
  if (!EMAIL_PATTERN.test(email)) {
    throw new Error("Email is invalid");
  }
}

export function validatePassword(password: string): void {
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new Error(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
  }
}

export function parseBearerToken(authorizationHeader: string | null): string {
  if (!authorizationHeader) {
    throw new Error("Missing bearer token");
  }

  const [scheme, token] = authorizationHeader.split(" ");

  if (scheme !== "Bearer" || !token) {
    throw new Error("Invalid authorization header");
  }

  return token;
}
