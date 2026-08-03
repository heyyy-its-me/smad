/**
 * POST /api/leads/callback
 *
 * Callback endpoint for n8n to POST final Lead Management results.
 *
 * Expected payload:
 * {
 *   "request_id": "uuid-from-the-initial-trigger",
 *   "status": "completed",
 *   "total_count": 48,
 *   "leads": [
 *     {
 *       "company_name": "ABC Logistics",
 *       "contact_name": "John Smith",
 *       "job_title": "Fleet Manager",
 *       "email": "john@abclogistics.com",
 *       "location": "Toronto, ON",
 *       "score": 92
 *     }
 *   ]
 * }
 *
 * The frontend polls GET /api/leads/results/[requestId] to display these.
 */

import { NextRequest, NextResponse } from 'next/server';
import { updateLeadResult, failLeadResult, initLeadResult } from '@/lib/lead-store';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const requestId = body.request_id as string | undefined;
    if (!requestId || typeof requestId !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid request_id' },
        { status: 400 }
      );
    }

    // Initialize if not already tracked (in case callback arrives before poller)
    initLeadResult(requestId);

    const status = body.status as string | undefined;
    const leads = body.leads as Record<string, unknown>[] | undefined;
    const totalCount = body.total_count as number | undefined;

    if (status === 'failed' || status === 'error') {
      failLeadResult(requestId, body.error ?? 'Unknown error from n8n');
      return NextResponse.json({ ok: true, status: 'failed' });
    }

    if (Array.isArray(leads)) {
      updateLeadResult(requestId, {
        leads,
        total_count: typeof totalCount === 'number' ? totalCount : leads.length,
      });
      return NextResponse.json({ ok: true, status: 'completed', lead_count: leads.length });
    }

    return NextResponse.json({ ok: true, status: 'received' });
  } catch (error) {
    console.error('Lead callback error:', error);
    return NextResponse.json(
      { error: 'Failed to process callback payload' },
      { status: 500 }
    );
  }
}

