import { NextRequest, NextResponse } from 'next/server';
import { assertJwtConfigured, createJwt } from '@/lib/auth/jwt';
import { getAuthCookieHeaders } from '@/lib/auth/session';
import { authenticateUser } from '@/lib/auth/store';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    assertJwtConfigured();
    const body = await request.json() as Record<string, unknown>;
    const email = typeof body.email === 'string' ? body.email : '';
    const password = typeof body.password === 'string' ? body.password : '';

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const user = await authenticateUser(email, password);
    const token = createJwt({ user_id: user.id, customer_id: user.customer_id, email: user.email });

    const response = NextResponse.json({
      message: 'Login successful',
      user: { id: user.id, email: user.email, customer_id: user.customer_id },
      customer: { id: user.customer_id },
      token,
    });

    response.headers.set('Set-Cookie', getAuthCookieHeaders(token));
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    if (message === 'Invalid email or password') {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }
    if (message.startsWith('JWT_SECRET')) {
      return NextResponse.json({ error: 'Authentication is not configured. Set JWT_SECRET and restart the app.' }, { status: 503 });
    }
    console.error('[Auth Login] Failed:', message);
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
