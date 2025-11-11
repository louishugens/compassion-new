import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { Id } from './_generated/dataModel';

/**
 * Create a new quiz
 */
export const createQuiz = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    lessonId: v.optional(v.id('lessons')),
    passingScore: v.number(),
    ageGroups: v.array(v.string()),
    scope: v.union(v.literal('national'), v.literal('cluster'), v.literal('cdej')),
    clusterId: v.optional(v.id('clusters')),
    cdejId: v.optional(v.id('cdejs')),
    validFrom: v.optional(v.number()),
    validUntil: v.optional(v.number()),
    isPublished: v.boolean(),
  },
  returns: v.id('quizzes'),
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

    // Validate scope and permissions (same as lessons)
    const userAssignment = await ctx.db
      .query('userAssignments')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .first();

    if (!userAssignment) {
      throw new Error('User has no organizational assignment');
    }

    // Validate scope-specific rules
    if (args.scope === 'national') {
      if (userAssignment.role !== 'national_admin') {
        throw new Error('Only national admins can create national quizzes');
      }
    } else if (args.scope === 'cluster') {
      if (userAssignment.role !== 'cluster_admin' && userAssignment.role !== 'national_admin') {
        throw new Error('Only cluster or national admins can create cluster quizzes');
      }
      if (!args.clusterId) {
        throw new Error('clusterId is required for cluster scope');
      }
      if (userAssignment.role === 'cluster_admin' && userAssignment.clusterId !== args.clusterId) {
        throw new Error('You can only create quizzes for your assigned cluster');
      }
    } else if (args.scope === 'cdej') {
      if (
        userAssignment.role !== 'cdej_admin' &&
        userAssignment.role !== 'cluster_admin' &&
        userAssignment.role !== 'national_admin'
      ) {
        throw new Error('Only CDEJ, cluster, or national admins can create CDEJ quizzes');
      }
      if (!args.cdejId) {
        throw new Error('cdejId is required for cdej scope');
      }
      if (userAssignment.role === 'cdej_admin' && userAssignment.cdejId !== args.cdejId) {
        throw new Error('You can only create quizzes for your assigned CDEJ');
      }
    }

    // Validate passing score
    if (args.passingScore < 0 || args.passingScore > 100) {
      throw new Error('Passing score must be between 0 and 100');
    }

    // Validate age groups
    if (args.ageGroups.length === 0) {
      throw new Error('At least one age group must be selected');
    }

    // Validate validity period
    if (args.validFrom !== undefined && args.validUntil !== undefined) {
      if (args.validFrom >= args.validUntil) {
        throw new Error('Valid from date must be before valid until date');
      }
    }

    // Create the quiz
    const quizId: Id<'quizzes'> = await ctx.db.insert('quizzes', {
      title: args.title,
      description: args.description,
      lessonId: args.lessonId,
      passingScore: args.passingScore,
      ageGroups: args.ageGroups,
      scope: args.scope,
      clusterId: args.clusterId,
      cdejId: args.cdejId,
      validFrom: args.validFrom,
      validUntil: args.validUntil,
      isPublished: args.isPublished,
      createdAt: Date.now(),
      createdBy: user._id,
    });

    return quizId;
  },
});

/**
 * Update an existing quiz
 */
export const updateQuiz = mutation({
  args: {
    quizId: v.id('quizzes'),
    title: v.string(),
    description: v.string(),
    lessonId: v.optional(v.id('lessons')),
    passingScore: v.number(),
    ageGroups: v.array(v.string()),
    scope: v.union(v.literal('national'), v.literal('cluster'), v.literal('cdej')),
    clusterId: v.optional(v.id('clusters')),
    cdejId: v.optional(v.id('cdejs')),
    validFrom: v.optional(v.number()),
    validUntil: v.optional(v.number()),
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

    // Verify quiz exists
    const quiz = await ctx.db.get(args.quizId);
    if (!quiz) {
      throw new Error('Quiz not found');
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
    if (quiz.createdBy !== user._id && 
        userAssignment.role !== 'national_admin' && 
        userAssignment.role !== 'cluster_admin') {
      throw new Error('You do not have permission to edit this quiz');
    }

    // Validate scope-specific rules
    if (args.scope === 'national') {
      if (userAssignment.role !== 'national_admin') {
        throw new Error('Only national admins can create national quizzes');
      }
    } else if (args.scope === 'cluster') {
      if (userAssignment.role !== 'cluster_admin' && userAssignment.role !== 'national_admin') {
        throw new Error('Only cluster or national admins can create cluster quizzes');
      }
      if (!args.clusterId) {
        throw new Error('clusterId is required for cluster scope');
      }
      if (userAssignment.role === 'cluster_admin' && userAssignment.clusterId !== args.clusterId) {
        throw new Error('You can only create quizzes for your assigned cluster');
      }
    } else if (args.scope === 'cdej') {
      if (
        userAssignment.role !== 'cdej_admin' &&
        userAssignment.role !== 'cluster_admin' &&
        userAssignment.role !== 'national_admin'
      ) {
        throw new Error('Only CDEJ, cluster, or national admins can create CDEJ quizzes');
      }
      if (!args.cdejId) {
        throw new Error('cdejId is required for cdej scope');
      }
      if (userAssignment.role === 'cdej_admin' && userAssignment.cdejId !== args.cdejId) {
        throw new Error('You can only create quizzes for your assigned CDEJ');
      }
    }

    // Validate passing score
    if (args.passingScore < 0 || args.passingScore > 100) {
      throw new Error('Passing score must be between 0 and 100');
    }

    // Validate age groups
    if (args.ageGroups.length === 0) {
      throw new Error('At least one age group must be selected');
    }

    // Validate validity period
    if (args.validFrom !== undefined && args.validUntil !== undefined) {
      if (args.validFrom >= args.validUntil) {
        throw new Error('Valid from date must be before valid until date');
      }
    }

    // Update the quiz
    await ctx.db.patch(args.quizId, {
      title: args.title,
      description: args.description,
      lessonId: args.lessonId,
      passingScore: args.passingScore,
      ageGroups: args.ageGroups,
      scope: args.scope,
      clusterId: args.clusterId,
      cdejId: args.cdejId,
      validFrom: args.validFrom,
      validUntil: args.validUntil,
      isPublished: args.isPublished,
      updatedAt: Date.now(),
      updatedBy: user._id,
    });

    return null;
  },
});

/**
 * Add a question to a quiz
 */
export const addQuestion = mutation({
  args: {
    quizId: v.id('quizzes'),
    questionText: v.string(),
    answers: v.array(
      v.object({
        text: v.string(),
        isCorrect: v.boolean(),
      })
    ),
    points: v.number(),
  },
  returns: v.id('questions'),
  handler: async (ctx, args) => {
    // Get current user
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Not authenticated');
    }

    // Verify quiz exists
    const quiz = await ctx.db.get(args.quizId);
    if (!quiz) {
      throw new Error('Quiz not found');
    }

    // Validate at least one correct answer
    const hasCorrectAnswer = args.answers.some((answer) => answer.isCorrect);
    if (!hasCorrectAnswer) {
      throw new Error('At least one answer must be marked as correct');
    }

    // Validate minimum 2 answers
    if (args.answers.length < 2) {
      throw new Error('Question must have at least 2 answers');
    }

    // Get the next order number
    const existingQuestions = await ctx.db
      .query('questions')
      .withIndex('by_quiz', (q) => q.eq('quizId', args.quizId))
      .collect();
    const order = existingQuestions.length;

    // Create the question
    const questionId: Id<'questions'> = await ctx.db.insert('questions', {
      quizId: args.quizId,
      questionText: args.questionText,
      answers: args.answers,
      points: args.points,
      order,
      createdAt: Date.now(),
    });

    return questionId;
  },
});

/**
 * Update a question
 */
export const updateQuestion = mutation({
  args: {
    questionId: v.id('questions'),
    questionText: v.string(),
    answers: v.array(
      v.object({
        text: v.string(),
        isCorrect: v.boolean(),
      })
    ),
    points: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Get current user
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Not authenticated');
    }

    // Verify question exists
    const question = await ctx.db.get(args.questionId);
    if (!question) {
      throw new Error('Question not found');
    }

    // Validate at least one correct answer
    const hasCorrectAnswer = args.answers.some((answer) => answer.isCorrect);
    if (!hasCorrectAnswer) {
      throw new Error('At least one answer must be marked as correct');
    }

    // Validate minimum 2 answers
    if (args.answers.length < 2) {
      throw new Error('Question must have at least 2 answers');
    }

    // Update the question
    await ctx.db.patch(args.questionId, {
      questionText: args.questionText,
      answers: args.answers,
      points: args.points,
    });

    return null;
  },
});

/**
 * Delete a question
 */
export const deleteQuestion = mutation({
  args: {
    questionId: v.id('questions'),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Get current user
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Not authenticated');
    }

    // Verify question exists
    const question = await ctx.db.get(args.questionId);
    if (!question) {
      throw new Error('Question not found');
    }

    // Delete the question
    await ctx.db.delete(args.questionId);

    // Reorder remaining questions
    const remainingQuestions = await ctx.db
      .query('questions')
      .withIndex('by_quiz', (q) => q.eq('quizId', question.quizId))
      .collect();

    // Sort by current order
    remainingQuestions.sort((a, b) => a.order - b.order);

    // Update order
    for (let i = 0; i < remainingQuestions.length; i++) {
      await ctx.db.patch(remainingQuestions[i]._id, { order: i });
    }

    return null;
  },
});

/**
 * Get all quizzes visible to the current user
 */
export const getQuizzes = query({
  args: {
    isPublished: v.optional(v.boolean()),
    lessonId: v.optional(v.id('lessons')),
  },
  returns: v.array(
    v.object({
      _id: v.id('quizzes'),
      _creationTime: v.number(),
      title: v.string(),
      description: v.string(),
      lessonId: v.optional(v.id('lessons')),
      passingScore: v.number(),
      ageGroups: v.array(v.string()),
      scope: v.union(v.literal('national'), v.literal('cluster'), v.literal('cdej')),
      clusterId: v.optional(v.id('clusters')),
      cdejId: v.optional(v.id('cdejs')),
      validFrom: v.optional(v.number()),
      validUntil: v.optional(v.number()),
      isPublished: v.boolean(),
      createdAt: v.number(),
      createdBy: v.id('users'),
      updatedAt: v.optional(v.number()),
      updatedBy: v.optional(v.id('users')),
      questionCount: v.number(),
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

    // Collect all quizzes the user can see
    const allQuizzes: Array<any> = [];

    // 1. National quizzes (visible to everyone)
    const nationalQuizzes = await ctx.db
      .query('quizzes')
      .withIndex('by_scope', (q) => q.eq('scope', 'national' as const))
      .collect();
    allQuizzes.push(...nationalQuizzes);

    // 2. Cluster quizzes (if user has cluster access)
    if (userAssignment.clusterId) {
      const clusterQuizzes = await ctx.db
        .query('quizzes')
        .withIndex('by_cluster', (q) => q.eq('clusterId', userAssignment.clusterId))
        .collect();
      allQuizzes.push(...clusterQuizzes);
    }

    // 3. CDEJ quizzes (if user has cdej access)
    if (userAssignment.cdejId) {
      const cdejQuizzes = await ctx.db
        .query('quizzes')
        .withIndex('by_cdej', (q) => q.eq('cdejId', userAssignment.cdejId))
        .collect();
      allQuizzes.push(...cdejQuizzes);
    }

    // Filter by published status if specified
    let filteredQuizzes = allQuizzes;
    if (args.isPublished !== undefined) {
      filteredQuizzes = allQuizzes.filter((quiz) => quiz.isPublished === args.isPublished);
    }

    // Filter by lesson if specified
    if (args.lessonId !== undefined) {
      filteredQuizzes = filteredQuizzes.filter((quiz) => quiz.lessonId === args.lessonId);
    }

    // Add question count to each quiz
    const quizzesWithCount: Array<any> = [];
    for (const quiz of filteredQuizzes) {
      const questions = await ctx.db
        .query('questions')
        .withIndex('by_quiz', (q) => q.eq('quizId', quiz._id))
        .collect();
      quizzesWithCount.push({
        ...quiz,
        questionCount: questions.length,
      });
    }

    // Sort by creation time (most recent first)
    quizzesWithCount.sort((a, b) => b.createdAt - a.createdAt);

    return quizzesWithCount;
  },
});

/**
 * Get a single quiz by ID
 */
export const getQuiz = query({
  args: {
    quizId: v.id('quizzes'),
  },
  returns: v.union(
    v.object({
      _id: v.id('quizzes'),
      _creationTime: v.number(),
      title: v.string(),
      description: v.string(),
      lessonId: v.optional(v.id('lessons')),
      passingScore: v.number(),
      ageGroups: v.array(v.string()),
      scope: v.union(v.literal('national'), v.literal('cluster'), v.literal('cdej')),
      clusterId: v.optional(v.id('clusters')),
      cdejId: v.optional(v.id('cdejs')),
      validFrom: v.optional(v.number()),
      validUntil: v.optional(v.number()),
      isPublished: v.boolean(),
      createdAt: v.number(),
      createdBy: v.id('users'),
      updatedAt: v.optional(v.number()),
      updatedBy: v.optional(v.id('users')),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const quiz = await ctx.db.get(args.quizId);
    return quiz;
  },
});

/**
 * Get questions for a quiz
 */
export const getQuestions = query({
  args: {
    quizId: v.id('quizzes'),
  },
  returns: v.array(
    v.object({
      _id: v.id('questions'),
      _creationTime: v.number(),
      quizId: v.id('quizzes'),
      questionText: v.string(),
      answers: v.array(
        v.object({
          text: v.string(),
          isCorrect: v.boolean(),
        })
      ),
      points: v.number(),
      order: v.number(),
      createdAt: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    const questions = await ctx.db
      .query('questions')
      .withIndex('by_quiz', (q) => q.eq('quizId', args.quizId))
      .collect();

    // Sort by order
    questions.sort((a, b) => a.order - b.order);

    return questions;
  },
});

/**
 * Get questions for a quiz (without showing correct answers - for taking the quiz)
 */
export const getQuestionsForAttempt = query({
  args: {
    quizId: v.id('quizzes'),
  },
  returns: v.array(
    v.object({
      _id: v.id('questions'),
      questionText: v.string(),
      answers: v.array(
        v.object({
          text: v.string(),
        })
      ),
      points: v.number(),
      order: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    const questions = await ctx.db
      .query('questions')
      .withIndex('by_quiz', (q) => q.eq('quizId', args.quizId))
      .collect();

    // Sort by order
    questions.sort((a, b) => a.order - b.order);

    // Remove correct answer information
    const questionsForAttempt: Array<any> = questions.map((q) => ({
      _id: q._id,
      questionText: q.questionText,
      answers: q.answers.map((a) => ({ text: a.text })),
      points: q.points,
      order: q.order,
    }));

    return questionsForAttempt;
  },
});

/**
 * Submit a quiz attempt
 */
export const submitQuizAttempt = mutation({
  args: {
    quizId: v.id('quizzes'),
    answers: v.array(
      v.object({
        questionId: v.id('questions'),
        selectedAnswerIndex: v.number(),
      })
    ),
    startedAt: v.number(),
  },
  returns: v.object({
    attemptId: v.id('quizAttempts'),
    score: v.number(),
    maxScore: v.number(),
    percentage: v.number(),
    passed: v.boolean(),
  }),
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

    // Verify quiz exists
    const quiz = await ctx.db.get(args.quizId);
    if (!quiz) {
      throw new Error('Quiz not found');
    }

    // Get all questions for the quiz
    const questions = await ctx.db
      .query('questions')
      .withIndex('by_quiz', (q) => q.eq('quizId', args.quizId))
      .collect();

    // Calculate score
    let totalScore = 0;
    let maxScore = 0;
    const gradedAnswers: Array<any> = [];

    for (const answer of args.answers) {
      const question = questions.find((q) => q._id === answer.questionId);
      if (!question) {
        throw new Error(`Question ${answer.questionId} not found`);
      }

      maxScore += question.points;

      const selectedAnswer = question.answers[answer.selectedAnswerIndex];
      if (!selectedAnswer) {
        throw new Error(`Invalid answer index for question ${answer.questionId}`);
      }

      const isCorrect = selectedAnswer.isCorrect;
      const pointsEarned = isCorrect ? question.points : 0;
      totalScore += pointsEarned;

      gradedAnswers.push({
        questionId: answer.questionId,
        selectedAnswerIndex: answer.selectedAnswerIndex,
        isCorrect,
        pointsEarned,
      });
    }

    // Calculate percentage
    const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
    const passed = percentage >= quiz.passingScore;

    // Create quiz attempt
    const attemptId: Id<'quizAttempts'> = await ctx.db.insert('quizAttempts', {
      quizId: args.quizId,
      userId: user._id,
      score: totalScore,
      maxScore,
      percentage,
      passed,
      answers: gradedAnswers,
      startedAt: args.startedAt,
      completedAt: Date.now(),
    });

    return {
      attemptId,
      score: totalScore,
      maxScore,
      percentage,
      passed,
    };
  },
});

/**
 * Get quiz attempts for a user
 */
export const getMyAttempts = query({
  args: {
    quizId: v.optional(v.id('quizzes')),
  },
  returns: v.array(
    v.object({
      _id: v.id('quizAttempts'),
      _creationTime: v.number(),
      quizId: v.id('quizzes'),
      quizTitle: v.string(),
      quizCreatedBy: v.id('users'), // Creator ID to identify test attempts
      score: v.number(),
      maxScore: v.number(),
      percentage: v.number(),
      passed: v.boolean(),
      startedAt: v.number(),
      completedAt: v.number(),
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

    // Get attempts
    let attemptsQuery = ctx.db.query('quizAttempts').withIndex('by_user', (q) => q.eq('userId', user._id));

    const attempts = await attemptsQuery.collect();

    // Filter by quiz if specified
    let filteredAttempts = attempts;
    if (args.quizId !== undefined) {
      filteredAttempts = attempts.filter((attempt) => attempt.quizId === args.quizId);
    }

    // Add quiz title and creator info to each attempt
    const attemptsWithQuizInfo: Array<any> = [];
    for (const attempt of filteredAttempts) {
      const quiz = await ctx.db.get(attempt.quizId);
      if (quiz) {
        attemptsWithQuizInfo.push({
          _id: attempt._id,
          _creationTime: attempt._creationTime,
          quizId: attempt.quizId,
          quizTitle: quiz.title,
          quizCreatedBy: quiz.createdBy, // Include creator to filter out test attempts
          score: attempt.score,
          maxScore: attempt.maxScore,
          percentage: attempt.percentage,
          passed: attempt.passed,
          startedAt: attempt.startedAt,
          completedAt: attempt.completedAt,
        });
      }
    }

    // Sort by completion time (most recent first)
    attemptsWithQuizInfo.sort((a, b) => b.completedAt - a.completedAt);

    return attemptsWithQuizInfo;
  },
});

/**
 * Get a specific quiz attempt with detailed results
 */
export const getAttemptDetails = query({
  args: {
    attemptId: v.id('quizAttempts'),
  },
  returns: v.union(
    v.object({
      _id: v.id('quizAttempts'),
      _creationTime: v.number(),
      quizId: v.id('quizzes'),
      quizTitle: v.string(),
      score: v.number(),
      maxScore: v.number(),
      percentage: v.number(),
      passed: v.boolean(),
      answers: v.array(
        v.object({
          questionId: v.id('questions'),
          questionText: v.string(),
          selectedAnswerIndex: v.number(),
          selectedAnswerText: v.string(),
          isCorrect: v.boolean(),
          pointsEarned: v.number(),
          correctAnswers: v.array(v.string()),
        })
      ),
      startedAt: v.number(),
      completedAt: v.number(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    // Get attempt
    const attempt = await ctx.db.get(args.attemptId);
    if (!attempt) {
      return null;
    }

    // Get quiz
    const quiz = await ctx.db.get(attempt.quizId);
    if (!quiz) {
      return null;
    }

    // Get questions and enrich answers
    const enrichedAnswers: Array<any> = [];
    for (const answer of attempt.answers) {
      const question = await ctx.db.get(answer.questionId);
      if (question) {
        const selectedAnswer = question.answers[answer.selectedAnswerIndex];
        const correctAnswers = question.answers.filter((a) => a.isCorrect).map((a) => a.text);

        enrichedAnswers.push({
          questionId: answer.questionId,
          questionText: question.questionText,
          selectedAnswerIndex: answer.selectedAnswerIndex,
          selectedAnswerText: selectedAnswer?.text || '',
          isCorrect: answer.isCorrect,
          pointsEarned: answer.pointsEarned,
          correctAnswers,
        });
      }
    }

    return {
      _id: attempt._id,
      _creationTime: attempt._creationTime,
      quizId: attempt.quizId,
      quizTitle: quiz.title,
      score: attempt.score,
      maxScore: attempt.maxScore,
      percentage: attempt.percentage,
      passed: attempt.passed,
      answers: enrichedAnswers,
      startedAt: attempt.startedAt,
      completedAt: attempt.completedAt,
    };
  },
});

/**
 * Get quiz statistics for admins
 */
export const getQuizStatistics = query({
  args: {
    quizId: v.id('quizzes'),
  },
  returns: v.object({
    totalAttempts: v.number(),
    uniqueUsers: v.number(),
    averageScore: v.number(),
    passRate: v.number(),
    averageTimeSpent: v.number(), // in milliseconds
  }),
  handler: async (ctx, args) => {
    // Get all attempts for this quiz
    const attempts = await ctx.db
      .query('quizAttempts')
      .withIndex('by_quiz', (q) => q.eq('quizId', args.quizId))
      .collect();

    if (attempts.length === 0) {
      return {
        totalAttempts: 0,
        uniqueUsers: 0,
        averageScore: 0,
        passRate: 0,
        averageTimeSpent: 0,
      };
    }

    // Calculate statistics
    const totalAttempts = attempts.length;
    const uniqueUsers = new Set(attempts.map((a) => a.userId)).size;
    const totalPercentage = attempts.reduce((sum, a) => sum + a.percentage, 0);
    const averageScore = totalPercentage / totalAttempts;
    const passedAttempts = attempts.filter((a) => a.passed).length;
    const passRate = (passedAttempts / totalAttempts) * 100;
    const totalTimeSpent = attempts.reduce((sum, a) => sum + (a.completedAt - a.startedAt), 0);
    const averageTimeSpent = totalTimeSpent / totalAttempts;

    return {
      totalAttempts,
      uniqueUsers,
      averageScore,
      passRate,
      averageTimeSpent,
    };
  },
});

/**
 * Migration: Add ageGroups to all existing quizzes that don't have it
 * This adds all age groups ["0-5", "6-10", "11-15", "16-18", "19+"] to quizzes missing this field
 * Can be removed after running once
 */
export const migrateAddAgeGroupsToQuizzes = mutation({
  args: {},
  returns: v.object({
    updated: v.number(),
    skipped: v.number(),
  }),
  handler: async (ctx) => {
    // Temporarily allow running without auth for one-time migration
    // TODO: Remove this migration function after running it successfully
    
    // Get all quizzes
    const allQuizzes = await ctx.db.query('quizzes').collect();
    
    const allAgeGroups = ["0-5", "6-10", "11-15", "16-18", "19+"];
    let updated = 0;
    let skipped = 0;

    for (const quiz of allQuizzes) {
      // Check if quiz has ageGroups field (it might be undefined or missing)
      if (!quiz.ageGroups || quiz.ageGroups.length === 0) {
        await ctx.db.patch(quiz._id, {
          ageGroups: allAgeGroups,
        });
        updated++;
      } else {
        skipped++;
      }
    }

    return { updated, skipped };
  },
});

