/**
 * Lead Store - persistent database result tracking for n8n callback results.
 * Uses PostgreSQL instead of in-memory storage to work on serverless platforms.
 */

import { query, execute } from './db';

export interface StoredLeadResult {
  request_id: string;
  customer_id: string | null;
  user_id?: string;
  leads: Record<string, unknown>[];
  total_count: number;
  status: 'processing' | 'completed' | 'failed';
  error?: string;
  created_at: number;
  completed_at?: number;
}

/**
 * Initialize the lead_results table if it doesn't exist.
 * Call this once on startup or during migrations.
 */
export async function initLeadResultsTable(): Promise<void> {
  await execute(`
    CREATE TABLE IF NOT EXISTS lead_results (
      request_id TEXT PRIMARY KEY,
      customer_id TEXT,
      user_id TEXT,
      leads JSONB NOT NULL DEFAULT '[]',
      total_count INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'processing',
      error TEXT,
      created_at BIGINT NOT NULL,
      completed_at BIGINT,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE INDEX IF NOT EXISTS idx_lead_results_customer_id ON lead_results(customer_id);
    CREATE INDEX IF NOT EXISTS idx_lead_results_status ON lead_results(status);
    CREATE INDEX IF NOT EXISTS idx_lead_results_created_at ON lead_results(created_at);
  `);
}

export async function initLeadResult(requestId: string, context?: { customer_id?: string; user_id?: string }): Promise<void> {
  try {
    await execute(
      `INSERT INTO lead_results (request_id, customer_id, user_id, created_at, status)
       VALUES ($1, $2, $3, $4, 'processing')
       ON CONFLICT (request_id) DO UPDATE SET
         customer_id = COALESCE(lead_results.customer_id, $2),
         user_id = COALESCE(lead_results.user_id, $3)`,
      [requestId, context?.customer_id ?? null, context?.user_id ?? null, Date.now()]
    );
  } catch (err) {
    console.error('[Lead Store] Error initializing result:', err);
  }
}

export async function leadResultBelongsToCustomer(requestId: string, customerId: string): Promise<boolean> {
  try {
    const results = await query<{ exists: boolean }>(
      `SELECT EXISTS(SELECT 1 FROM lead_results WHERE request_id = $1 AND customer_id = $2)`,
      [requestId, customerId]
    );
    return results[0]?.exists ?? false;
  } catch (err) {
    console.error('[Lead Store] Error checking ownership:', err);
    return false;
  }
}

export async function updateLeadResult(
  requestId: string,
  data: { leads: Record<string, unknown>[]; total_count: number; customer_id?: string; user_id?: string }
): Promise<boolean> {
  try {
    const result = await execute(
      `UPDATE lead_results 
       SET leads = $1, total_count = $2, status = 'completed', completed_at = $3,
           customer_id = COALESCE(customer_id, $4),
           user_id = COALESCE(user_id, $5)
       WHERE request_id = $6 AND status = 'processing'`,
      [JSON.stringify(data.leads), data.total_count, Date.now(), data.customer_id ?? null, data.user_id ?? null, requestId]
    );
    return result > 0;
  } catch (err) {
    console.error('[Lead Store] Error updating result:', err);
    return false;
  }
}

export async function failLeadResult(requestId: string, error: string, context?: { customer_id?: string; user_id?: string }): Promise<boolean> {
  try {
    const result = await execute(
      `UPDATE lead_results 
       SET status = 'failed', error = $1, completed_at = $2,
           customer_id = COALESCE(customer_id, $3),
           user_id = COALESCE(user_id, $4)
       WHERE request_id = $5`,
      [error, Date.now(), context?.customer_id ?? null, context?.user_id ?? null, requestId]
    );
    return result > 0;
  } catch (err) {
    console.error('[Lead Store] Error failing result:', err);
    return false;
  }
}

export async function getLeadResult(requestId: string, customerId: string): Promise<StoredLeadResult | null> {
  try {
    const results = await query<StoredLeadResult>(
      `SELECT request_id, customer_id, user_id, leads, total_count, status, error, created_at, completed_at 
       FROM lead_results 
       WHERE request_id = $1 AND customer_id = $2`,
      [requestId, customerId]
    );
    
    if (results.length === 0) return null;
    
    const result = results[0];
    
    // Clean up old completed results (older than 10 minutes)
    if (result.completed_at && Date.now() - result.completed_at > 600000) {
      await execute('DELETE FROM lead_results WHERE request_id = $1', [requestId]);
      return null;
    }
    
    return result;
  } catch (err) {
    console.error('[Lead Store] Error getting result:', err);
    return null;
  }
}

/**
 * Clean up old completed/failed results (older than 10 minutes)
 * Run this periodically (e.g., every 15 minutes)
 */
export async function cleanupOldResults(): Promise<void> {
  try {
    const tenMinutesAgo = Date.now() - 600000;
    await execute(
      `DELETE FROM lead_results 
       WHERE status IN ('completed', 'failed') 
       AND completed_at < $1`,
      [tenMinutesAgo]
    );
  } catch (err) {
    console.error('[Lead Store] Error cleaning up old results:', err);
  }
}

// Run cleanup every 15 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    cleanupOldResults().catch(console.error);
  }, 15 * 60 * 1000);
}
