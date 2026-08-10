export async function POST(request: Request) {
  const body = await request.json();

  try {
    const icpApiUrl =
      'https://icp-engine-api-env.eba-vbwk9qkm.eu-north-1.elasticbeanstalk.com/api/v1/recommend';

    console.log('[ICP Proxy] Forwarding request to:', icpApiUrl);
    console.log('[ICP Proxy] Payload:', JSON.stringify(body));

    // Use AbortController for timeout (native Fetch API doesn't support timeout directly)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    try {
      const response = await fetch(icpApiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const text = await response.text();
        console.log('[ICP Proxy] API returned error:', response.status, text);
        return Response.json(
          { error: `ICP API error ${response.status}: ${text.slice(0, 300)}` },
          { status: response.status }
        );
      }

      const data = await response.json();
      console.log('[ICP Proxy] Success:', data);
      return Response.json(data);
    } catch (fetchError) {
      clearTimeout(timeoutId);
      throw fetchError;
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[ICP Proxy] Failed:', msg, error);
    return Response.json(
      { 
        error: `ICP API request failed: ${msg}`,
        details: error instanceof Error ? error.stack : 'No stack trace'
      }, 
      { status: 500 }
    );
  }
}
