/**
 * Lead Start Lock - prevents duplicate Lead Management workflows.
 * Uses PostgreSQL for persistence across serverless instances.
 */

import { query, execute } from './db';

export interface LeadStartLock {
  customer_id: string;
  fingerprint: string;
  request_id: string;
  started_at: number;
}

const LEAD_START_LOCK_TTL_MS = 15 * 60 * 1000;

/**
 * Initialize the lead_start_locks table if it doesn't exist.
 */
async function initLocksTable(): Promise<void> {
  await execute(`
    CREATE TABLE IF NOT EXISTS lead_start_locks (
      id SERIAL PRIMARY KEY,
      customer_id TEXT NOT NULL,
      fingerprint TEXT NOT NULL UNIQUE,
      request_id TEXT NOT NULL,
      started_at BIGINT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE INDEX IF NOT EXISTS idx_lead_start_locks_customer_id ON lead_start_locks(customer_id);
    CREATE INDEX IF NOT EXISTS idx_lead_start_locks_request_id ON lead_start_locks(request_id);
  `);
}

/**
 * Clean up expired locks (older than 15 minutes)
 */
async function pruneExpiredLocks(): Promise<void> {
  try {
    const cutoffTime = Date.now() - LEAD_START_LOCK_TTL_MS;
    await execute(
      'DELETE FROM lead_start_locks WHERE started_at < $1',
      [cutoffTime]
    );
  } catch (err) {
    console.error('[Lead Start Lock] Error pruning expired locks:', err);
  }
}

export async function registerLeadStart(
  customerId: string,
  _payload: Record<string, unknown>,
  requestId: string
): Promise<{ duplicateOf?: string }> {
  try {
    await initLocksTable();
    await pruneExpiredLocks();

    // A customer can have one active Lead Management workflow at a time.
    const fingerprint = customerId;
    
    // Check if lock already exists
    const existing = await query<{ request_id: string }>(
      'SELECT request_id FROM lead_start_locks WHERE fingerprint = $1',
      [fingerprint]
    );

    if (existing.length > 0) {
      return { duplicateOf: existing[0].request_id };
    }

    // Create new lock
    await execute(
      `INSERT INTO lead_start_locks (customer_id, fingerprint, request_id, started_at)
       VALUES ($1, $2, $3, $4)`,
      [customerId, fingerprint, requestId, Date.now()]
    );

    return {};
  } catch (err) {
    console.error('[Lead Start Lock] Error registering lock:', err);
    // If DB fails, don't block the workflow
    return {};
  }
}

export async function releaseLeadStart(customerId: string | undefined, requestId: string): Promise<void> {
  try {
    await initLocksTable();

    const whereClause = customerId 
      ? 'customer_id = $1 AND request_id = $2'
      : 'request_id = $1';
    
    const params = customerId ? [customerId, requestId] : [requestId];

    await execute(
      `DELETE FROM lead_start_locks WHERE ${whereClause}`,
      params
    );
  } catch (err) {
    console.error('[Lead Start Lock] Error releasing lock:', err);
  }
}

// Run cleanup every 15 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    pruneExpiredLocks().catch(console.error);
  }, 15 * 60 * 1000);
}
