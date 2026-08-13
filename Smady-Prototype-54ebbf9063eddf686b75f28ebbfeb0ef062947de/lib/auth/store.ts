import { query, queryOne, execute } from '../db';
import { hashPassword, verifyPassword } from './password';
import type { AuthUser } from './types';

export async function createUser(input: {
  email: string;
  password: string;
  organization_name?: string;
  client_id?: string;
}): Promise<AuthUser> {
  const { email, password, organization_name, client_id } = input;

  // Validation
  if (!email.includes('@')) {
    throw new Error('VALIDATION_EMAIL');
  }
  if (!password || password.length < 8) {
    throw new Error('VALIDATION_PASSWORD');
  }

  // Check for duplicate email
  const existing = await queryOne<{ id: string }>(
    'SELECT id FROM app_users WHERE email = $1',
    [email]
  );

  if (existing) {
    throw new Error('DUPLICATE_EMAIL');
  }

  // Hash password
  const passwordHash = hashPassword(password);

  // Get or create client (if no client_id provided, create default)
  let targetClientId = client_id;
  if (!targetClientId) {
    const clientResult = await queryOne<{ id: string }>(
      'SELECT id FROM clients ORDER BY created_at DESC LIMIT 1'
    );
    if (!clientResult) {
      throw new Error('NO_CLIENT_AVAILABLE');
    }
    targetClientId = clientResult.id;
  }

  // Insert user into database
  const result = await queryOne<AuthUser>(
    `INSERT INTO app_users (
      client_id, email, password_hash, first_name, role, is_active, created_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
    RETURNING 
      id, 
      client_id as customer_id, 
      email, 
      password_hash, 
      first_name as organization_name,
      created_at`,
    [targetClientId, email, passwordHash, organization_name || null, 'member', true]
  );

  if (!result) {
    throw new Error('Failed to create user');
  }

  return {
    id: result.id,
    email: result.email,
    customer_id: result.customer_id,
    password_hash: result.password_hash,
    organization_name: result.organization_name || undefined,
    created_at: result.created_at,
  };
}

export async function authenticateUser(
  email: string,
  password: string
): Promise<AuthUser> {
  // Find user by email
  const user = await queryOne<{
    id: string;
    client_id: string;
    email: string;
    password_hash: string;
    first_name?: string;
    created_at: string;
  }>(
    `SELECT id, client_id, email, password_hash, first_name, created_at 
     FROM app_users 
     WHERE email = $1 AND is_active = true`,
    [email]
  );

  if (!user) {
    throw new Error('Invalid email or password');
  }

  // Verify password
  if (!verifyPassword(password, user.password_hash)) {
    throw new Error('Invalid email or password');
  }

  return {
    id: user.id,
    email: user.email,
    customer_id: user.client_id,
    password_hash: user.password_hash,
    organization_name: user.first_name || undefined,
    created_at: user.created_at,
  };
}

export async function getUserById(userId: string): Promise<AuthUser | null> {
  const user = await queryOne<{
    id: string;
    client_id: string;
    email: string;
    password_hash: string;
    first_name?: string;
    created_at: string;
  }>(
    `SELECT id, client_id, email, password_hash, first_name, created_at 
     FROM app_users 
     WHERE id = $1 AND is_active = true`,
    [userId]
  );

  if (!user) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    customer_id: user.client_id,
    password_hash: user.password_hash,
    organization_name: user.first_name || undefined,
    created_at: user.created_at,
  };
}
