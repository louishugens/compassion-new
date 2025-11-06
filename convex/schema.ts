import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  // Access codes whitelist - validates who can sign up
  accessCodes: defineTable({
    code: v.string(), // Randomly generated unique code
    email: v.string(), // Required email for matching with WorkOS
    status: v.union(
      v.literal('pending'), // Code created but not yet used
      v.literal('active'), // Code assigned to a user
      v.literal('revoked') // Code revoked/disabled
    ),
    role: v.union(
      v.literal('national_admin'),
      v.literal('cluster_admin'),
      v.literal('cdej_admin'),
      v.literal('cdej_staff'),
      v.literal('cdej_monitor'),
      v.literal('beneficiary')
    ),
    // Organizational assignment (optional at creation, can be assigned later)
    clusterId: v.optional(v.id('clusters')),
    cdejId: v.optional(v.id('cdejs')),
    // Audit fields
    assignedAt: v.optional(v.number()),
    assignedBy: v.optional(v.id('users')),
    createdAt: v.number(),
    createdBy: v.optional(v.id('users')),
  })
    .index('by_code', ['code'])
    .index('by_email', ['email'])
    .index('by_status', ['status'])
    .index('by_role', ['role'])
    .index('by_cluster', ['clusterId'])
    .index('by_cdej', ['cdejId']),

  // Users table - extends WorkOS identity with our RBAC data
  users: defineTable({
    workosUserId: v.string(), // From ctx.auth.getUserIdentity().subject
    email: v.string(), // From WorkOS
    code: v.string(), // Links to accessCodes.code
    role: v.union(
      v.literal('national_admin'),
      v.literal('cluster_admin'),
      v.literal('cdej_admin'),
      v.literal('cdej_staff'),
      v.literal('cdej_monitor'),
      v.literal('beneficiary')
    ),
    // WorkOS user data
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    profilePictureUrl: v.optional(v.string()),
    // Status
    profileComplete: v.boolean(),
    isActive: v.boolean(),
    createdAt: v.number(),
  })
    .index('by_workos_user_id', ['workosUserId'])
    .index('by_code', ['code'])
    .index('by_email', ['email'])
    .index('by_role', ['role']),

  // Clusters - groups of CDEJs
  clusters: defineTable({
    name: v.string(),
    code: v.string(), // Unique identifier
    description: v.optional(v.string()),
    createdAt: v.number(),
    createdBy: v.optional(v.id('users')),
  }).index('by_code', ['code']),

  // CDEJs - Centres de Développement d'Enfants et de Jeunes
  cdejs: defineTable({
    name: v.string(),
    code: v.string(), // Unique identifier
    clusterId: v.id('clusters'),
    description: v.optional(v.string()),
    createdAt: v.number(),
    createdBy: v.optional(v.id('users')),
  })
    .index('by_code', ['code'])
    .index('by_cluster', ['clusterId']),

  // User assignments - links users to their organizational units
  userAssignments: defineTable({
    userId: v.id('users'),
    role: v.union(
      v.literal('national_admin'),
      v.literal('cluster_admin'),
      v.literal('cdej_admin'),
      v.literal('cdej_staff'),
      v.literal('cdej_monitor'),
      v.literal('beneficiary')
    ),
    // Organizational assignment based on role
    cdejId: v.optional(v.id('cdejs')), // For CDEJ roles and beneficiaries
    clusterId: v.optional(v.id('clusters')), // For cluster admin
    // Audit fields
    assignedAt: v.number(),
    assignedBy: v.optional(v.id('users')),
  })
    .index('by_user', ['userId'])
    .index('by_cdej', ['cdejId'])
    .index('by_cluster', ['clusterId'])
    .index('by_role', ['role']),

  // Legacy table - keeping for backwards compatibility
  numbers: defineTable({
    value: v.number(),
  }),
});
