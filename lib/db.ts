import { Pool, PoolClient } from 'pg';

// Ensure DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

// Add sslmode=require to connection string if not already present
// This is required for AWS RDS which enforces SSL encryption
let connectionString = process.env.DATABASE_URL;
if (!connectionString.includes('sslmode=')) {
  const separator = connectionString.includes('?') ? '&' : '?';
  connectionString = `${connectionString}${separator}sslmode=require`;
}

if (process.env.NODE_ENV === 'development') {
  console.log('[Database] Connecting with SSL enforcement...');
  console.log('[Database] Connection string includes sslmode:', connectionString.includes('sslmode'));
}

// Initialize PostgreSQL connection pool with SSL
// AWS RDS requires SSL encryption - must accept self-signed certificates
const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false, // CRITICAL: Accept self-signed certificates from AWS RDS
    minVersion: 'TLSv1.2',
  },
  application_name: 'smad-next-js',
});

pool.on('error', (err) => {
  console.error('[Database Pool Error]', err);
});

/**
 * Execute a SELECT query and return all rows
 */
export async function query<T>(text: string, params?: unknown[]): Promise<T[]> {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    if (process.env.NODE_ENV === 'development') {
      console.log('[Database Query] Executed in', duration, 'ms');
    }
    return res.rows as T[];
  } catch (error) {
    console.error('[Database Query Error]', {
      text,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Execute a query and return the first row or null
 */
export async function queryOne<T>(text: string, params?: unknown[]): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows.length > 0 ? rows[0] : null;
}

/**
 * Execute an INSERT/UPDATE/DELETE and return the number of rows affected
 */
export async function execute(text: string, params?: unknown[]): Promise<number> {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    if (process.env.NODE_ENV === 'development') {
      console.log('[Database Execute] Affected', res.rowCount, 'rows in', duration, 'ms');
    }
    return res.rowCount || 0;
  } catch (error) {
    console.error('[Database Execute Error]', {
      text,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Get a client for transaction management
 */
export async function getClient(): Promise<PoolClient> {
  return pool.connect();
}

/**
 * Close the pool
 */
export async function closePool(): Promise<void> {
  await pool.end();
}

export default pool;
