import type { NextRequest } from 'next/server';
import { verifyJwt } from './jwt';
import type { AuthSession } from './types';

export const AUTH_COOKIE_NAME = 'auth_token';

export function getAuthCookieHeaders(token: string): string {
  const maxAge = 7 * 24 * 60 * 60; // 7 days in seconds
  const isProduction = process.env.NODE_ENV === 'production';

  const cookieFlags = [
    `${AUTH_COOKIE_NAME}=${token}`,
    `Max-Age=${maxAge}`,
    'HttpOnly',
    isProduction ? 'Secure' : '',
    'SameSite=Strict',
    'Path=/',
  ]
    .filter(Boolean)
    .join('; ');

  return cookieFlags;
}

export function clearAuthCookie(): string {
  return `${AUTH_COOKIE_NAME}=; Max-Age=0; HttpOnly; SameSite=Strict; Path=/`;
}

export function getTokenFromRequest(request: NextRequest | Request): string | null {
  const authorization = request.headers.get('authorization');
  if (authorization?.startsWith('Bearer ')) return authorization.slice('Bearer '.length).trim();

  if ('cookies' in request) {
    return request.cookies.get(AUTH_COOKIE_NAME)?.value ?? null;
  }

  const cookieHeader = request.headers.get('cookie');
  if (!cookieHeader) return null;
  const match = cookieHeader
    .split(';')
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${AUTH_COOKIE_NAME}=`));
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
