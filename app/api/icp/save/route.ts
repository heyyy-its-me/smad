import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { query, execute } from '@/lib/db';

export const runtime = 'nodejs';

interface SaveICPRequest {
  company_name: string;
  product_name: string;
  positioning: string;
  differentiator: string;
  core_problem: string;
  buyer_pain: string;
  target_segment: string;
  confidence_score: number;
  icp_data?: Record<string, unknown>;
  gtm_strategy?: Record<string, unknown>;
  buyer_persona?: Record<string, unknown>;
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const auth = await requireAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { customer_id } = auth;
    const body = await request.json() as SaveICPRequest;

    // Validate required fields
    if (!body.company_name || !body.product_name) {
      return NextResponse.json(
        { error: 'company_name and product_name are required' },
        { status: 400 }
      );
    }

    // Check if profile exists
    const existing = await query<{ id: string }>(
      'SELECT id FROM company_profiles WHERE customer_id = $1',
      [customer_id]
    );

    if (existing.length > 0) {
      // Update existing profile
      await execute(
        `UPDATE company_profiles 
         SET company_name = $1, 
             product_name = $2, 
             positioning = $3,
             differentiator = $4,
             core_problem = $5,
             buyer_pain = $6,
             target_segment = $7,
             confidence_score = $8,
             icp_data = $9,
             gtm_strategy = $10,
             buyer_persona = $11,
             updated_at = CURRENT_TIMESTAMP
         WHERE customer_id = $12`,
        [
          body.company_name,
          body.product_name,
          body.positioning || null,
          body.differentiator || null,
          body.core_problem || null,
          body.buyer_pain || null,
          body.target_segment || null,
          body.confidence_score || null,
          body.icp_data ? JSON.stringify(body.icp_data) : null,
          body.gtm_strategy ? JSON.stringify(body.gtm_strategy) : null,
          body.buyer_persona ? JSON.stringify(body.buyer_persona) : null,
          customer_id,
        ]
      );
    } else {
      // Create new profile
      await execute(
        `INSERT INTO company_profiles (
           customer_id, company_name, product_name, positioning, differentiator,
           core_problem, buyer_pain, target_segment, confidence_score,
           icp_data, gtm_strategy, buyer_persona
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [
          customer_id,
          body.company_name,
          body.product_name,
          body.positioning || null,
          body.differentiator || null,
          body.core_problem || null,
          body.buyer_pain || null,
          body.target_segment || null,
          body.confidence_score || null,
          body.icp_data ? JSON.stringify(body.icp_data) : null,
          body.gtm_strategy ? JSON.stringify(body.gtm_strategy) : null,
          body.buyer_persona ? JSON.stringify(body.buyer_persona) : null,
        ]
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Company profile saved successfully',
    });
  } catch (error) {
    console.error('[ICP Save] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to save ICP data' },
      { status: 500 }
    );
  }
}
