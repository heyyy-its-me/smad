import { createHmac, timingSafeEqual } from 'crypto';
import type { AuthSession } from './types';

const DEFAULT_TTL_SECONDS = 60 * 60 * 24 * 7;

function base64UrlEncode(value: Buffer | string): string {
  try {
    return Buffer.from(value).toString('base64url');
  } catch (error) {
    throw new Error(`Failed to encode JWT component: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

function base64UrlDecode(value: string): string {
  try {
    return Buffer.from(value, 'base64url').toString('utf8');
  } catch (error) {
    throw new Error(`Failed to decode JWT component: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export function assertJwtConfigured(): void {
  getJwtSecret();
}

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET?.trim();
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not set. Please set a secret with at least 32 characters.');
  }
  if (secret.length < 32) {
    throw new Error(`JWT_SECRET must be at least 32 characters long. Current length: ${secret.length}`);
  }
  return secret;
}

function signPayload(input: string): string {
  try {
    const secret = getJwtSecret();
    return createHmac('sha256', secret).update(input).digest('base64url');
  } catch (error) {
    throw new Error(`Failed to sign JWT: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export function createJwt(session: AuthSession): string {
  try {
    const now = Math.floor(Date.now() / 1000);
    let ttl = DEFAULT_TTL_SECONDS;
    
    if (process.env.JWT_EXPIRES_IN_SECONDS) {
      const parsedTtl = Number(process.env.JWT_EXPIRES_IN_SECONDS);
      if (Number.isFinite(parsedTtl) && parsedTtl > 0) {
        ttl = parsedTtl;
      }
    }
    
    const header = { alg: 'HS256', typ: 'JWT' };
    const payload = {
      user_id: session.user_id,
      customer_id: session.customer_id,
      email: session.email,
      iat: now,
      exp: now + ttl,
    };
    
    const headerEncoded = base64UrlEncode(JSON.stringify(header));
    const payloadEncoded = base64UrlEncode(JSON.stringify(payload));
    const unsigned = `${headerEncoded}.${payloadEncoded}`;
    const signature = signPayload(unsigned);
    
    return `${unsigned}.${signature}`;
  } catch (error) {
    throw new Error(`Failed to create JWT: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export function verifyJwt(token: string): AuthSession {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) throw new Error('Invalid token format: expected 3 parts (header.payload.signature)');

    const [header, payload, signature] = parts;
    const expected = signPayload(`${header}.${payload}`);
    
    let signatureBuffer: Buffer;
    let expectedBuffer: Buffer;
    
    try {
      signatureBuffer = Buffer.from(signature, 'base64url');
      expectedBuffer = Buffer.from(expected, 'base64url');
    } catch (error) {
      throw new Error(`Failed to decode token components: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    if (signatureBuffer.length !== expectedBuffer.length || !timingSafeEqual(signatureBuffer, expectedBuffer)) {
      throw new Error('Invalid token signature');
    }

    let decoded: Record<string, unknown>;
    try {
      decoded = JSON.parse(base64UrlDecode(payload)) as Record<string, unknown>;
    } catch (error) {
      throw new Error(`Failed to decode token payload: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    const now = Math.floor(Date.now() / 1000);
    if (typeof decoded.exp !== 'number') {
      throw new Error('Invalid token claims: missing or invalid exp field');
    }
    if (decoded.exp <= now) {
      throw new Error('Token expired');
    }
    if (typeof decoded.user_id !== 'string' || typeof decoded.customer_id !== 'string' || typeof decoded.email !== 'string') {
      throw new Error('Invalid token claims: missing required fields (user_id, customer_id, email)');
    }

    return {
      user_id: decoded.user_id,
      customer_id: decoded.customer_id,
      email: decoded.email,
    };
  } catch (error) {
    throw new Error(`JWT verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
