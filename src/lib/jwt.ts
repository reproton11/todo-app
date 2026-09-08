import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "todo_session";

export type SessionPayload = { userId: string };

function secret() {
  return new TextEncoder().encode(process.env.JWT_SECRET ?? "dev-only-secret");
}

export async function signSessionToken(userId: string, maxAgeSeconds: number) {
  return new SignJWT({ userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + maxAgeSeconds)
    .sign(secret());
}

export async function verifySessionToken(token?: string): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return typeof payload.userId === "string" ? { userId: payload.userId } : null;
  } catch {
    return null;
  }
}
