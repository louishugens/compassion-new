import { QueryCtx, MutationCtx } from './_generated/server';
import { Id, Doc } from './_generated/dataModel';

/**
 * Get the current authenticated user's ID from Convex
 * Returns null if not authenticated
 */
export async function getCurrentUserId(ctx: QueryCtx | MutationCtx): Promise<Id<'users'> | null> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    return null;
  }

  const user = await ctx.db
    .query('users')
    .withIndex('by_workos_user_id', (q) => q.eq('workosUserId', identity.subject))
    .first();

  return user?._id ?? null;
}

/**
 * Get the current authenticated user document
 * Returns null if not authenticated or user doesn't exist
 */
export async function getCurrentUser(ctx: QueryCtx | MutationCtx): Promise<Doc<'users'> | null> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    return null;
  }

  const user = await ctx.db
    .query('users')
    .withIndex('by_workos_user_id', (q) => q.eq('workosUserId', identity.subject))
    .first();

  if (!user || !user.isActive) {
    return null;
  }

  return user;
}

/**
 * Require authentication - throws error if user is not authenticated
 */
export async function requireAuth(ctx: QueryCtx | MutationCtx): Promise<Doc<'users'>> {
  const user = await getCurrentUser(ctx);
  if (!user) {
    throw new Error('Authentification requise');
  }
  return user;
}

/**
 * Role type definition
 */
export type Role =
  | 'national_admin'
  | 'cluster_admin'
  | 'cdej_admin'
  | 'cdej_staff'
  | 'cdej_monitor'
  | 'beneficiary';

/**
 * Check if user has a specific role
 */
export function hasRole(userRole: Role, requiredRole: Role): boolean {
  const roleHierarchy: Record<Role, number> = {
    national_admin: 6,
    cluster_admin: 5,
    cdej_admin: 4,
    cdej_staff: 3,
    cdej_monitor: 2,
    beneficiary: 1,
  };

  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
}

/**
 * Require specific role - throws error if user doesn't have required role
 */
export async function requireRole(
  ctx: QueryCtx | MutationCtx,
  requiredRole: Role
): Promise<Doc<'users'>> {
  const user = await requireAuth(ctx);
  if (!hasRole(user.role, requiredRole)) {
      throw new Error(`Rôle '${requiredRole}' requis`);
  }
  return user;
}

