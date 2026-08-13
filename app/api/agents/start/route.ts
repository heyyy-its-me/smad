import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { apiClient } from '@/lib/api-client';
import { n8nWebhookAdapter } from '@/lib/n8n-webhook-adapter';
import { initLeadResult } from '@/lib/lead-store';
import { initOutreachRun } from '@/lib/outreach-store';

export const runtime = 'nodejs';

function callbackBaseUrl(request: NextRequest): string {
  return process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
}

export async function POST(request: NextRequest) {
  let auth;
  try {
    auth = requireAuth(request);
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json() as Record<string, unknown>;
    const agentId = typeof body.agentId === 'string' ? body.agentId : '';
    const payload = typeof body.payload === 'object' && body.payload !== null
      ? body.payload as Record<string, unknown>
      : {};

    if (!agentId) {
      return NextResponse.json({ error: 'agentId is required' }, { status: 400 });
    }

    const executionPayload: Record<string, unknown> = {
      ...payload,
      customer_id: auth.customer_id,
      user_id: auth.user_id,
    };

    if (agentId === 'leads') {
      const requestId = typeof executionPayload.request_id === 'string'
        ? executionPayload.request_id
        : crypto.randomUUID();
      executionPayload.request_id = requestId;
      executionPayload.callback_url = `${callbackBaseUrl(request)}/api/leads/callback`;
      initLeadResult(requestId, { customer_id: auth.customer_id, user_id: auth.user_id });
    }

    if (agentId === 'outreach' && typeof executionPayload.request_id === 'string') {
      initOutreachRun(executionPayload.request_id, { customer_id: auth.customer_id, user_id: auth.user_id });
    }

    const adapter = n8nWebhookAdapter.hasWebhook(agentId) ? n8nWebhookAdapter : apiClient;
    const response = await adapter.startExecution({
      agentId,
      payload: executionPayload,
    });

    return NextResponse.json(response);
  } catch (error) {
    const statusCode = typeof (error as { statusCode?: unknown }).statusCode === 'number'
      ? (error as { statusCode: number }).statusCode
      : 500;
    const message = error instanceof Error ? error.message : 'Failed to start agent execution';
    return NextResponse.json({ error: message }, { status: statusCode });
  }
}
