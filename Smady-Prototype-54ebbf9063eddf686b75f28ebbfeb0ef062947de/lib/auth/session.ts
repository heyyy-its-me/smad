import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';
import { verifyJwt } from './jwt';
import type { AuthSession } from './types';

export const AUTH_COOKIE_NAME = 'smady_session';

export async function setAuthCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: process.env.JWT_EXPIRES_IN_SECONDS ? Number(process.env.JWT_EXPIRES_IN_SECONDS) : 60 * 60 * 24 * 7,
  });
}

export async function clearAuthCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_COOKIE_NAME);
}

export function getTokenFromRequest(request: NextRequest | Request): string | null {
  const authorization = request.headers.get('authorization');
  if (authorization?.startsWith('Bearer ')) return authorization.slice('Bearer '.length).trim();

  if ('cookies' in request) {
    return request.cookies.get(AUTH_COOKIE_NAME)?.value ?? null;
  }

  const cookieHeader = request.headers.get('cookie');
  if (!cookieHeader) return null;
  const match = cookieHeader.split(';').map((item) => item.trim()).find((item) => item.startsWith(`${AUTH_COOKIE_NAME}=`));
  return match ? decodeURIComponent(match.slice(AUTH_COOKIE_NAME.length + 1)) : null;
}

export function requireAuth(request: NextRequest | Request): AuthSession {
  const token = getTokenFromRequest(request);
  if (!token) throw new Error('Missing authentication token');
  return verifyJwt(token);
}

export function authErrorResponse(message = 'Unauthorized'): Response {
  return Response.json({ error: message }, { status: 401 });
}
