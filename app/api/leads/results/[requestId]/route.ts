import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { getLeadResult, initLeadResult } from '@/lib/lead-store';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  let auth;
  try {
    auth = requireAuth(request);
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { requestId } = await params;

  if (!requestId || typeof requestId !== 'string') {
    return NextResponse.json({ error: 'Missing request_id' }, { status: 400 });
  }

  initLeadResult(requestId, { customer_id: auth.customer_id, user_id: auth.user_id });
  const result = getLeadResult(requestId, auth.customer_id);

  if (!result) {
    return NextResponse.json(
      { error: 'Request ID not found', status: 'unknown' },
      { status: 404 }
    );
  }

  if (result.status === 'failed') {
    return NextResponse.json({
      status: 'failed',
      error: result.error ?? 'Unknown error',
      request_id: requestId,
    });
  }

  if (result.status === 'processing') {
    return NextResponse.json({
      status: 'processing',
      request_id: requestId,
      message: 'n8n workflow is still processing',
    });
  }

  return NextResponse.json({
    status: 'completed',
    request_id: requestId,
    total_count: result.total_count,
    leads: result.leads,
    completed_at: result.completedAt,
  });
}
