import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { queryOne } from '@/lib/db';

export const runtime = 'nodejs';

interface CompanyProfile {
  id: string;
  customer_id: string;
  company_name: string;
  product_name: string;
  positioning: string;
  differentiator: string;
  core_problem: string;
  buyer_pain: string;
  target_segment: string;
  confidence_score: number;
  icp_data: Record<string, unknown>;
  gtm_strategy: Record<string, unknown>;
  buyer_persona: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const auth = await requireAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { customer_id } = auth;

    // Fetch company profile
    const profile = await queryOne<CompanyProfile>(
      'SELECT * FROM company_profiles WHERE customer_id = $1',
      [customer_id]
    );

    if (!profile) {
      return NextResponse.json({
        profile: null,
        message: 'No company profile found',
      });
    }

    // Parse JSON fields
    return NextResponse.json({
      profile: {
        ...profile,
        icp_data: profile.icp_data ? JSON.parse(typeof profile.icp_data === 'string' ? profile.icp_data : JSON.stringify(profile.icp_data)) : null,
        gtm_strategy: profile.gtm_strategy ? JSON.parse(typeof profile.gtm_strategy === 'string' ? profile.gtm_strategy : JSON.stringify(profile.gtm_strategy)) : null,
        buyer_persona: profile.buyer_persona ? JSON.parse(typeof profile.buyer_persona === 'string' ? profile.buyer_persona : JSON.stringify(profile.buyer_persona)) : null,
      },
    });
  } catch (error) {
    console.error('[ICP Get] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}
