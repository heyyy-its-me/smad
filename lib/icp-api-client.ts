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
  company_name?: string | null;
  product_name?: string | null;
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
  industry?: string | string[];
  industries?: string[];
  target_industries?: string[];
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
 * Make ICP recommendation request.
 */
export async function requestICPRecommendation(
  payload: ICPRequestPayload
): Promise<ICPRecommendationResponse> {
  const endpoint = '/api/icp/recommend';
  const productDescription = payload.product_description.trim();

  if (!productDescription) {
    throw new Error('Product description is required.');
  }

  // Keep form labels unchanged and translate them at the API boundary.
  const stage = payload.business_stage.trim().toLowerCase();
  const businessStage = stage === 'mvp' ? 'MVP' : stage === 'mature' ? 'scale' : stage;
  const requestPayload: ICPRequestPayload = {
    product_description: productDescription,
    target_geography: payload.target_geography.trim() || 'anywhere',
    business_stage: businessStage || 'MVP',
    priority: payload.priority.trim().toLowerCase() || 'high',
    company_name: payload.company_name?.trim() || null,
    product_name: payload.product_name?.trim() || null,
  };

  return postICPRecommendation(endpoint, requestPayload);
}

async function postICPRecommendation(
  endpoint: string,
  requestPayload: ICPRequestPayload
): Promise<ICPRecommendationResponse> {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestPayload),
  });

  if (!response.ok) {
    const detail = (await response.text()).slice(0, 300);
    throw new Error(`API returned ${response.status}: ${detail || response.statusText}`);
  }

  const data: ICPRecommendationResponse = await response.json();
  if (data.status === 'error') {
    throw new Error(data.message || 'The ICP engine returned an error.');
  }

  return data;
}

/**
 * Extract recommended industries from ICP analysis
 * Returns comma-separated string for Lead Management form
 */
export function extractRecommendedIndustries(response: ICPRecommendationResponse): string {
  const unique = (values: string[]) => [...new Map(
    values
      .map((value) => value.trim())
      .filter(Boolean)
      .map((value) => [value.toLowerCase(), value] as const)
  ).values()];

  const toValues = (value: unknown): string[] => {
    if (Array.isArray(value)) return value.flatMap(toValues);
    if (typeof value !== 'string') return [];
    return value.split(/[,;\n]/).map((item) => item.trim()).filter(Boolean);
  };

  // Prefer the industries explicitly returned by the ICP engine. Its response
  // schema has evolved, so accept the documented variants from every ICP tier.
  const profiles = [response.primary_icp, ...(response.secondary_icps ?? [])];
  const explicitIndustries = unique(profiles.flatMap((profile) => [
    ...toValues(profile?.industry),
    ...toValues(profile?.industries),
    ...toValues(profile?.target_industries),
  ]));
  if (explicitIndustries.length) return explicitIndustries.join(', ');

  // Older responses disclose the vertical in text; derive it afresh rather
  // than retaining an industry from an earlier run.
  const sourceText = [
    response.analysis?.recommended_segment,
    ...profiles.map((profile) => profile?.icp),
  ].filter((value): value is string => Boolean(value)).join(' ').toLowerCase();
  const disclosedIndustries: Array<[RegExp, string]> = [
    [/\b(logistics|supply chain|shipping|freight)\b/, 'Logistics & Supply Chain'],
    [/\b(transportation|trucking|fleet)\b/, 'Transportation/Trucking/Railroad'],
    [/\b(healthcare|health care|hospital|medical)\b/, 'Hospital & Health Care'],
    [/\b(fintech|financial services|banking|insurance)\b/, 'Financial Services'],
    [/\b(cybersecurity|cyber security|computer security)\b/, 'Computer & Network Security'],
    [/\b(manufacturing|industrial automation)\b/, 'Industrial Automation'],
    [/\b(retail|e-commerce|ecommerce)\b/, 'Retail'],
    [/\b(software|saas)\b/, 'Computer Software'],
    [/\b(education|edtech|e-learning)\b/, 'E-Learning'],
    [/\b(energy|utilities|renewable)\b/, 'Utilities'],
  ];

  return unique(disclosedIndustries
    .filter(([pattern]) => pattern.test(sourceText))
    .map(([, industry]) => industry)
  ).join(', ');
}

/**
 * Extract target countries for Lead Management geography.
 * Falls back to broad regions only when countries are not available.
 */
export function extractTargetCountries(response: ICPRecommendationResponse): string {
  const countries = response.gtm_strategy?.target_countries ?? [];
  if (countries.length > 0) return countries.join(', ');

  const regions = response.gtm_strategy?.target_regions ?? [];
  return regions.join(', ');
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
