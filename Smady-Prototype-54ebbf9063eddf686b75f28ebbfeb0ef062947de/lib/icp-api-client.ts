/**
 * ICP & GTM Recommendation API Client
 * 
 * Integrates with the external ICP recommendation engine.
 * Handles request/response mapping and error handling.
 */

export interface ICPRequestPayload {
  product_description: string;
  target_geography: string;
  business_stage: string;
  priority: string;
  company_name?: string;
  product_name?: string;
}

export interface AnalysisData {
  company_name: string;
  product_name: string;
  positioning: string;
  differentiator: string;
  core_problem: string;
  buyer_pain: string;
  technical_complexity: string;
  recommended_segment: string;
}

export interface GTMStrategy {
  target_countries: string[];
  target_regions: string[];
  recommended_channels: string[];
}

export interface ICPProfile {
  icp: string;
  pain_severity: number;
  market_size: number;
  ease_of_sales: number;
  score: number;
}

export interface BuyerPersona {
  role: string[];
  pain_points: string[];
  goals: string[];
}

export interface ICPRecommendationResponse {
  request_id: string;
  status: 'success' | 'error';
  message?: string;
  analysis?: AnalysisData;
  gtm_strategy?: GTMStrategy;
  primary_icp?: ICPProfile;
  secondary_icps?: ICPProfile[];
  buyer_persona?: BuyerPersona;
  confidence_score?: number;
}

/**
 * Check if response has partial enrichment failure
 * (status=success but empty fields indicate degraded state)
 */
export function isPartialFailure(response: ICPRecommendationResponse): boolean {
  if (response.status !== 'success') return false;
  
  const hasEmptyAnalysis = !response.analysis?.positioning?.trim() || 
                           !response.analysis?.differentiator?.trim();
  const hasEmptyGTM = !response.gtm_strategy || 
                      (response.gtm_strategy.target_countries?.length === 0 &&
                       response.gtm_strategy.target_regions?.length === 0);
  const hasEmptyPersona = !response.buyer_persona || 
                          (response.buyer_persona.role?.length === 0);
  
  return hasEmptyAnalysis || hasEmptyGTM || hasEmptyPersona;
}

/**
 * Make ICP recommendation request
 */
export async function requestICPRecommendation(
  payload: ICPRequestPayload
): Promise<ICPRecommendationResponse> {
  const endpoint = 'https://icp-engine-api-env.eba-vbwk9qkm.eu-north-1.elasticbeanstalk.com/api/v1/recommend';
  
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`API returned ${response.status}: ${response.statusText}`);
    }

    const data: ICPRecommendationResponse = await response.json();
    return data;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`ICP API request failed: ${message}`);
  }
}

/**
 * Extract recommended industries from ICP analysis
 * Returns comma-separated string for Lead Management form
 */
export function extractRecommendedIndustries(response: ICPRecommendationResponse): string {
  // Extract from recommended_segment if available
  if (response.analysis?.recommended_segment) {
    // Try to extract industry keywords from the segment description
    const segment = response.analysis.recommended_segment.toLowerCase();
    // Simple heuristic: if it contains industry keywords, use them
    if (segment.includes('security')) return 'Security & Compliance';
    if (segment.includes('logistics')) return 'Logistics & Supply Chain';
    if (segment.includes('manufacturing')) return 'Manufacturing';
    if (segment.includes('healthcare')) return 'Healthcare';
    if (segment.includes('finance')) return 'Financial Services';
    if (segment.includes('retail')) return 'Retail & E-Commerce';
    if (segment.includes('energy')) return 'Energy & Utilities';
  }
  return '';
}

/**
 * Extract target regions for geography field
 */
export function extractTargetRegions(response: ICPRecommendationResponse): string {
  if (!response.gtm_strategy?.target_regions?.length) return '';
  return response.gtm_strategy.target_regions.join(', ');
}

/**
 * Extract buyer roles for target roles field
 */
export function extractBuyerRoles(response: ICPRecommendationResponse): string {
  if (!response.buyer_persona?.role?.length) return '';
  return response.buyer_persona.role.join(', ');
}

/**
 * Extract company size estimate from ICP description
 * This is a heuristic since the API doesn't explicitly provide company size
 */
export function estimateCompanySize(response: ICPRecommendationResponse): string {
  const icpText = (response.primary_icp?.icp || '').toLowerCase();
  
  if (icpText.includes('enterprise')) return '1000+';
  if (icpText.includes('large')) return '500-1000';
  if (icpText.includes('mid-market')) return '200-500';
  if (icpText.includes('small')) return '51-200';
  
  return '';
}
