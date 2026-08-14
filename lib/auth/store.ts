import { mkdir, readFile, rename, writeFile } from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';
import { Pool } from 'pg';
import { hashPassword, verifyPassword } from './password';
import type { AuthUser, SignupInput, StoredAuthUser } from './types';

interface AuthStoreData {
  users: StoredAuthUser[];
  customers: Array<{ id: string; name: string; created_at: string }>;
}

const defaultStorePath = path.join(process.cwd(), '.smady-auth-store.json');
const storePath = process.env.SMADY_AUTH_STORE_PATH || defaultStorePath;

const dbConfig = {
  usersTable: process.env.AUTH_USERS_TABLE || 'users',
  customersTable: process.env.AUTH_CUSTOMERS_TABLE || 'customers',
  userCustomersTable: process.env.AUTH_USER_CUSTOMERS_TABLE || '',
  userIdColumn: process.env.AUTH_USER_ID_COLUMN || 'id',
  userEmailColumn: process.env.AUTH_USER_EMAIL_COLUMN || 'email',
  userPasswordColumn: process.env.AUTH_USER_PASSWORD_COLUMN || 'password_hash',
  userCustomerColumn: process.env.AUTH_USER_CUSTOMER_COLUMN || 'customer_id',
  customerIdColumn: process.env.AUTH_CUSTOMER_ID_COLUMN || 'id',
  customerNameColumn: process.env.AUTH_CUSTOMER_NAME_COLUMN || 'name',
  membershipUserColumn: process.env.AUTH_MEMBERSHIP_USER_COLUMN || 'user_id',
  membershipCustomerColumn: process.env.AUTH_MEMBERSHIP_CUSTOMER_COLUMN || 'customer_id',
};

let pool: Pool | null = null;

function getPool(): Pool | null {
  if (!process.env.DATABASE_URL) return null;
  if (!pool) {
    // Add sslmode=require to connection string if needed
    let connectionString = process.env.DATABASE_URL;
    if (!connectionString.includes('sslmode=')) {
      const separator = connectionString.includes('?') ? '&' : '?';
      connectionString = `${connectionString}${separator}sslmode=require`;
    }
    
    // Create pool with SSL configuration for AWS RDS
    pool = new Pool({
      connectionString,
      ssl: {
        rejectUnauthorized: false, // Accept self-signed certificates from AWS RDS
        minVersion: 'TLSv1.2',
      },
    });
  }
  return pool;
}

function identifier(value: string): string {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(value)) {
    throw new Error(`Invalid database identifier: ${value}`);
  }
  return `"${value}"`;
}

function publicUser(user: StoredAuthUser): AuthUser {
  return {
    id: user.id,
    email: user.email,
    customer_id: user.customer_id,
  };
}

async function readFileStore(): Promise<AuthStoreData> {
  try {
    const raw = await readFile(storePath, 'utf8');
    const parsed = JSON.parse(raw) as Partial<AuthStoreData>;
    return {
      users: Array.isArray(parsed.users) ? parsed.users : [],
      customers: Array.isArray(parsed.customers) ? parsed.customers : [],
    };
  } catch (error) {
    const code = (error as { code?: string }).code;
    if (code === 'ENOENT') return { users: [], customers: [] };
    throw error;
  }
}

async function writeFileStore(data: AuthStoreData): Promise<void> {
  await mkdir(path.dirname(storePath), { recursive: true });
  const tmpPath = `${storePath}.${process.pid}.tmp`;
  await writeFile(tmpPath, JSON.stringify(data, null, 2));
  await rename(tmpPath, storePath);
}

async function createFileUser(input: SignupInput): Promise<AuthUser> {
  const email = input.email.trim().toLowerCase();
  if (!email || !email.includes('@')) throw new Error('VALIDATION_EMAIL');
  if (!input.password || input.password.length < 8) throw new Error('VALIDATION_PASSWORD');

  const store = await readFileStore();
  if (store.users.some((user) => user.email === email)) throw new Error('DUPLICATE_EMAIL');

  const now = new Date().toISOString();
  const customerId = randomUUID();
  const customerName = input.organization_name?.trim() || email.split('@')[1] || email;
  const user: StoredAuthUser = {
    id: randomUUID(),
    email,
    customer_id: customerId,
    password_hash: hashPassword(input.password),
    created_at: now,
  };

  store.customers.push({ id: customerId, name: customerName, created_at: now });
  store.users.push(user);
  await writeFileStore(store);
  return publicUser(user);
}

async function createDatabaseUser(input: SignupInput): Promise<AuthUser> {
  const database = getPool();
  if (!database) return createFileUser(input);

  const email = input.email.trim().toLowerCase();
  if (!email || !email.includes('@')) throw new Error('VALIDATION_EMAIL');
  if (!input.password || input.password.length < 8) throw new Error('VALIDATION_PASSWORD');

  const client = await database.connect();
  try {
    await client.query('BEGIN');

    const existing = await client.query(
      `select ${identifier(dbConfig.userIdColumn)} from ${identifier(dbConfig.usersTable)} where lower(${identifier(dbConfig.userEmailColumn)}) = lower($1) limit 1`,
      [email]
    );
    if (existing.rowCount) throw new Error('DUPLICATE_EMAIL');

    const userId = randomUUID();
    const customerId = randomUUID();
    const customerName = input.organization_name?.trim() || email.split('@')[1] || email;
    const passwordHash = hashPassword(input.password);

    await client.query(
      `insert into ${identifier(dbConfig.customersTable)} (${identifier(dbConfig.customerIdColumn)}, ${identifier(dbConfig.customerNameColumn)}) values ($1, $2)`,
      [customerId, customerName]
    );

    await client.query(
      `insert into ${identifier(dbConfig.usersTable)} (${identifier(dbConfig.userIdColumn)}, ${identifier(dbConfig.userEmailColumn)}, ${identifier(dbConfig.userPasswordColumn)}, ${identifier(dbConfig.userCustomerColumn)}) values ($1, $2, $3, $4)`,
      [userId, email, passwordHash, customerId]
    );

    if (dbConfig.userCustomersTable) {
      await client.query(
        `insert into ${identifier(dbConfig.userCustomersTable)} (${identifier(dbConfig.membershipUserColumn)}, ${identifier(dbConfig.membershipCustomerColumn)}) values ($1, $2)`,
        [userId, customerId]
      );
    }

    await client.query('COMMIT');
    return { id: userId, email, customer_id: customerId };
  } catch (error) {
    await client.query('ROLLBACK');
    if ((error as { code?: string }).code === '23505') throw new Error('DUPLICATE_EMAIL');
    throw error;
  } finally {
    client.release();
  }
}

export async function createUser(input: SignupInput): Promise<AuthUser> {
  return createDatabaseUser(input);
}

export async function authenticateUser(emailInput: string, password: string): Promise<AuthUser | null> {
  const database = getPool();
  if (!database) {
    const email = emailInput.trim().toLowerCase();
    const store = await readFileStore();
    const user = store.users.find((candidate) => candidate.email === email);
    if (!user) return null;
    if (!verifyPassword(password, user.password_hash)) return null;
    return publicUser(user);
  }

  const email = emailInput.trim().toLowerCase();
  const result = await database.query(
    `select ${identifier(dbConfig.userIdColumn)} as id, ${identifier(dbConfig.userEmailColumn)} as email, ${identifier(dbConfig.userPasswordColumn)} as password_hash, ${identifier(dbConfig.userCustomerColumn)} as customer_id from ${identifier(dbConfig.usersTable)} where lower(${identifier(dbConfig.userEmailColumn)}) = lower($1) limit 1`,
    [email]
  );
  const user = result.rows[0] as StoredAuthUser | undefined;
  if (!user || !verifyPassword(password, user.password_hash)) return null;
  return publicUser(user);
}

export async function getUserById(userId: string): Promise<AuthUser | null> {
  const database = getPool();
  if (!database) {
    const store = await readFileStore();
    const user = store.users.find((candidate) => candidate.id === userId);
    return user ? publicUser(user) : null;
  }

  const result = await database.query(
    `select ${identifier(dbConfig.userIdColumn)} as id, ${identifier(dbConfig.userEmailColumn)} as email, ${identifier(dbConfig.userCustomerColumn)} as customer_id from ${identifier(dbConfig.usersTable)} where ${identifier(dbConfig.userIdColumn)} = $1 limit 1`,
    [userId]
  );
  const user = result.rows[0] as AuthUser | undefined;
  return user ?? null;
}
