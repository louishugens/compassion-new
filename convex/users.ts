import { v } from 'convex/values';
import { query, mutation } from './_generated/server';
import { getCurrentUser, requireAuth} from './auth';
import { internal } from './_generated/api';


/**
 * Generate a random access code
 * Format: 8-character alphanumeric (uppercase)
 */
function generateAccessCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed confusing chars (0, O, I, 1)
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Validate an access code before sign-up
 * Public mutation - can be called before authentication
 * Using mutation instead of query to allow imperative calls in form handlers
 */
export const validateAccessCode = mutation({
  args: {
    code: v.string(),
    email: v.string(),
  },
  returns: v.union(
    v.object({
      valid: v.literal(false),
      error: v.string(),
    }),
    v.object({
      valid: v.literal(true),
      role: v.union(
        v.literal('national_admin'),
        v.literal('cluster_admin'),
        v.literal('cdej_admin'),
        v.literal('cdej_staff'),
        v.literal('cdej_monitor'),
        v.literal('beneficiary')
      ),
      code: v.string(),
    })
  ),
  handler: async (ctx, args) => {
    const accessCode = await ctx.db
      .query('accessCodes')
      .withIndex('by_code', (q) => q.eq('code', args.code))
      .first();

    if (!accessCode) {
      return {
        valid: false as const,
        error: 'Code d\'accès invalide',
      };
    }

    if (accessCode.status === 'revoked') {
      return {
        valid: false as const,
        error: 'Ce code d\'accès a été révoqué',
      };
    }

    if (accessCode.email.toLowerCase() !== args.email.toLowerCase()) {
      return {
        valid: false as const,
        error: 'L\'email ne correspond pas au code d\'accès',
      };
    }

    // Check if code is already assigned
    const existingUser = await ctx.db
      .query('users')
      .withIndex('by_code', (q) => q.eq('code', args.code))
      .first();

    if (existingUser) {
      return {
        valid: false as const,
        error: 'Ce code d\'accès a déjà été utilisé',
      };
    }

    return {
      valid: true as const,
      code: accessCode.code,
      role: accessCode.role,
    };
  },
});

/**
 * Get current user with full details and assignments
 */
export const getCurrentUserWithAssignments = query({
  args: {},
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id('users'),
      _creationTime: v.number(),
      workosUserId: v.string(),
      email: v.string(),
      code: v.string(),
      role: v.union(
        v.literal('national_admin'),
        v.literal('cluster_admin'),
        v.literal('cdej_admin'),
        v.literal('cdej_staff'),
        v.literal('cdej_monitor'),
        v.literal('beneficiary')
      ),
      firstName: v.optional(v.string()),
      lastName: v.optional(v.string()),
      profilePictureUrl: v.optional(v.string()),
      profileComplete: v.boolean(),
      isActive: v.boolean(),
      createdAt: v.number(),
      assignments: v.array(
        v.object({
          _id: v.id('userAssignments'),
          _creationTime: v.number(),
          userId: v.id('users'),
          role: v.union(
            v.literal('national_admin'),
            v.literal('cluster_admin'),
            v.literal('cdej_admin'),
            v.literal('cdej_staff'),
            v.literal('cdej_monitor'),
            v.literal('beneficiary')
          ),
          cdejId: v.optional(v.id('cdejs')),
          clusterId: v.optional(v.id('clusters')),
          assignedAt: v.number(),
          assignedBy: v.optional(v.id('users')),
        })
      ),
    })
  ),
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      return null;
    }

    // Get user assignments
    const assignments = await ctx.db
      .query('userAssignments')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .collect();

    return {
      ...user,
      assignments,
    };
  },
});

/**
 * Complete user registration after WorkOS authentication
 * Creates user record and links to access code
 */
export const completeRegistration = mutation({
  args: {
    code: v.string(),
    email: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    profilePictureUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Non authentifié');
    }

    // Verify access code
    const accessCode = await ctx.db
      .query('accessCodes')
      .withIndex('by_code', (q) => q.eq('code', args.code))
      .first();

    if (!accessCode) {
      throw new Error('Code d\'accès invalide');
    }

    if (accessCode.status === 'revoked') {
      throw new Error('Code d\'accès révoqué');
    }

    if (accessCode.email.toLowerCase() !== args.email.toLowerCase()) {
      throw new Error('L\'email ne correspond pas au code d\'accès');
    }

    // Check if user already exists
    const existingUser = await ctx.db
      .query('users')
      .withIndex('by_workos_user_id', (q) => q.eq('workosUserId', identity.subject))
      .first();

    if (existingUser) {
      throw new Error('Utilisateur déjà enregistré');
    }

    // Check if code is already used
    const codeUsed = await ctx.db
      .query('users')
      .withIndex('by_code', (q) => q.eq('code', args.code))
      .first();

    if (codeUsed) {
      throw new Error('Code d\'accès déjà utilisé');
    }

    // Create user
    const userId = await ctx.db.insert('users', {
      workosUserId: identity.subject,
      email: args.email.toLowerCase(),
      code: args.code,
      role: accessCode.role,
      firstName: args.firstName,
      lastName: args.lastName,
      profilePictureUrl: args.profilePictureUrl,
      profileComplete: true,
      isActive: true,
      createdAt: Date.now(),
    });

    // Update access code status
    await ctx.db.patch(accessCode._id, {
      status: 'active',
      assignedAt: Date.now(),
    });

    // Create user assignment based on role and access code assignments
    await ctx.db.insert('userAssignments', {
      userId,
      role: accessCode.role,
      cdejId: accessCode.cdejId,
      clusterId: accessCode.clusterId,
      assignedAt: Date.now(),
    });

    return { userId, role: accessCode.role };
  },
});

/**
 * Create a single access code
 * Permissions:
 * - National admin: can create any role
 * - Cluster admin: can create codes for their cluster (cluster_admin, cdej_admin, cdej_staff, cdej_monitor, beneficiary)
 * - CDEJ admin: can create codes for their CDEJ (cdej_staff, cdej_monitor, beneficiary)
 */
export const createAccessCode = mutation({
  args: {
    email: v.string(),
    role: v.union(
      v.literal('national_admin'),
      v.literal('cluster_admin'),
      v.literal('cdej_admin'),
      v.literal('cdej_staff'),
      v.literal('cdej_monitor'),
      v.literal('beneficiary')
    ),
    clusterId: v.optional(v.id('clusters')),
    cdejId: v.optional(v.id('cdejs')),
  },
  handler: async (ctx, args) => {
    const currentUser = await requireAuth(ctx);

    // Check permissions based on role
    if (currentUser.role === 'national_admin') {
      // National admin can create any code
    } else if (currentUser.role === 'cluster_admin') {
      // Cluster admin can only create codes for their cluster
      if (args.role === 'national_admin') {
        throw new Error('L\'administrateur de cluster ne peut pas créer de codes d\'administrateur national');
      }
      // Verify cluster assignment
      const assignments = await ctx.db
        .query('userAssignments')
        .withIndex('by_user', (q) => q.eq('userId', currentUser._id))
        .collect();
      const userClusterId = assignments.find((a) => a.clusterId)?.clusterId;
      if (args.clusterId && args.clusterId !== userClusterId) {
        throw new Error('Impossible de créer des codes pour d\'autres clusters');
      }
      if (!args.clusterId && userClusterId) {
        args.clusterId = userClusterId;
      }
    } else if (currentUser.role === 'cdej_admin') {
      // CDEJ admin can only create codes for their CDEJ (limited roles)
      if (!['cdej_staff', 'cdej_monitor', 'beneficiary'].includes(args.role)) {
        throw new Error('L\'administrateur CDEJ ne peut créer des codes que pour les rôles de personnel, moniteur et bénéficiaire');
      }
      // Verify CDEJ assignment
      const assignments = await ctx.db
        .query('userAssignments')
        .withIndex('by_user', (q) => q.eq('userId', currentUser._id))
        .collect();
      const userCdejId = assignments.find((a) => a.cdejId)?.cdejId;
      if (args.cdejId && args.cdejId !== userCdejId) {
        throw new Error('Impossible de créer des codes pour d\'autres CDEJ');
      }
      if (!args.cdejId && userCdejId) {
        args.cdejId = userCdejId;
      }
    } else {
      throw new Error('Permissions insuffisantes pour créer des codes d\'accès');
    }

    // Validate organizational assignments based on role
    if (args.role === 'cluster_admin' && !args.clusterId) {
      throw new Error('L\'administrateur de cluster nécessite un clusterId');
    }
    if (['cdej_admin', 'cdej_staff', 'cdej_monitor', 'beneficiary'].includes(args.role) && !args.cdejId) {
      throw new Error(`${args.role} nécessite un cdejId`);
    }

    // Check if email already has an active code
    const existingCode = await ctx.db
      .query('accessCodes')
      .withIndex('by_email', (q) => q.eq('email', args.email.toLowerCase()))
      .filter((q) => q.eq(q.field('status'), 'pending'))
      .first();

    if (existingCode) {
      throw new Error('Cet email a déjà un code d\'accès en attente');
    }

    // Generate unique code
    let code: string;
    let codeExists = true;
    while (codeExists) {
      code = generateAccessCode();
      const existing = await ctx.db
        .query('accessCodes')
        .withIndex('by_code', (q) => q.eq('code', code))
        .first();
      codeExists = !!existing;
    }

    // Create access code
    const codeId = await ctx.db.insert('accessCodes', {
      code: code!,
      email: args.email.toLowerCase(),
      status: 'pending',
      role: args.role,
      clusterId: args.clusterId,
      cdejId: args.cdejId,
      createdAt: Date.now(),
      createdBy: currentUser._id,
    });

    // Schedule email to be sent
    await ctx.scheduler.runAfter(0, internal.emails.sendAccessCodeEmail, {
      email: args.email.toLowerCase(),
      code: code!,
    });

    return { codeId, code: code! };
  },
});

/**
 * Bulk create access codes
 * Only national admin and cluster admin can bulk create
 */
export const bulkCreateAccessCodes = mutation({
  args: {
    codes: v.array(
      v.object({
        email: v.string(),
        role: v.union(
          v.literal('national_admin'),
          v.literal('cluster_admin'),
          v.literal('cdej_admin'),
          v.literal('cdej_staff'),
          v.literal('cdej_monitor'),
          v.literal('beneficiary')
        ),
        clusterId: v.optional(v.id('clusters')),
        cdejId: v.optional(v.id('cdejs')),
      })
    ),
  },
  handler: async (ctx, args) => {
    const currentUser = await requireAuth(ctx);

    // Only national admin and cluster admin can bulk create
    if (!['national_admin', 'cluster_admin'].includes(currentUser.role)) {
      throw new Error('Seuls l\'administrateur national et l\'administrateur de cluster peuvent créer des codes en masse');
    }

    const results = [];
    const errors = [];

    for (const codeData of args.codes) {
      try {
        // Reuse createAccessCode logic but inline for bulk operation
        // Get user's cluster if cluster admin
        let clusterId = codeData.clusterId;
        const cdejId = codeData.cdejId;

        if (currentUser.role === 'cluster_admin') {
          const assignments = await ctx.db
            .query('userAssignments')
            .withIndex('by_user', (q) => q.eq('userId', currentUser._id))
            .collect();
          const userClusterId = assignments.find((a) => a.clusterId)?.clusterId;
          if (userClusterId) {
            clusterId = userClusterId;
          }
        }

        // Generate unique code
        let code: string;
        let codeExists = true;
        while (codeExists) {
          code = generateAccessCode();
          const existing = await ctx.db
            .query('accessCodes')
            .withIndex('by_code', (q) => q.eq('code', code))
            .first();
          codeExists = !!existing;
        }

        const codeId = await ctx.db.insert('accessCodes', {
          code: code!,
          email: codeData.email.toLowerCase(),
          status: 'pending',
          role: codeData.role,
          clusterId,
          cdejId,
          createdAt: Date.now(),
          createdBy: currentUser._id,
        });

        // Schedule email to be sent
        await ctx.scheduler.runAfter(0, internal.emails.sendAccessCodeEmail, {
          email: codeData.email.toLowerCase(),
          code: code!,
        });

        results.push({ email: codeData.email, code: code!, codeId });
      } catch (error) {
        errors.push({ email: codeData.email, error: String(error) });
      }
    }

    return { results, errors };
  },
});

/**
 * List access codes
 * National admin sees all, cluster admin sees codes from their cluster,
 * CDEJ admin sees codes from their CDEJ
 */
export const listAccessCodes = query({
  args: {},
  handler: async (ctx) => {
    const currentUser = await requireAuth(ctx);

    if (currentUser.role === 'national_admin') {
      // National admin sees all codes
      const codes = await ctx.db.query('accessCodes').collect();
      
      // Enrich with cluster and CDEJ names
      const enrichedCodes = await Promise.all(
        codes.map(async (code) => {
          const cluster = code.clusterId ? await ctx.db.get(code.clusterId) : null;
          const cdej = code.cdejId ? await ctx.db.get(code.cdejId) : null;
          const user = await ctx.db
            .query('users')
            .withIndex('by_code', (q) => q.eq('code', code.code))
            .first();
          
          return {
            ...code,
            clusterName: cluster?.name,
            cdejName: cdej?.name,
            isUsed: !!user,
          };
        })
      );
      
      return enrichedCodes;
    } else if (currentUser.role === 'cluster_admin') {
      // Cluster admin sees codes from their cluster
      const assignments = await ctx.db
        .query('userAssignments')
        .withIndex('by_user', (q) => q.eq('userId', currentUser._id))
        .collect();
      const userClusterId = assignments.find((a) => a.clusterId)?.clusterId;
      
      if (!userClusterId) {
        return [];
      }
      
      const codes = await ctx.db
        .query('accessCodes')
        .withIndex('by_cluster', (q) => q.eq('clusterId', userClusterId))
        .collect();
      
      // Enrich with cluster and CDEJ names
      const enrichedCodes = await Promise.all(
        codes.map(async (code) => {
          const cluster = code.clusterId ? await ctx.db.get(code.clusterId) : null;
          const cdej = code.cdejId ? await ctx.db.get(code.cdejId) : null;
          const user = await ctx.db
            .query('users')
            .withIndex('by_code', (q) => q.eq('code', code.code))
            .first();
          
          return {
            ...code,
            clusterName: cluster?.name,
            cdejName: cdej?.name,
            isUsed: !!user,
          };
        })
      );
      
      return enrichedCodes;
    } else if (currentUser.role === 'cdej_admin') {
      // CDEJ admin sees codes from their CDEJ
      const assignments = await ctx.db
        .query('userAssignments')
        .withIndex('by_user', (q) => q.eq('userId', currentUser._id))
        .collect();
      const userCdejId = assignments.find((a) => a.cdejId)?.cdejId;
      
      if (!userCdejId) {
        return [];
      }
      
      const codes = await ctx.db
        .query('accessCodes')
        .withIndex('by_cdej', (q) => q.eq('cdejId', userCdejId))
        .collect();
      
      // Enrich with cluster and CDEJ names
      const enrichedCodes = await Promise.all(
        codes.map(async (code) => {
          const cluster = code.clusterId ? await ctx.db.get(code.clusterId) : null;
          const cdej = code.cdejId ? await ctx.db.get(code.cdejId) : null;
          const user = await ctx.db
            .query('users')
            .withIndex('by_code', (q) => q.eq('code', code.code))
            .first();
          
          return {
            ...code,
            clusterName: cluster?.name,
            cdejName: cdej?.name,
            isUsed: !!user,
          };
        })
      );
      
      return enrichedCodes;
    }

    return [];
  },
});

/**
 * Revoke an access code
 */
export const revokeAccessCode = mutation({
  args: {
    codeId: v.id('accessCodes'),
  },
  handler: async (ctx, args) => {
    const currentUser = await requireAuth(ctx);

    const accessCode = await ctx.db.get(args.codeId);
    if (!accessCode) {
      throw new Error('Code d\'accès introuvable');
    }

    // Check permissions
    if (currentUser.role === 'national_admin') {
      // Can revoke any code
    } else if (currentUser.role === 'cluster_admin') {
      // Can only revoke codes from their cluster
      if (accessCode.clusterId) {
        const assignments = await ctx.db
          .query('userAssignments')
          .withIndex('by_user', (q) => q.eq('userId', currentUser._id))
          .collect();
        const userClusterId = assignments.find((a) => a.clusterId)?.clusterId;
        if (accessCode.clusterId !== userClusterId) {
          throw new Error('Impossible de révoquer les codes d\'autres clusters');
        }
      }
    } else if (currentUser.role === 'cdej_admin') {
      // Can only revoke codes from their CDEJ
      if (accessCode.cdejId) {
        const assignments = await ctx.db
          .query('userAssignments')
          .withIndex('by_user', (q) => q.eq('userId', currentUser._id))
          .collect();
        const userCdejId = assignments.find((a) => a.cdejId)?.cdejId;
        if (accessCode.cdejId !== userCdejId) {
          throw new Error('Impossible de révoquer les codes d\'autres CDEJ');
        }
      }
    } else {
      throw new Error('Permissions insuffisantes pour révoquer des codes d\'accès');
    }

    await ctx.db.patch(args.codeId, {
      status: 'revoked',
    });

    // If code is assigned to a user, deactivate the user
    const user = await ctx.db
      .query('users')
      .withIndex('by_code', (q) => q.eq('code', accessCode.code))
      .first();

    if (user) {
      await ctx.db.patch(user._id, {
        isActive: false,
      });
    }

    return { success: true };
  },
});

