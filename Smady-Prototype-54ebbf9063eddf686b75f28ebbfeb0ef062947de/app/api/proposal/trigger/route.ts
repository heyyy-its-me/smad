export async function POST(request: Request) {
  const body = await request.json();

  try {
    const webhookUrl = process.env.NEXT_PUBLIC_PROPOSAL_WEBHOOK_URL;
    if (!webhookUrl) {
      return Response.json(
        { error: 'Proposal webhook URL not configured' },
        { status: 500 }
      );
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const text = await response.text();
      return Response.json(
        { error: `Webhook error ${response.status}: ${text}` },
        { status: response.status }
      );
    }

    return Response.json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return Response.json({ error: msg }, { status: 500 });
  }
}
