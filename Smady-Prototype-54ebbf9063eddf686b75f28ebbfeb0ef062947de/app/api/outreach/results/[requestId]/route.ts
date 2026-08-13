import { NextRequest, NextResponse } from 'next/server';
import { getOutreachRun } from '@/lib/outreach-store';
import { requireAuth } from '@/lib/auth/session';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ requestId: string }> },
) {
  let auth;
  try {
    auth = requireAuth(request);
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { requestId } = await params;
  if (!requestId) return NextResponse.json({ error: 'Missing request_id' }, { status: 400 });

  const run = getOutreachRun(requestId, auth.customer_id);
  if (!run) return NextResponse.json({ error: 'Request ID not found' }, { status: 404 });

  return NextResponse.json({ request_id: requestId, ...run });
}
