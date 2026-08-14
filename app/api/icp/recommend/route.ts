import { requireAuth } from '@/lib/auth/session';
import { execute } from '@/lib/db';

export async function POST(request: Request) {
  let auth;
  try {
    auth = requireAuth(request);
  } catch {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();

  try {
    const configuredUrl =
      process.env.ICP_API_RECOMMEND_URL ||
      process.env.ICP_API_BASE_URL ||
      process.env.NEXT_PUBLIC_ICP_API_BASE_URL ||
      'https://icp-engine-api-env.eba-vbwk9qkm.eu-north-1.elasticbeanstalk.com';
    const trimmedUrl = configuredUrl.trim().replace(/\/+$/, '');
    const icpApiUrl = trimmedUrl.endsWith('/api/v1/recommend')
      ? trimmedUrl
      : `${trimmedUrl}/api/v1/recommend`;

    console.log('[ICP Proxy] Forwarding request to:', icpApiUrl);
    console.log('[ICP Proxy] Payload:', JSON.stringify(body));

    // Use AbortController for timeout (native Fetch API doesn't support timeout directly)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    try {
      const response = await fetch(icpApiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...body, customer_id: auth.customer_id, user_id: auth.user_id }),
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

      // Save company profile and analysis data
      if (data.analysis && body.company_name && body.product_name) {
        try {
          const analysis = data.analysis;
          await execute(
            `INSERT INTO company_profiles (
               customer_id, company_name, product_name, positioning, differentiator,
               core_problem, buyer_pain, target_segment, confidence_score,
               icp_data, gtm_strategy, buyer_persona
             ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
             ON CONFLICT (customer_id) DO UPDATE SET
               company_name = $2,
               product_name = $3,
               positioning = $4,
               differentiator = $5,
               core_problem = $6,
               buyer_pain = $7,
               target_segment = $8,
               confidence_score = $9,
               icp_data = $10,
               gtm_strategy = $11,
               buyer_persona = $12,
               updated_at = CURRENT_TIMESTAMP`,
            [
              auth.customer_id,
              body.company_name,
              body.product_name,
              analysis.positioning || null,
              analysis.differentiator || null,
              analysis.core_problem || null,
              analysis.buyer_pain || null,
              analysis.recommended_segment || null,
              data.confidence_score || null,
              JSON.stringify(data.primary_icp || null),
              JSON.stringify(data.gtm_strategy || null),
              JSON.stringify(data.buyer_persona || null),
            ]
          );
          console.log('[ICP Proxy] Profile saved for customer:', auth.customer_id);
        } catch (saveError) {
          console.error('[ICP Proxy] Failed to save profile:', saveError);
          // Don't fail the request, just log the error
        }
      }

      return Response.json(data);
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError instanceof Error) {
        return Response.json(
          {
            error: 'Could not reach the ICP API. Check ICP_API_BASE_URL or ICP_API_RECOMMEND_URL.',
            details: fetchError.message,
            upstream: icpApiUrl,
          },
          { status: fetchError.name === 'AbortError' ? 504 : 502 }
        );
      }
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
