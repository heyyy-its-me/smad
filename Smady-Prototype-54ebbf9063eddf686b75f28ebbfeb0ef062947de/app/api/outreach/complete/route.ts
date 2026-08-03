import { NextRequest, NextResponse } from 'next/server';
import { completeOutreachRun } from '@/lib/outreach-store';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as Record<string, unknown>;
    if (typeof body.request_id !== 'string' || !body.request_id) {
      return NextResponse.json({ error: 'Missing request_id' }, { status: 400 });
    }
    completeOutreachRun(body.request_id);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Invalid callback payload' }, { status: 400 });
  }
}
