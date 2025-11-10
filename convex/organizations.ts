import { v } from 'convex/values';
import { query, mutation } from './_generated/server';
import { requireAuth, requireRole } from './auth';

/**
 * Create a new cluster
 * Only national admin can create clusters
 */
export const createCluster = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, 'national_admin');

    const currentUser = await requireAuth(ctx);
    const clusterId = await ctx.db.insert('clusters', {
      name: args.name,
      description: args.description,
      createdAt: Date.now(),
      createdBy: currentUser._id,
    });

    return { clusterId };
  },
});

/**
 * List all clusters
 * National admin sees all, cluster admin sees only their cluster
 */
export const listClusters = query({
  args: {},
  handler: async (ctx) => {
    const currentUser = await requireAuth(ctx);

    if (currentUser.role === 'national_admin') {
      // National admin sees all clusters
      return await ctx.db.query('clusters').collect();
    } else if (currentUser.role === 'cluster_admin') {
      // Cluster admin sees only their assigned cluster
      const assignments = await ctx.db
        .query('userAssignments')
        .withIndex('by_user', (q) => q.eq('userId', currentUser._id))
        .collect();
      const clusterId = assignments.find((a) => a.clusterId)?.clusterId;
      if (clusterId) {
        const cluster = await ctx.db.get(clusterId);
        return cluster ? [cluster] : [];
      }
      return [];
    }

    return [];
  },
});

/**
 * Create a new CDEJ
 * National admin and cluster admin can create CDEJs
 */
export const createCDEJ = mutation({
  args: {
    name: v.string(),
    clusterId: v.id('clusters'),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const currentUser = await requireAuth(ctx);

    // Check permissions
    if (currentUser.role === 'national_admin') {
      // Can create CDEJ in any cluster
    } else if (currentUser.role === 'cluster_admin') {
      // Can only create CDEJ in their cluster
      const assignments = await ctx.db
        .query('userAssignments')
        .withIndex('by_user', (q) => q.eq('userId', currentUser._id))
        .collect();
      const userClusterId = assignments.find((a) => a.clusterId)?.clusterId;
      if (args.clusterId !== userClusterId) {
        throw new Error('Impossible de créer un CDEJ dans d\'autres clusters');
      }
    } else {
      throw new Error('Permissions insuffisantes pour créer un CDEJ');
    }

    // Verify cluster exists
    const cluster = await ctx.db.get(args.clusterId);
    if (!cluster) {
      throw new Error('Cluster introuvable');
    }

    const cdejId = await ctx.db.insert('cdejs', {
      name: args.name,
      clusterId: args.clusterId,
      description: args.description,
      createdAt: Date.now(),
      createdBy: currentUser._id,
    });

    return { cdejId };
  },
});

/**
 * List CDEJs
 * National admin sees all, cluster admin sees CDEJs in their cluster,
 * CDEJ admin/staff/monitor see only their CDEJ
 */
export const listCDEJs = query({
  args: {
    clusterId: v.optional(v.id('clusters')),
  },
  handler: async (ctx, args) => {
    const currentUser = await requireAuth(ctx);

    if (currentUser.role === 'national_admin') {
      // National admin sees all CDEJs, optionally filtered by cluster
      if (args.clusterId) {
        const clusterId = args.clusterId;
        return await ctx.db
          .query('cdejs')
          .withIndex('by_cluster', (q) => q.eq('clusterId', clusterId))
          .collect();
      }
      return await ctx.db.query('cdejs').collect();
    } else if (currentUser.role === 'cluster_admin') {
      // Cluster admin sees CDEJs in their cluster
      const assignments = await ctx.db
        .query('userAssignments')
        .withIndex('by_user', (q) => q.eq('userId', currentUser._id))
        .collect();
      const clusterId = assignments.find((a) => a.clusterId)?.clusterId;
      if (clusterId) {
        return await ctx.db
          .query('cdejs')
          .withIndex('by_cluster', (q) => q.eq('clusterId', clusterId))
          .collect();
      }
      return [];
    } else if (['cdej_admin', 'cdej_staff', 'cdej_monitor'].includes(currentUser.role)) {
      // CDEJ roles see only their CDEJ
      const assignments = await ctx.db
        .query('userAssignments')
        .withIndex('by_user', (q) => q.eq('userId', currentUser._id))
        .collect();
      const cdejId = assignments.find((a) => a.cdejId)?.cdejId;
      if (cdejId) {
        const cdej = await ctx.db.get(cdejId);
        return cdej ? [cdej] : [];
      }
      return [];
    }

    return [];
  },
});

/**
 * Get CDEJ details
 */
export const getCDEJ = query({
  args: {
    cdejId: v.id('cdejs'),
  },
  handler: async (ctx, args) => {
    const currentUser = await requireAuth(ctx);
    const cdej = await ctx.db.get(args.cdejId);
    if (!cdej) {
      return null;
    }

    // Check access permissions
    if (currentUser.role === 'national_admin') {
      return cdej;
    } else if (currentUser.role === 'cluster_admin') {
      const assignments = await ctx.db
        .query('userAssignments')
        .withIndex('by_user', (q) => q.eq('userId', currentUser._id))
        .collect();
      const clusterId = assignments.find((a) => a.clusterId)?.clusterId;
      if (cdej.clusterId === clusterId) {
        return cdej;
      }
      throw new Error('Accès refusé');
    } else if (['cdej_admin', 'cdej_staff', 'cdej_monitor'].includes(currentUser.role)) {
      const assignments = await ctx.db
        .query('userAssignments')
        .withIndex('by_user', (q) => q.eq('userId', currentUser._id))
        .collect();
      const userCdejId = assignments.find((a) => a.cdejId)?.cdejId;
      if (cdej._id === userCdejId) {
        return cdej;
      }
      throw new Error('Accès refusé');
    }

    throw new Error('Accès refusé');
  },
});

/**
 * Get users for a CDEJ
 * CDEJ admin, staff, and monitor can see users in their CDEJ
 */
export const getCDEJUsers = query({
  args: {
    cdejId: v.id('cdejs'),
  },
  handler: async (ctx, args) => {
    const currentUser = await requireAuth(ctx);

    // Verify CDEJ exists and user has access
    const cdej = await ctx.db.get(args.cdejId);
    if (!cdej) {
      throw new Error('CDEJ introuvable');
    }

    // Check access
    if (currentUser.role === 'national_admin') {
      // Can see all users
    } else if (currentUser.role === 'cluster_admin') {
      // Can see users in CDEJs of their cluster
      const assignments = await ctx.db
        .query('userAssignments')
        .withIndex('by_user', (q) => q.eq('userId', currentUser._id))
        .collect();
      const clusterId = assignments.find((a) => a.clusterId)?.clusterId;
      if (cdej.clusterId !== clusterId) {
        throw new Error('Accès refusé');
      }
    } else if (['cdej_admin', 'cdej_staff', 'cdej_monitor'].includes(currentUser.role)) {
      // Can only see users in their CDEJ
      const assignments = await ctx.db
        .query('userAssignments')
        .withIndex('by_user', (q) => q.eq('userId', currentUser._id))
        .collect();
      const userCdejId = assignments.find((a) => a.cdejId)?.cdejId;
      if (args.cdejId !== userCdejId) {
        throw new Error('Accès refusé');
      }
    } else {
      throw new Error('Accès refusé');
    }

    // Get all user assignments for this CDEJ
    const assignments = await ctx.db
      .query('userAssignments')
      .withIndex('by_cdej', (q) => q.eq('cdejId', args.cdejId))
      .collect();

    // Get user details
    const users = await Promise.all(
      assignments.map(async (assignment) => {
        const user = await ctx.db.get(assignment.userId);
        return user
          ? {
              ...user,
              assignmentRole: assignment.role,
            }
          : null;
      })
    );

    return users.filter((u) => u !== null);
  },
});

/**
 * Get beneficiaries for a CDEJ
 */
export const getCDEJBeneficiaries = query({
  args: {
    cdejId: v.id('cdejs'),
  },
  handler: async (ctx, args) => {
    const currentUser = await requireAuth(ctx);

    // Verify CDEJ exists and user has access (same logic as getCDEJUsers)
    const cdej = await ctx.db.get(args.cdejId);
    if (!cdej) {
      throw new Error('CDEJ introuvable');
    }

    // Check access (same as getCDEJUsers)
    if (currentUser.role === 'national_admin') {
      // Can see all beneficiaries
    } else if (currentUser.role === 'cluster_admin') {
      const assignments = await ctx.db
        .query('userAssignments')
        .withIndex('by_user', (q) => q.eq('userId', currentUser._id))
        .collect();
      const clusterId = assignments.find((a) => a.clusterId)?.clusterId;
      if (cdej.clusterId !== clusterId) {
        throw new Error('Accès refusé');
      }
    } else if (['cdej_admin', 'cdej_staff', 'cdej_monitor'].includes(currentUser.role)) {
      const assignments = await ctx.db
        .query('userAssignments')
        .withIndex('by_user', (q) => q.eq('userId', currentUser._id))
        .collect();
      const userCdejId = assignments.find((a) => a.cdejId)?.cdejId;
      if (args.cdejId !== userCdejId) {
        throw new Error('Accès refusé');
      }
    } else {
      throw new Error('Accès refusé');
    }

    // Get beneficiaries (users with beneficiary role assigned to this CDEJ)
    const assignments = await ctx.db
      .query('userAssignments')
      .withIndex('by_cdej', (q) => q.eq('cdejId', args.cdejId))
      .filter((q) => q.eq(q.field('role'), 'beneficiary'))
      .collect();

    const beneficiaries = await Promise.all(
      assignments.map(async (assignment) => {
        const user = await ctx.db.get(assignment.userId);
        return user ? { ...user, assignment } : null;
      })
    );

    return beneficiaries.filter((b) => b !== null);
  },
});

