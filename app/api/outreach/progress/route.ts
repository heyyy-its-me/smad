import { NextRequest, NextResponse } from 'next/server';
import { recordOutreachUpdate } from '@/lib/outreach-store';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as Record<string, unknown>;
    if (typeof body.request_id !== 'string' || !body.request_id || typeof body.lead_id !== 'string' || !body.lead_id) {
      return NextResponse.json({ error: 'Missing request_id or lead_id' }, { status: 400 });
    }

    const ok = recordOutreachUpdate(body.request_id, {
      lead_id: body.lead_id,
      status: body.status === 'failed' ? 'failed' : 'emailed',
      email: typeof body.email === 'string' ? body.email : undefined,
      subject: typeof body.subject === 'string' ? body.subject : undefined,
      personalization_hook: typeof body.personalization_hook === 'string' ? body.personalization_hook : undefined,
      error: typeof body.error === 'string' ? body.error : undefined,
      customer_id: typeof body.customer_id === 'string' ? body.customer_id : undefined,
      user_id: typeof body.user_id === 'string' ? body.user_id : undefined,
    });
    if (!ok) return NextResponse.json({ error: 'Request ID not found' }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Invalid callback payload' }, { status: 400 });
  }
}
