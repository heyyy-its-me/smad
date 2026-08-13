import { requireAuth } from '@/lib/auth/session';

export async function POST(request: Request) {
  let auth;
  try {
    auth = requireAuth(request);
  } catch {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();

    console.log('\n=== [Proposal Trigger] New Request ===');
    console.log('[Proposal Trigger] Full body:', body);
    console.log('[Proposal Trigger] lead_name:', body.lead_name, 'Type:', typeof body.lead_name);
    console.log('[Proposal Trigger] lead_email:', body.lead_email, 'Type:', typeof body.lead_email);
    console.log('[Proposal Trigger] timestamp:', body.timestamp);

    // Validate required fields
    if (!body.lead_name || typeof body.lead_name !== 'string') {
      console.error('[Proposal Trigger] Missing or invalid lead_name');
      return Response.json(
        { error: 'lead_name is required and must be a string' },
        { status: 400 }
      );
    }

    if (!body.lead_email || typeof body.lead_email !== 'string') {
      console.error('[Proposal Trigger] Missing or invalid lead_email');
      return Response.json(
        { error: 'lead_email is required and must be a string' },
        { status: 400 }
      );
    }

    const webhookUrl = process.env.NEXT_PUBLIC_PROPOSAL_WEBHOOK_URL;
    if (!webhookUrl) {
      console.error('[Proposal Trigger] Webhook URL not configured');
      return Response.json(
        { error: 'Proposal webhook URL not configured' },
        { status: 500 }
      );
    }

    console.log('[Proposal Trigger] Forwarding to webhook URL:', webhookUrl);
    console.log('[Proposal Trigger] Sending payload:', JSON.stringify(body, null, 2));

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...body, customer_id: auth.customer_id, user_id: auth.user_id }),
    });

    const responseText = await response.text();
    console.log('[Proposal Trigger] n8n response status:', response.status);
    console.log('[Proposal Trigger] n8n response body:', responseText);

    if (!response.ok) {
      console.error('[Proposal Trigger] n8n webhook failed:', response.status);
      return Response.json(
        { error: `n8n webhook error ${response.status}: ${responseText}` },
        { status: response.status }
      );
    }

    console.log('[Proposal Trigger] ✓ Successfully sent to n8n');
    console.log('=== [Proposal Trigger] End Request ===\n');
    return Response.json({ success: true, message: 'Proposal triggered successfully' });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Proposal Trigger] ✗ Error:', msg);
    console.error('[Proposal Trigger] Stack:', error instanceof Error ? error.stack : 'No stack');
    return Response.json({ error: msg }, { status: 500 });
  }
}
