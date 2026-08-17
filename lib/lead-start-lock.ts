type LeadStartLock = {
  customerId: string;
  fingerprint: string;
  requestId: string;
  startedAt: number;
};

const LEAD_START_LOCK_TTL_MS = 15 * 60 * 1000;
const LOCKS_KEY = '__smadLeadStartLocks';

type GlobalWithLeadLocks = typeof globalThis & {
  [LOCKS_KEY]?: Map<string, LeadStartLock>;
};

const globalWithLocks = globalThis as GlobalWithLeadLocks;
const locks = globalWithLocks[LOCKS_KEY] ?? new Map<string, LeadStartLock>();
globalWithLocks[LOCKS_KEY] = locks;

function pruneExpiredLocks(now = Date.now()): void {
  for (const [key, lock] of locks.entries()) {
    if (now - lock.startedAt > LEAD_START_LOCK_TTL_MS) {
      locks.delete(key);
    }
  }
}

export function registerLeadStart(
  customerId: string,
  _payload: Record<string, unknown>,
  requestId: string
): { duplicateOf?: string } {
  pruneExpiredLocks();

  // A customer can have one active Lead Management workflow at a time. This
  // prevents a retry or a double click from launching a second n8n execution
  // while the first run is still waiting to post its callback.
  const fingerprint = customerId;
  const existing = locks.get(fingerprint);
  if (existing) {
    return { duplicateOf: existing.requestId };
  }

  locks.set(fingerprint, {
    customerId,
    fingerprint,
    requestId,
    startedAt: Date.now(),
  });

  return {};
}

export function releaseLeadStart(customerId: string | undefined, requestId: string): void {
  pruneExpiredLocks();

  for (const [key, lock] of locks.entries()) {
    const customerMatches = !customerId || lock.customerId === customerId;
    if (customerMatches && lock.requestId === requestId) {
      locks.delete(key);
    }
  }
}
