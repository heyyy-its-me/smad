export function getAuthCookieHeaders(token: string): string {
  const maxAge = 7 * 24 * 60 * 60; // 7 days in seconds
  const isProduction = process.env.NODE_ENV === 'production';

  const cookieFlags = [
    `auth_token=${token}`,
    `Max-Age=${maxAge}`,
    'HttpOnly',
    isProduction ? 'Secure' : '',
    'SameSite=Strict',
    isProduction ? `Domain=.vercel.app` : '',
  ]
    .filter(Boolean)
    .join('; ');

  return cookieFlags;
}

export function clearAuthCookie(): string {
  return 'auth_token=; Max-Age=0; HttpOnly; SameSite=Strict; Path=/';
}
