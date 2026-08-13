import { randomUUID } from 'crypto';
import { hashPassword, verifyPassword } from './password';
import type { AuthUser } from './types';

// In-memory user store (Vercel serverless compatible)
// Data persists during deployment lifecycle, resets on redeploy
const usersStore = new Map<string, AuthUser>();

export async function createUser(input: {
  email: string;
  password: string;
  organization_name?: string;
}): Promise<AuthUser> {
  const { email, password, organization_name } = input;

  // Validation
  if (!email.includes('@')) {
    throw new Error('VALIDATION_EMAIL');
  }
  if (!password || password.length < 8) {
    throw new Error('VALIDATION_PASSWORD');
  }

  // Check for duplicates
  for (const user of usersStore.values()) {
    if (user.email === email) {
      throw new Error('DUPLICATE_EMAIL');
    }
  }

  // Create user
  const userId = randomUUID();
  const customerId = randomUUID();
  const passwordHash = hashPassword(password);
  const createdAt = new Date().toISOString();

  const user: AuthUser = {
    id: userId,
    email,
    customer_id: customerId,
    password_hash: passwordHash,
    organization_name,
    created_at: createdAt,
  };

  usersStore.set(userId, user);
  return user;
}

export async function authenticateUser(
  email: string,
  password: string
): Promise<AuthUser> {
  // Find user by email
  let user: AuthUser | undefined;
  for (const u of usersStore.values()) {
    if (u.email === email) {
      user = u;
      break;
    }
  }

  if (!user) {
    throw new Error('Invalid email or password');
  }

  // Verify password
  if (!verifyPassword(password, user.password_hash)) {
    throw new Error('Invalid email or password');
  }

  return user;
}

export async function getUserById(userId: string): Promise<AuthUser | null> {
  return usersStore.get(userId) || null;
}
