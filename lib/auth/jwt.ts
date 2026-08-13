import { createHmac, timingSafeEqual } from 'crypto';
import type { AuthSession } from './types';

const DEFAULT_TTL_SECONDS = 60 * 60 * 24 * 7;

function base64UrlEncode(value: Buffer | string): string {
  return Buffer.from(value).toString('base64url');
}

function base64UrlDecode(value: string): string {
  return Buffer.from(value, 'base64url').toString('utf8');
}

export function assertJwtConfigured(): void {
  getJwtSecret();
}

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('JWT_SECRET must be set to at least 32 characters.');
  }
  return secret;
}

function signPayload(input: string): string {
  return createHmac('sha256', getJwtSecret()).update(input).digest('base64url');
}

export function createJwt(session: AuthSession): string {
  const now = Math.floor(Date.now() / 1000);
  const ttl = process.env.JWT_EXPIRES_IN_SECONDS ? Number(process.env.JWT_EXPIRES_IN_SECONDS) : DEFAULT_TTL_SECONDS;
  const header = { alg: 'HS256', typ: 'JWT' };
  const payload = {
    user_id: session.user_id,
    customer_id: session.customer_id,
    email: session.email,
    iat: now,
    exp: now + (Number.isFinite(ttl) && ttl > 0 ? ttl : DEFAULT_TTL_SECONDS),
  };
  const unsigned = `${base64UrlEncode(JSON.stringify(header))}.${base64UrlEncode(JSON.stringify(payload))}`;
  return `${unsigned}.${signPayload(unsigned)}`;
}

export function verifyJwt(token: string): AuthSession {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Invalid token');

  const [header, payload, signature] = parts;
  const expected = signPayload(`${header}.${payload}`);
  const signatureBuffer = Buffer.from(signature, 'base64url');
  const expectedBuffer = Buffer.from(expected, 'base64url');
  if (signatureBuffer.length !== expectedBuffer.length || !timingSafeEqual(signatureBuffer, expectedBuffer)) {
    throw new Error('Invalid token signature');
  }

  const decoded = JSON.parse(base64UrlDecode(payload)) as Record<string, unknown>;
  if (typeof decoded.exp !== 'number' || decoded.exp <= Math.floor(Date.now() / 1000)) {
    throw new Error('Token expired');
  }
  if (typeof decoded.user_id !== 'string' || typeof decoded.customer_id !== 'string' || typeof decoded.email !== 'string') {
    throw new Error('Invalid token claims');
  }

  return {
    user_id: decoded.user_id,
    customer_id: decoded.customer_id,
    email: decoded.email,
  };
}
