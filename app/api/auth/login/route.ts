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
    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // Destructure to ensure TypeScript recognizes non-null values
    const { id: userId, customer_id: customerId, email: userEmail } = user;
    const token = createJwt({ 
      user_id: userId, 
      customer_id: customerId, 
      email: userEmail || email 
    });

    const response = NextResponse.json({
      message: 'Login successful',
      user: { id: user.id, email: user.email, customer_id: user.customer_id },
      customer: { id: user.customer_id },
      token,
    });
    response.headers.set('Set-Cookie', getAuthCookieHeaders(token));

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    
    // Log full error for debugging
    console.error('[Auth Login] Error:', {
      message,
      stack: error instanceof Error ? error.stack : undefined,
      dbConfigured: !!process.env.DATABASE_URL,
      jwtConfigured: !!process.env.JWT_SECRET,
    });

    if (message.startsWith('JWT_SECRET')) {
      return NextResponse.json({ error: 'Authentication is not configured. Set JWT_SECRET and restart the app.' }, { status: 503 });
    }
    if (message.includes('DATABASE_URL') || message.includes('connect')) {
      return NextResponse.json({ error: 'Database is not configured or unreachable' }, { status: 503 });
    }
    
    return NextResponse.json({ error: 'Login failed', details: message }, { status: 500 });
  }
}
