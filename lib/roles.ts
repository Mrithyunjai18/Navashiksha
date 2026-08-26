/** Roles that are allowed into the admin panel and admin-only API routes.
 * Center Head is scoped conceptually to their own branch (set on their user
 * record) but currently shares the same admin panel access as full Admin —
 * branch-level data scoping can be tightened later if needed. */
export const ADMIN_PANEL_ROLES = ['ADMIN', 'CENTER_HEAD'];

export function isAdminRole(role: string | undefined | null): boolean {
  return !!role && ADMIN_PANEL_ROLES.includes(role);
}

export const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Admin',
  CENTER_HEAD: 'Center Head',
  TEACHER: 'Teacher',
};
