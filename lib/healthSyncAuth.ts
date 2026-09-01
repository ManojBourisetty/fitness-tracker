/** Shared bearer-token gate for the health-sync API routes (server-only). */
export function checkBearerToken(request: Request): boolean {
  const expected = process.env.HEALTH_SYNC_TOKEN;
  if (!expected) return false;
  const auth = request.headers.get("authorization") ?? "";
  const token = auth.replace(/^Bearer\s+/i, "").trim();
  return token.length > 0 && token === expected;
}
