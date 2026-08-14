import { NextRequest, NextResponse } from 'next/server';
import { assertJwtConfigured, createJwt } from '@/lib/auth/jwt';
import { getAuthCookieHeaders } from '@/lib/auth/session';
import { createUser } from '@/lib/auth/store';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    assertJwtConfigured();
    const body = await request.json() as Record<string, unknown>;
    const email = typeof body.email === 'string' ? body.email : '';
    const password = typeof body.password === 'string' ? body.password : '';
    const organizationName = typeof body.organization_name === 'string' ? body.organization_name : undefined;

    const user = await createUser({ email, password, organization_name: organizationName });
    if (!user || !user.id || !user.customer_id || !user.email) {
      throw new Error('User creation failed: incomplete user data');
    }

    const token = createJwt({ user_id: user.id, customer_id: user.customer_id, email: user.email });

    const response = NextResponse.json({
      message: 'Signup successful',
      user: { id: user.id, email: user.email, customer_id: user.customer_id },
      customer: { id: user.customer_id },
      token,
    });
    response.headers.set('Set-Cookie', getAuthCookieHeaders(token));

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    
    // Log full error for debugging
    console.error('[Auth Signup] Error:', {
      message,
      stack: error instanceof Error ? error.stack : undefined,
      dbConfigured: !!process.env.DATABASE_URL,
      jwtConfigured: !!process.env.JWT_SECRET,
    });

    if (message === 'DUPLICATE_EMAIL') return NextResponse.json({ error: 'Email is already registered' }, { status: 409 });
    if (message === 'VALIDATION_EMAIL') return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });
    if (message === 'VALIDATION_PASSWORD') return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    if (message.startsWith('JWT_SECRET')) {
      return NextResponse.json({ error: 'Authentication is not configured. Set JWT_SECRET and restart the app.' }, { status: 503 });
    }
    if (message.includes('DATABASE_URL') || message.includes('connect')) {
      return NextResponse.json({ error: 'Database is not configured or unreachable' }, { status: 503 });
    }
    
    return NextResponse.json({ error: 'Signup failed', details: message }, { status: 500 });
  }
}
