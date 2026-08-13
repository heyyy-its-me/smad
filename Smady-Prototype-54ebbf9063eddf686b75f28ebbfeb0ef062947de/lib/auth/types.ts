export type AuthSession = {
  user_id: string;
  customer_id: string;
  email: string;
  iat: number;
  exp: number;
};

export type AuthUser = {
  id: string;
  email: string;
  customer_id: string;
  password_hash: string;
  organization_name?: string;
  created_at: string;
};
