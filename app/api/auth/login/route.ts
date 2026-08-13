import { NextRequest, NextResponse } from 'next/server';
import { assertJwtConfigured, createJwt } from '@/lib/auth/jwt';
import { setAuthCookie } from '@/lib/auth/session';
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
    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const token = createJwt({ user_id: user.id, customer_id: user.customer_id, email: user.email });
    await setAuthCookie(token);

    return NextResponse.json({
      message: 'Login successful',
      user: { id: user.id, email: user.email, customer_id: user.customer_id },
      customer: { id: user.customer_id },
      token,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    
    // JWT Configuration errors
    if (message.includes('JWT_SECRET')) {
      return NextResponse.json(
        { error: 'Authentication is not configured. Please set JWT_SECRET environment variable (minimum 32 characters) and restart the application.' },
        { status: 503 }
      );
    }
    
    // JWT-related errors
    if (message.includes('JWT') || message.includes('Failed to')) {
      console.error('[Auth Login] JWT Error:', message);
      return NextResponse.json(
        { error: 'An error occurred during login. Please try again.' },
        { status: 500 }
      );
    }
    
    console.error('[Auth Login] Failed:', message);
    return NextResponse.json({ error: message || 'Login failed. Please try again.' }, { status: 500 });
  }
}
