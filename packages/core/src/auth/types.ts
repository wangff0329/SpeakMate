export type User = {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: string;
};

export type PublicUser = {
  id: string;
  email: string;
  createdAt: string;
};

export type AuthTokenPayload = {
  sub: string;
  email: string;
  iat: number;
  exp: number;
};

export type AuthResult = {
  user: PublicUser;
  accessToken: string;
  tokenType: "Bearer";
};

export type RegisterInput = {
  email: string;
  password: string;
};

export type LoginInput = RegisterInput;
