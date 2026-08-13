/**
 * Lead Store - server-side result tracking for n8n callback results.
 */

interface StoredLeadResult {
  customer_id: string | null;
  user_id?: string;
  leads: Record<string, unknown>[];
  total_count: number;
  status: 'processing' | 'completed' | 'failed';
  error?: string;
  completedAt?: number;
}

const store = new Map<string, StoredLeadResult>();

export function initLeadResult(requestId: string, context?: { customer_id?: string; user_id?: string }): void {
  const existing = store.get(requestId);
  if (existing) {
    if (!existing.customer_id && context?.customer_id) existing.customer_id = context.customer_id;
    if (!existing.user_id && context?.user_id) existing.user_id = context.user_id;
    return;
  }

  store.set(requestId, {
    customer_id: context?.customer_id ?? null,
    user_id: context?.user_id,
    leads: [],
    total_count: 0,
    status: 'processing',
  });
}

export function leadResultBelongsToCustomer(requestId: string, customerId: string): boolean {
  const existing = store.get(requestId);
  return !!existing && existing.customer_id === customerId;
}

export function updateLeadResult(
  requestId: string,
  data: { leads: Record<string, unknown>[]; total_count: number; customer_id?: string; user_id?: string }
): boolean {
  const existing = store.get(requestId);
  if (!existing) return false;
  if (existing.customer_id && existing.customer_id !== data.customer_id) return false;

  existing.customer_id = existing.customer_id ?? data.customer_id ?? null;
  existing.user_id = existing.user_id ?? data.user_id;
  existing.leads = data.leads;
  existing.total_count = data.total_count;
  existing.status = 'completed';
  existing.completedAt = Date.now();
  return true;
}

export function failLeadResult(requestId: string, error: string, context?: { customer_id?: string; user_id?: string }): boolean {
  const existing = store.get(requestId);
  if (!existing) return false;
  if (existing.customer_id && existing.customer_id !== context?.customer_id) return false;

  existing.customer_id = existing.customer_id ?? context?.customer_id ?? null;
  existing.user_id = existing.user_id ?? context?.user_id;
  existing.status = 'failed';
  existing.error = error;
  existing.completedAt = Date.now();
  return true;
}

export function getLeadResult(requestId: string, customerId: string): StoredLeadResult | null {
  const result = store.get(requestId);
  if (!result || result.customer_id !== customerId) return null;

  if (result.completedAt && Date.now() - result.completedAt > 600000) {
    store.delete(requestId);
    return null;
  }

  return result;
}

setInterval(() => {
  const now = Date.now();
  for (const [key, value] of store.entries()) {
    if (value.completedAt && now - value.completedAt > 600000) {
      store.delete(key);
    }
  }
}, 900000);
