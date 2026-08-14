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

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(',')}]`;
  }

  const record = value as Record<string, unknown>;
  return `{${Object.keys(record)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`)
    .join(',')}}`;
}

function pruneExpiredLocks(now = Date.now()): void {
  for (const [key, lock] of locks.entries()) {
    if (now - lock.startedAt > LEAD_START_LOCK_TTL_MS) {
      locks.delete(key);
    }
  }
}

function leadPayloadFingerprint(customerId: string, payload: Record<string, unknown>): string {
  const {
    request_id: _requestId,
    callback_url: _callbackUrl,
    customer_id: _customerId,
    user_id: _userId,
    ...dedupePayload
  } = payload;

  return `${customerId}:${stableStringify(dedupePayload)}`;
}

export function registerLeadStart(
  customerId: string,
  payload: Record<string, unknown>,
  requestId: string
): { duplicateOf?: string } {
  pruneExpiredLocks();

  const fingerprint = leadPayloadFingerprint(customerId, payload);
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
