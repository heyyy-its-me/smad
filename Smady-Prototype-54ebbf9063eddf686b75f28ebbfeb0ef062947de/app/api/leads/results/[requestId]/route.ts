/**
 * GET /api/leads/results/[requestId]
 *
 * Polling endpoint for the frontend to retrieve Lead Management results
 * after n8n has finished processing and POSTed them to /api/leads/callback.
 *
 * Response:
 * - 200 with lead data when completed
 * - 200 with { status: 'processing' } while n8n is still working
 * - 200 with { status: 'failed', error: '...' } on failure
 * - 404 if request_id not found
 */

import { NextRequest, NextResponse } from 'next/server';
import { getLeadResult, initLeadResult } from '@/lib/lead-store';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  const { requestId } = await params;

  if (!requestId || typeof requestId !== 'string') {
    return NextResponse.json({ error: 'Missing request_id' }, { status: 400 });
  }

  // Initialize the tracking entry — this handles the case where the
  // frontend polls before n8n has posted the callback.
  initLeadResult(requestId);

  const result = getLeadResult(requestId);

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

  // Completed
  return NextResponse.json({
    status: 'completed',
    request_id: requestId,
    total_count: result.total_count,
    leads: result.leads,
    completed_at: result.completedAt,
  });
}

