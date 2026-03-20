// src/lib/auth.ts
export function isAdminRole(
  user: { publicMetadata?: Record<string, unknown> } | null | undefined
): boolean {
  return user?.publicMetadata?.role === 'admin';
}
