export const jsonError = (message: string, status = 400): Response =>
  Response.json({ error: message }, { status });

export const corsHeaders = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET,POST,OPTIONS",
  "access-control-allow-headers": "content-type,authorization",
};

export const withCors = (response: Response): Response => {
  for (const [key, value] of Object.entries(corsHeaders)) {
    response.headers.set(key, value);
  }

  return response;
};

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

export const parseJsonPayload = async (request: Request): Promise<Record<string, unknown>> => {
  const payload = await request.json().catch(() => ({}));
  return isRecord(payload) ? payload : {};
};
