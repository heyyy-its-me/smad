import { NextRequest, NextResponse } from 'next/server';
import { assertJwtConfigured, createJwt } from '@/lib/auth/jwt';
import { setAuthCookie } from '@/lib/auth/session';
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
    const token = createJwt({ user_id: user.id, customer_id: user.customer_id, email: user.email });
    await setAuthCookie(token);

    return NextResponse.json({
      message: 'Signup successful',
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
    
    // Email validation
    if (message === 'VALIDATION_EMAIL') {
      return NextResponse.json({ error: 'Please provide a valid email address' }, { status: 400 });
    }
    
    // Password validation
    if (message === 'VALIDATION_PASSWORD') {
      return NextResponse.json({ error: 'Password must be at least 8 characters long' }, { status: 400 });
    }
    
    // Duplicate email
    if (message === 'DUPLICATE_EMAIL') {
      return NextResponse.json({ error: 'This email is already registered. Please log in or use a different email.' }, { status: 409 });
    }
    
    // JWT-related errors
    if (message.includes('JWT') || message.includes('Failed to')) {
      console.error('[Auth Signup] JWT Error:', message);
      return NextResponse.json(
        { error: 'An error occurred while creating your session. Please try again.' },
        { status: 500 }
      );
    }
    
    console.error('[Auth Signup] Failed:', message);
    return NextResponse.json({ error: message || 'Signup failed. Please try again.' }, { status: 500 });
  }
}
