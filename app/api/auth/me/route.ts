import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest } from '@/lib/auth/session';
import { verifyJwt } from '@/lib/auth/jwt';
import { getUserById } from '@/lib/auth/store';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) return NextResponse.json({ authenticated: false }, { status: 401 });

    const session = verifyJwt(token);
    const user = await getUserById(session.user_id);
    if (!user || user.customer_id !== session.customer_id) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    return NextResponse.json({
      authenticated: true,
      user: { id: user.id, email: user.email },
      customer: { id: user.customer_id },
    });
  } catch {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}
