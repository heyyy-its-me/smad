/**
 * Lead Store — In-memory store for n8n callback results.
 *
 * When n8n's webhook responds with "workflow started" (acknowledgement),
 * the frontend stays in RUNNING state. n8n then processes the workflow
 * and POSTs the final lead results back to /api/leads/callback.
 *
 * The frontend polls /api/leads/results/[requestId] to retrieve them.
 *
 * IMPORTANT:
 * - This is a SERVER-ONLY module (never import in client components).
 * - In production, replace this with Redis or a database.
 */

interface StoredLeadResult {
  leads: Record<string, unknown>[];
  total_count: number;
  status: 'processing' | 'completed' | 'failed';
  error?: string;
  completedAt?: number;
}

const store = new Map<string, StoredLeadResult>();

export function initLeadResult(requestId: string): void {
  store.set(requestId, {
    leads: [],
    total_count: 0,
    status: 'processing',
  });
}

export function updateLeadResult(
  requestId: string,
  data: { leads: Record<string, unknown>[]; total_count: number }
): void {
  const existing = store.get(requestId);
  if (existing) {
    existing.leads = data.leads;
    existing.total_count = data.total_count;
    existing.status = 'completed';
    existing.completedAt = Date.now();
  }
}

export function failLeadResult(requestId: string, error: string): void {
  const existing = store.get(requestId);
  if (existing) {
    existing.status = 'failed';
    existing.error = error;
    existing.completedAt = Date.now();
  }
}

export function getLeadResult(requestId: string): StoredLeadResult | null {
  const result = store.get(requestId);
  if (!result) return null;

  // Auto-cleanup after 10 minutes
  if (result.completedAt && Date.now() - result.completedAt > 600000) {
    store.delete(requestId);
    return null;
  }

  return result;
}

/**
 * Clean up stale entries every 15 minutes.
 */
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of store.entries()) {
    if (value.completedAt && now - value.completedAt > 600000) {
      store.delete(key);
    }
  }
}, 900000);

