export interface OutreachUpdate {
  lead_id: string;
  status: 'emailed' | 'failed';
  email?: string;
  subject?: string;
  personalization_hook?: string;
  error?: string;
  updated_at: number;
}

interface OutreachRun {
  customer_id: string | null;
  user_id?: string;
  status: 'processing' | 'completed';
  updates: Map<string, OutreachUpdate>;
}

const runs = new Map<string, OutreachRun>();

function getOrCreateRun(requestId: string, context?: { customer_id?: string; user_id?: string }): OutreachRun {
  const existing = runs.get(requestId);
  if (existing) {
    if (!existing.customer_id && context?.customer_id) existing.customer_id = context.customer_id;
    if (!existing.user_id && context?.user_id) existing.user_id = context.user_id;
    return existing;
  }

  const run: OutreachRun = {
    customer_id: context?.customer_id ?? null,
    user_id: context?.user_id,
    status: 'processing',
    updates: new Map(),
  };
  runs.set(requestId, run);
  return run;
}

export function initOutreachRun(requestId: string, context: { customer_id: string; user_id?: string }): void {
  getOrCreateRun(requestId, context);
}

export function recordOutreachUpdate(requestId: string, update: Omit<OutreachUpdate, 'updated_at'> & { customer_id?: string; user_id?: string }): boolean {
  const run = getOrCreateRun(requestId, { customer_id: update.customer_id, user_id: update.user_id });
  if (run.customer_id && run.customer_id !== update.customer_id) return false;
  run.updates.set(update.lead_id, { ...update, updated_at: Date.now() });
  return true;
}

export function completeOutreachRun(requestId: string, context?: { customer_id?: string; user_id?: string }): boolean {
  const run = getOrCreateRun(requestId, context);
  if (run.customer_id && run.customer_id !== context?.customer_id) return false;
  run.status = 'completed';
  return true;
}

export function getOutreachRun(requestId: string, customerId: string) {
  const run = runs.get(requestId);
  if (!run || run.customer_id !== customerId) return null;
  return { status: run.status, updates: Array.from(run.updates.values()) };
}
