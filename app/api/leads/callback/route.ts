/**
 * POST /api/leads/callback
 *
 * Callback endpoint for n8n to POST final Lead Management results.
 *
 * Expected payload:
 * {
 *   "request_id": "uuid-from-the-initial-trigger",
 *   "status": "completed" | "low_score" | "failed",
 *   "total_count": 48,
 *   "leads": [...],
 *   "reason": "optional reason for low_score status",
 *   "message": "optional message to display to user"
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

    const customerId = typeof body.customer_id === 'string' ? body.customer_id : undefined;
    const userId = typeof body.user_id === 'string' ? body.user_id : undefined;

    // Initialize if not already tracked (in case callback arrives before poller)
    initLeadResult(requestId, { customer_id: customerId, user_id: userId });

    const status = body.status as string | undefined;
    const leads = body.leads as Record<string, unknown>[] | undefined;
    const totalCount = body.total_count as number | undefined;

    // Handle low-score status (leads filtered out)
    if (status === 'low_score') {
      const reason = body.reason as string | undefined;
      const message = body.message as string | undefined;
      if (!failLeadResult(requestId, message ?? reason ?? 'Leads did not meet qualification threshold', { customer_id: customerId, user_id: userId })) {
        return NextResponse.json({ error: 'Request ID not found' }, { status: 404 });
      }
      return NextResponse.json({ 
        ok: true, 
        status: 'low_score',
        message: message ?? reason 
      });
    }

    if (status === 'failed' || status === 'error') {
      if (!failLeadResult(requestId, body.error ?? 'Unknown error from n8n', { customer_id: customerId, user_id: userId })) {
        return NextResponse.json({ error: 'Request ID not found' }, { status: 404 });
      }
      return NextResponse.json({ ok: true, status: 'failed' });
    }

    if (Array.isArray(leads)) {
      if (!updateLeadResult(requestId, {
        leads,
        total_count: typeof totalCount === 'number' ? totalCount : leads.length,
        customer_id: customerId,
        user_id: userId,
      })) {
        return NextResponse.json({ error: 'Request ID not found' }, { status: 404 });
      }
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

