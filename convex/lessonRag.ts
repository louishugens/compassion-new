import { internalMutation, internalQuery, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

/**
 * Get lesson for vectorization (internal query)
 */
export const getLessonForVectorization = internalQuery({
  args: {
    lessonId: v.id("lessons"),
  },
  returns: v.union(
    v.object({
      title: v.string(),
      description: v.string(),
      content: v.string(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const lesson = await ctx.db.get(args.lessonId);
    if (!lesson) {
      return null;
    }
    return {
      title: lesson.title,
      description: lesson.description,
      content: lesson.content,
    };
  },
});

/**
 * Delete all chunks for a lesson
 */
export const deleteLessonChunks = internalMutation({
  args: {
    lessonId: v.id("lessons"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const chunks = await ctx.db
      .query("lessonChunks")
      .withIndex("by_lesson", (q) => q.eq("lessonId", args.lessonId))
      .collect();
    
    for (const chunk of chunks) {
      await ctx.db.delete(chunk._id);
    }
    
    return null;
  },
});

/**
 * Insert a chunk
 */
export const insertChunk = internalMutation({
  args: {
    lessonId: v.id("lessons"),
    chunkIndex: v.number(),
    text: v.string(),
    embedding: v.array(v.number()),
  },
  returns: v.id("lessonChunks"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("lessonChunks", {
      lessonId: args.lessonId,
      chunkIndex: args.chunkIndex,
      text: args.text,
      embedding: args.embedding,
      createdAt: Date.now(),
    });
  },
});

/**
 * Get all chunks for a lesson (internal query for actions)
 */
export const getLessonChunks = internalQuery({
  args: {
    lessonId: v.id("lessons"),
  },
  returns: v.array(
    v.object({
      text: v.string(),
      chunkIndex: v.number(),
      embedding: v.array(v.number()),
    })
  ),
  handler: async (ctx, args) => {
    const chunks = await ctx.db
      .query("lessonChunks")
      .withIndex("by_lesson", (q) => q.eq("lessonId", args.lessonId))
      .collect();
    
    return chunks.map((chunk) => ({
      text: chunk.text,
      chunkIndex: chunk.chunkIndex,
      embedding: chunk.embedding,
    }));
  },
});

/**
 * Get lesson title query (internal for actions)
 */
export const getLessonTitleQuery = internalQuery({
  args: {
    lessonId: v.id("lessons"),
  },
  returns: v.union(
    v.object({
      title: v.string(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const lesson = await ctx.db.get(args.lessonId);
    if (!lesson) {
      return null;
    }
    return {
      title: lesson.title,
    };
  },
});

/**
 * Get all lessons (internal query for batch processing)
 */
export const getAllLessonsQuery = internalQuery({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("lessons"),
    })
  ),
  handler: async (ctx) => {
    const lessons = await ctx.db.query("lessons").collect();
    return lessons.map((lesson) => ({
      _id: lesson._id,
    }));
  },
});

/**
 * Get chunk statistics for a lesson (for debugging)
 */
export const getChunkStats = query({
  args: {
    lessonId: v.id("lessons"),
  },
  returns: v.object({
    lessonId: v.id("lessons"),
    chunkCount: v.number(),
    chunks: v.array(
      v.object({
        chunkIndex: v.number(),
        textLength: v.number(),
        wordCount: v.number(),
      })
    ),
  }),
  handler: async (ctx, args) => {
    const chunks = await ctx.db
      .query("lessonChunks")
      .withIndex("by_lesson", (q) => q.eq("lessonId", args.lessonId))
      .collect();

    const chunkStats = chunks.map((chunk) => ({
      chunkIndex: chunk.chunkIndex,
      textLength: chunk.text.length,
      wordCount: chunk.text.split(/\s+/).length,
    }));

    return {
      lessonId: args.lessonId,
      chunkCount: chunks.length,
      chunks: chunkStats,
    };
  },
});
