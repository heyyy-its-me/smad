export async function POST(request: Request) {
  const body = await request.json();

  try {
    const icpApiUrl =
      'https://icp-engine-api-env.eba-vbwk9qkm.eu-north-1.elasticbeanstalk.com/api/v1/recommend';

    const response = await fetch(icpApiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const text = await response.text();
      return Response.json(
        { error: `ICP API error ${response.status}: ${text}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return Response.json(data);
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return Response.json({ error: msg }, { status: 500 });
  }
}
