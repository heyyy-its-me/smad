import { NextRequest, NextResponse } from 'next/server';
import { getOutreachRun } from '@/lib/outreach-store';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ requestId: string }> },
) {
  const { requestId } = await params;
  if (!requestId) return NextResponse.json({ error: 'Missing request_id' }, { status: 400 });
  return NextResponse.json({ request_id: requestId, ...getOutreachRun(requestId) });
}
