/**
 * Session management using signed httpOnly cookies + JWT (jose library).
 *
 * Decision: stateless JWT stored in httpOnly cookie.
 * - No session table needed — easy to scale.
 * - Cookie is httpOnly + SameSite=Lax — not readable by JS.
 * - Signing key: SESSION_SECRET env var (auto-generated warning if missing).
 *
 * SWAP: replace this module with your auth provider (Clerk, Firebase, etc.)
 * The rest of the app calls only getSession() and setSessionCookie().
 */
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { SessionPayload } from './types';

const COOKIE_NAME = 'pp_session';
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

function getSecret(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    // In development, warn and use a fallback. In production this should be set.
    console.warn('[PilotPath] SESSION_SECRET not set — using insecure dev default. Set it in .env.local!');
    return new TextEncoder().encode('pilotpath-dev-secret-change-in-production');
  }
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_SECONDS}s`)
    .sign(getSecret());
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export function buildSetCookieHeader(token: string): string {
  return `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${MAX_AGE_SECONDS}`;
}

export function buildClearCookieHeader(): string {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}
