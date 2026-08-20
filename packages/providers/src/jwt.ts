import { Buffer } from "node:buffer";
import { timingSafeEqual as cryptoTimingSafeEqual } from "node:crypto";
import type { TokenProvider } from "../../core/src/auth/ports";
import type { AuthTokenPayload } from "../../core/src/auth/types";

const encoder = new TextEncoder();

const base64UrlEncode = (value: string | Uint8Array): string =>
  Buffer.from(value).toString("base64url");

const base64UrlDecode = (value: string): string =>
  Buffer.from(value, "base64url").toString("utf8");

const timingSafeEqual = (left: string, right: string): boolean => {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return cryptoTimingSafeEqual(leftBuffer, rightBuffer);
};

export class JwtTokenProvider implements TokenProvider {
  constructor(
    private readonly options: {
      secret: string;
      expiresInSeconds?: number;
    },
  ) {}

  async sign(input: { userId: string; email: string }): Promise<string> {
    const issuedAt = Math.floor(Date.now() / 1000);
    const expiresAt = issuedAt + (this.options.expiresInSeconds ?? 60 * 60 * 24 * 7);
    const header = {
      alg: "HS256",
      typ: "JWT",
    };
    const payload: AuthTokenPayload = {
      sub: input.userId,
      email: input.email,
      iat: issuedAt,
      exp: expiresAt,
    };
    const signingInput = `${base64UrlEncode(JSON.stringify(header))}.${base64UrlEncode(JSON.stringify(payload))}`;
    const signature = await this.createSignature(signingInput);

    return `${signingInput}.${signature}`;
  }

  async verify(token: string): Promise<AuthTokenPayload> {
    const [encodedHeader, encodedPayload, signature] = token.split(".");

    if (!encodedHeader || !encodedPayload || !signature) {
      throw new Error("Invalid bearer token");
    }

    const signingInput = `${encodedHeader}.${encodedPayload}`;
    const expectedSignature = await this.createSignature(signingInput);

    if (!timingSafeEqual(signature, expectedSignature)) {
      throw new Error("Invalid bearer token");
    }

    const header = JSON.parse(base64UrlDecode(encodedHeader)) as { alg?: string; typ?: string };

    if (header.alg !== "HS256" || header.typ !== "JWT") {
      throw new Error("Invalid bearer token");
    }

    const payload = JSON.parse(base64UrlDecode(encodedPayload)) as Partial<AuthTokenPayload>;
    const now = Math.floor(Date.now() / 1000);

    if (!payload.sub || !payload.email || typeof payload.exp !== "number" || payload.exp <= now) {
      throw new Error("Invalid bearer token");
    }

    return {
      sub: payload.sub,
      email: payload.email,
      iat: typeof payload.iat === "number" ? payload.iat : 0,
      exp: payload.exp,
    };
  }

  private async createSignature(signingInput: string): Promise<string> {
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(this.options.secret),
      {
        name: "HMAC",
        hash: "SHA-256",
      },
      false,
      ["sign"],
    );
    const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(signingInput));

    return base64UrlEncode(new Uint8Array(signature));
  }
}
