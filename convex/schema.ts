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
    // Profile data
    birthDate: v.optional(v.number()), // Timestamp of birth date
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
    description: v.optional(v.string()),
    createdAt: v.number(),
    createdBy: v.optional(v.id('users')),
  }),

  // CDEJs - Centres de Développement d'Enfants et de Jeunes
  cdejs: defineTable({
    name: v.string(),
    clusterId: v.id('clusters'),
    description: v.optional(v.string()),
    createdAt: v.number(),
    createdBy: v.optional(v.id('users')),
  })
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

  // Lessons - educational content for beneficiaries
  lessons: defineTable({
    title: v.string(),
    description: v.string(),
    content: v.string(), // Rich text HTML content
    // Media attachments (optional)
    imageUrl: v.optional(v.string()),
    videoUrl: v.optional(v.string()),
    // Target audience
    ageGroups: v.array(v.string()), // e.g., ["6-10", "11-15", "16-18"]
    // Organizational scope
    scope: v.union(
      v.literal('national'), // visible to all clusters/cdejs
      v.literal('cluster'),  // visible to all cdejs in a cluster
      v.literal('cdej')      // visible to a specific cdej
    ),
    clusterId: v.optional(v.id('clusters')), // Required for cluster and cdej scope
    cdejId: v.optional(v.id('cdejs')),       // Required for cdej scope
    // Status and metadata
    isPublished: v.boolean(),
    createdAt: v.number(),
    createdBy: v.id('users'),
    updatedAt: v.optional(v.number()),
    updatedBy: v.optional(v.id('users')),
  })
    .index('by_scope', ['scope'])
    .index('by_cluster', ['clusterId'])
    .index('by_cdej', ['cdejId'])
    .index('by_created_by', ['createdBy'])
    .index('by_is_published', ['isPublished']),

  // Quizzes - assessments linked to lessons
  quizzes: defineTable({
    title: v.string(),
    description: v.string(),
    lessonId: v.optional(v.id('lessons')), // Optional: quiz can be standalone or linked to a lesson
    // Pass criteria
    passingScore: v.number(), // Minimum percentage to pass (0-100)
    // Target audience
    ageGroups: v.array(v.string()), // e.g., ["6-10", "11-15", "16-18"]
    // Organizational scope (inherited from lesson or standalone)
    scope: v.union(
      v.literal('national'),
      v.literal('cluster'),
      v.literal('cdej')
    ),
    clusterId: v.optional(v.id('clusters')),
    cdejId: v.optional(v.id('cdejs')),
    // Validity period
    validFrom: v.optional(v.number()), // Timestamp when quiz becomes available
    validUntil: v.optional(v.number()), // Timestamp when quiz expires
    // Status and metadata
    isPublished: v.boolean(),
    createdAt: v.number(),
    createdBy: v.id('users'),
    updatedAt: v.optional(v.number()),
    updatedBy: v.optional(v.id('users')),
  })
    .index('by_lesson', ['lessonId'])
    .index('by_scope', ['scope'])
    .index('by_cluster', ['clusterId'])
    .index('by_cdej', ['cdejId'])
    .index('by_is_published', ['isPublished']),

  // Questions - individual questions in a quiz
  questions: defineTable({
    quizId: v.id('quizzes'),
    questionText: v.string(),
    // Answers - array of possible answers
    answers: v.array(
      v.object({
        text: v.string(),
        isCorrect: v.boolean(),
      })
    ),
    points: v.number(), // Points awarded for correct answer
    order: v.number(), // Display order in quiz
    createdAt: v.number(),
  })
    .index('by_quiz', ['quizId'])
    .index('by_quiz_and_order', ['quizId', 'order']),

  // Quiz Attempts - tracks user quiz attempts and results
  quizAttempts: defineTable({
    quizId: v.id('quizzes'),
    userId: v.id('users'),
    // Results
    score: v.number(), // Total points earned
    maxScore: v.number(), // Total possible points
    percentage: v.number(), // Score as percentage (0-100)
    passed: v.boolean(), // Whether the user passed
    // Answers given
    answers: v.array(
      v.object({
        questionId: v.id('questions'),
        selectedAnswerIndex: v.number(), // Index of the selected answer
        isCorrect: v.boolean(),
        pointsEarned: v.number(),
      })
    ),
    // Timing
    startedAt: v.number(),
    completedAt: v.number(),
  })
    .index('by_quiz', ['quizId'])
    .index('by_user', ['userId'])
    .index('by_quiz_and_user', ['quizId', 'userId'])
    .index('by_user_and_completed', ['userId', 'completedAt']),
});
