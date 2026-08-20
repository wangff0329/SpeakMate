import { AuthService } from "../../../../packages/core/src/auth/auth-service";
import { jsonError, parseJsonPayload } from "../http";

export const createAuthHandlers = (service: AuthService) => ({
  async register(request: Request) {
    const payload = await parseJsonPayload(request);

    try {
      const result = await service.register({
        email: typeof payload.email === "string" ? payload.email : "",
        password: typeof payload.password === "string" ? payload.password : "",
      });

      return Response.json(result, { status: 201 });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Registration failed";
      const status = message === "Email already registered" ? 409 : 400;
      return jsonError(message, status);
    }
  },

  async login(request: Request) {
    const payload = await parseJsonPayload(request);

    try {
      const result = await service.login({
        email: typeof payload.email === "string" ? payload.email : "",
        password: typeof payload.password === "string" ? payload.password : "",
      });

      return Response.json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Login failed";
      return jsonError(message, 401);
    }
  },

  async me(request: Request) {
    try {
      const user = await service.authenticateBearerToken(request.headers.get("authorization"));
      return Response.json({ user });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unauthorized";
      return jsonError(message, 401);
    }
  },
});
