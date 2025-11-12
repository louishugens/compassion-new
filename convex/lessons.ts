import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { Id } from './_generated/dataModel';
import { internal } from './_generated/api';

/**
 * Create a new lesson
 */
export const createLesson = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    content: v.string(),
    imageUrl: v.optional(v.string()),
    videoUrl: v.optional(v.string()),
    ageGroups: v.array(v.string()),
    scope: v.union(v.literal('national'), v.literal('cluster'), v.literal('cdej')),
    clusterId: v.optional(v.id('clusters')),
    cdejId: v.optional(v.id('cdejs')),
    isPublished: v.boolean(),
  },
  returns: v.id('lessons'),
  handler: async (ctx, args) => {
    // Get current user
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Not authenticated');
    }

    // Find user by workosUserId
    const user = await ctx.db
      .query('users')
      .withIndex('by_workos_user_id', (q) => q.eq('workosUserId', identity.subject))
      .unique();

    if (!user) {
      throw new Error('User not found');
    }

    // Validate scope and permissions
    const userAssignment = await ctx.db
      .query('userAssignments')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .first();

    if (!userAssignment) {
      throw new Error('User has no organizational assignment');
    }

    // Validate scope-specific rules
    if (args.scope === 'national') {
      // Only national_admins can create national lessons
      if (userAssignment.role !== 'national_admin') {
        throw new Error('Only national admins can create national lessons');
      }
    } else if (args.scope === 'cluster') {
      // cluster_admins and national_admins can create cluster lessons
      if (userAssignment.role !== 'cluster_admin' && userAssignment.role !== 'national_admin') {
        throw new Error('Only cluster or national admins can create cluster lessons');
      }
      if (!args.clusterId) {
        throw new Error('clusterId is required for cluster scope');
      }
      // Verify cluster admin is assigned to this cluster
      if (userAssignment.role === 'cluster_admin' && userAssignment.clusterId !== args.clusterId) {
        throw new Error('You can only create lessons for your assigned cluster');
      }
    } else if (args.scope === 'cdej') {
      // cdej_admins, cluster_admins, and national_admins can create cdej lessons
      if (
        userAssignment.role !== 'cdej_admin' &&
        userAssignment.role !== 'cluster_admin' &&
        userAssignment.role !== 'national_admin'
      ) {
        throw new Error('Only CDEJ, cluster, or national admins can create CDEJ lessons');
      }
      if (!args.cdejId) {
        throw new Error('cdejId is required for cdej scope');
      }
      // Verify cdej admin is assigned to this cdej
      if (userAssignment.role === 'cdej_admin' && userAssignment.cdejId !== args.cdejId) {
        throw new Error('You can only create lessons for your assigned CDEJ');
      }
    }

    // Create the lesson
    const lessonId: Id<'lessons'> = await ctx.db.insert('lessons', {
      title: args.title,
      description: args.description,
      content: args.content,
      imageUrl: args.imageUrl,
      videoUrl: args.videoUrl,
      ageGroups: args.ageGroups,
      scope: args.scope,
      clusterId: args.clusterId,
      cdejId: args.cdejId,
      isPublished: args.isPublished,
      createdAt: Date.now(),
      createdBy: user._id,
    });

    // Vectorize lesson content for RAG (run asynchronously)
    if (args.isPublished) {
      await ctx.scheduler.runAfter(0, internal.lessonRagActions.vectorizeLesson, {
        lessonId,
      });
    }

    return lessonId;
  },
});

/**
 * Update an existing lesson
 */
export const updateLesson = mutation({
  args: {
    lessonId: v.id('lessons'),
    title: v.string(),
    description: v.string(),
    content: v.string(),
    imageUrl: v.optional(v.string()),
    videoUrl: v.optional(v.string()),
    ageGroups: v.array(v.string()),
    scope: v.union(v.literal('national'), v.literal('cluster'), v.literal('cdej')),
    clusterId: v.optional(v.id('clusters')),
    cdejId: v.optional(v.id('cdejs')),
    isPublished: v.boolean(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Get current user
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Not authenticated');
    }

    // Find user by workosUserId
    const user = await ctx.db
      .query('users')
      .withIndex('by_workos_user_id', (q) => q.eq('workosUserId', identity.subject))
      .unique();

    if (!user) {
      throw new Error('User not found');
    }

    // Verify lesson exists
    const lesson = await ctx.db.get(args.lessonId);
    if (!lesson) {
      throw new Error('Lesson not found');
    }

    // Check if user has permission to edit (must be creator or admin)
    const userAssignment = await ctx.db
      .query('userAssignments')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .first();

    if (!userAssignment) {
      throw new Error('User has no organizational assignment');
    }

    // Only creator or admins can edit
    if (lesson.createdBy !== user._id && 
        userAssignment.role !== 'national_admin' && 
        userAssignment.role !== 'cluster_admin') {
      throw new Error('You do not have permission to edit this lesson');
    }

    // Validate scope-specific rules
    if (args.scope === 'national') {
      if (userAssignment.role !== 'national_admin') {
        throw new Error('Only national admins can create national lessons');
      }
    } else if (args.scope === 'cluster') {
      if (userAssignment.role !== 'cluster_admin' && userAssignment.role !== 'national_admin') {
        throw new Error('Only cluster or national admins can create cluster lessons');
      }
      if (!args.clusterId) {
        throw new Error('clusterId is required for cluster scope');
      }
      if (userAssignment.role === 'cluster_admin' && userAssignment.clusterId !== args.clusterId) {
        throw new Error('You can only create lessons for your assigned cluster');
      }
    } else if (args.scope === 'cdej') {
      if (
        userAssignment.role !== 'cdej_admin' &&
        userAssignment.role !== 'cluster_admin' &&
        userAssignment.role !== 'national_admin'
      ) {
        throw new Error('Only CDEJ, cluster, or national admins can create CDEJ lessons');
      }
      if (!args.cdejId) {
        throw new Error('cdejId is required for cdej scope');
      }
      if (userAssignment.role === 'cdej_admin' && userAssignment.cdejId !== args.cdejId) {
        throw new Error('You can only create lessons for your assigned CDEJ');
      }
    }

    // Update the lesson
    await ctx.db.patch(args.lessonId, {
      title: args.title,
      description: args.description,
      content: args.content,
      imageUrl: args.imageUrl,
      videoUrl: args.videoUrl,
      ageGroups: args.ageGroups,
      scope: args.scope,
      clusterId: args.clusterId,
      cdejId: args.cdejId,
      isPublished: args.isPublished,
      updatedAt: Date.now(),
      updatedBy: user._id,
    });

    // Re-vectorize lesson content if published (run asynchronously)
    if (args.isPublished) {
      await ctx.scheduler.runAfter(0, internal.lessonRagActions.vectorizeLesson, {
        lessonId: args.lessonId,
      });
    }

    return null;
  },
});

/**
 * Delete a lesson
 */
export const deleteLesson = mutation({
  args: {
    lessonId: v.id('lessons'),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Get current user
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Not authenticated');
    }

    // Find user by workosUserId
    const user = await ctx.db
      .query('users')
      .withIndex('by_workos_user_id', (q) => q.eq('workosUserId', identity.subject))
      .unique();

    if (!user) {
      throw new Error('User not found');
    }

    // Verify lesson exists
    const lesson = await ctx.db.get(args.lessonId);
    if (!lesson) {
      throw new Error('Lesson not found');
    }

    // Get user's organizational assignment
    const userAssignment = await ctx.db
      .query('userAssignments')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .first();

    if (!userAssignment) {
      throw new Error('User has no organizational assignment');
    }

    // Check if user has permission to delete (must be creator or admin)
    const isCreator = lesson.createdBy === user._id;
    const isNationalAdmin = userAssignment.role === 'national_admin';
    const isClusterAdmin = userAssignment.role === 'cluster_admin';

    if (!isCreator && !isNationalAdmin && !isClusterAdmin) {
      throw new Error('You do not have permission to delete this lesson');
    }

    // Additional check for cluster admin: can only delete lessons from their cluster
    if (isClusterAdmin && !isNationalAdmin && lesson.scope !== 'national') {
      if (lesson.clusterId && userAssignment.clusterId !== lesson.clusterId) {
        throw new Error('You can only delete lessons from your assigned cluster');
      }
    }

    // Delete lesson chunks (vectorized content)
    await ctx.scheduler.runAfter(0, internal.lessonRag.deleteLessonChunks, {
      lessonId: args.lessonId,
    });

    // Delete the lesson
    await ctx.db.delete(args.lessonId);

    return null;
  },
});

/**
 * Get lessons visible to the current user
 */
export const getLessons = query({
  args: {
    isPublished: v.optional(v.boolean()),
  },
  returns: v.array(
    v.object({
      _id: v.id('lessons'),
      _creationTime: v.number(),
      title: v.string(),
      description: v.string(),
      content: v.string(),
      imageUrl: v.optional(v.string()),
      videoUrl: v.optional(v.string()),
      ageGroups: v.array(v.string()),
      scope: v.union(v.literal('national'), v.literal('cluster'), v.literal('cdej')),
      clusterId: v.optional(v.id('clusters')),
      cdejId: v.optional(v.id('cdejs')),
      isPublished: v.boolean(),
      createdAt: v.number(),
      createdBy: v.id('users'),
      updatedAt: v.optional(v.number()),
      updatedBy: v.optional(v.id('users')),
    })
  ),
  handler: async (ctx, args) => {
    // Get current user
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Not authenticated');
    }

    // Find user by workosUserId
    const user = await ctx.db
      .query('users')
      .withIndex('by_workos_user_id', (q) => q.eq('workosUserId', identity.subject))
      .unique();

    if (!user) {
      throw new Error('User not found');
    }

    // Get user's organizational assignment
    const userAssignment = await ctx.db
      .query('userAssignments')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .first();

    if (!userAssignment) {
      throw new Error('User has no organizational assignment');
    }

    // Collect all lessons the user can see
    const allLessons: Array<any> = [];

    // 1. National lessons (visible to everyone)
    const nationalLessons = await ctx.db
      .query('lessons')
      .withIndex('by_scope', (q) => q.eq('scope', 'national' as const))
      .collect();
    allLessons.push(...nationalLessons);

    // 2. Cluster lessons (if user has cluster access)
    if (userAssignment.clusterId) {
      const clusterLessons = await ctx.db
        .query('lessons')
        .withIndex('by_cluster', (q) => q.eq('clusterId', userAssignment.clusterId))
        .collect();
      allLessons.push(...clusterLessons);
    }

    // 3. CDEJ lessons (if user has cdej access)
    if (userAssignment.cdejId) {
      const cdejLessons = await ctx.db
        .query('lessons')
        .withIndex('by_cdej', (q) => q.eq('cdejId', userAssignment.cdejId))
        .collect();
      allLessons.push(...cdejLessons);
    }

    // Filter by published status if specified
    let filteredLessons = allLessons;
    if (args.isPublished !== undefined) {
      filteredLessons = allLessons.filter((lesson) => lesson.isPublished === args.isPublished);
    }

    // Sort by creation time (most recent first)
    filteredLessons.sort((a, b) => b.createdAt - a.createdAt);

    return filteredLessons;
  },
});

/**
 * Get a single lesson by ID
 */
export const getLesson = query({
  args: {
    lessonId: v.id('lessons'),
  },
  returns: v.union(
    v.object({
      _id: v.id('lessons'),
      _creationTime: v.number(),
      title: v.string(),
      description: v.string(),
      content: v.string(),
      imageUrl: v.optional(v.string()),
      videoUrl: v.optional(v.string()),
      ageGroups: v.array(v.string()),
      scope: v.union(v.literal('national'), v.literal('cluster'), v.literal('cdej')),
      clusterId: v.optional(v.id('clusters')),
      cdejId: v.optional(v.id('cdejs')),
      isPublished: v.boolean(),
      createdAt: v.number(),
      createdBy: v.id('users'),
      updatedAt: v.optional(v.number()),
      updatedBy: v.optional(v.id('users')),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const lesson = await ctx.db.get(args.lessonId);
    return lesson;
  },
});

/**
 * Get all clusters for dropdown
 */
export const getClusters = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id('clusters'),
      name: v.string(),
    })
  ),
  handler: async (ctx) => {
    const clusters = await ctx.db.query('clusters').collect();
    return clusters.map((c) => ({ _id: c._id, name: c.name }));
  },
});

/**
 * Get CDEJs by cluster for dropdown
 */
export const getCdejsByCluster = query({
  args: {
    clusterId: v.id('clusters'),
  },
  returns: v.array(
    v.object({
      _id: v.id('cdejs'),
      name: v.string(),
    })
  ),
  handler: async (ctx, args) => {
    const cdejs = await ctx.db
      .query('cdejs')
      .withIndex('by_cluster', (q) => q.eq('clusterId', args.clusterId))
      .collect();
    return cdejs.map((c) => ({ _id: c._id, name: c.name }));
  },
});

/**
 * Get current user's role and assignments
 */
export const getCurrentUserInfo = query({
  args: {},
  returns: v.union(
    v.object({
      userId: v.id('users'),
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
    }),
    v.null()
  ),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const user = await ctx.db
      .query('users')
      .withIndex('by_workos_user_id', (q) => q.eq('workosUserId', identity.subject))
      .unique();

    if (!user) {
      return null;
    }

    const userAssignment = await ctx.db
      .query('userAssignments')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .first();

    if (!userAssignment) {
      return null;
    }

    return {
      userId: user._id,
      role: userAssignment.role,
      clusterId: userAssignment.clusterId,
      cdejId: userAssignment.cdejId,
    };
  },
});

