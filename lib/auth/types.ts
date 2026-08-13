export interface AuthUser {
  id: string;
  email: string;
  customer_id: string;
}

export interface StoredAuthUser extends AuthUser {
  password_hash: string;
  created_at: string;
}

export interface AuthSession {
  user_id: string;
  customer_id: string;
  email: string;
}

export interface SignupInput {
  email: string;
  password: string;
  organization_name?: string;
}
