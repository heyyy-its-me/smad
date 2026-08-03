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
  status: 'processing' | 'completed';
  updates: Map<string, OutreachUpdate>;
}

const runs = new Map<string, OutreachRun>();

function getOrCreateRun(requestId: string): OutreachRun {
  const existing = runs.get(requestId);
  if (existing) return existing;
  const run: OutreachRun = { status: 'processing', updates: new Map() };
  runs.set(requestId, run);
  return run;
}

export function recordOutreachUpdate(requestId: string, update: Omit<OutreachUpdate, 'updated_at'>): void {
  getOrCreateRun(requestId).updates.set(update.lead_id, { ...update, updated_at: Date.now() });
}

export function completeOutreachRun(requestId: string): void {
  getOrCreateRun(requestId).status = 'completed';
}

export function getOutreachRun(requestId: string) {
  const run = getOrCreateRun(requestId);
  return { status: run.status, updates: Array.from(run.updates.values()) };
}
