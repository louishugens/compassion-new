"use node";

import { action, internalAction } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";
import { embed } from "ai";
import { gateway } from "@ai-sdk/gateway";

/**
 * Strip HTML tags and extract plain text
 */
function stripHtml(html: string): string {
  // Remove HTML tags
  let text = html.replace(/<[^>]*>/g, "");
  // Decode HTML entities
  text = text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
  // Clean up whitespace
  text = text.replace(/\s+/g, " ").trim();
  return text;
}

/**
 * Chunk text into smaller pieces for embedding
 */
function chunkText(text: string, chunkSize: number = 500, overlap: number = 50): string[] {
  const words = text.split(/\s+/);
  const chunks: string[] = [];
  
  for (let i = 0; i < words.length; i += chunkSize - overlap) {
    const chunk = words.slice(i, i + chunkSize).join(" ");
    if (chunk.trim().length > 0) {
      chunks.push(chunk.trim());
    }
  }
  
  return chunks;
}

/**
 * Get embedding using AI Gateway
 */
async function getEmbedding(text: string): Promise<number[]> {
  const gatewayApiKey = process.env.AI_GATEWAY_API_KEY;

  if (!gatewayApiKey) {
    throw new Error("AI_GATEWAY_API_KEY environment variable is not set");
  }

  // Get embedding using AI SDK with gateway
  // Gateway automatically reads AI_GATEWAY_URL and AI_GATEWAY_API_KEY from environment
  const result = await embed({
    model: gateway.textEmbeddingModel("openai/text-embedding-3-small"),
    value: text,
  });

  return result.embedding;
}

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) {
    throw new Error("Vectors must have the same length");
  }
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Vectorize a lesson's content
 */
export const vectorizeLesson = internalAction({
  args: {
    lessonId: v.id("lessons"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Get the lesson
    const lesson = await ctx.runQuery(internal.lessonRag.getLessonForVectorization, {
      lessonId: args.lessonId,
    });

    if (!lesson) {
      throw new Error("Lesson not found");
    }

    // Combine title, description, and content
    const fullText = `${lesson.title}\n\n${lesson.description}\n\n${lesson.content}`;
    
    // Strip HTML and get plain text
    const plainText = stripHtml(fullText);
    
    // Chunk the text for RAG embeddings
    // Recommended: 256-512 tokens (~200-400 words) for document search/RAG
    // For chatbot use case, smaller chunks (200-300 words) provide better granularity
    // Overlap: 10-20% of chunk size (20-40 words) preserves context across boundaries
    // Using 250 words with 25 word overlap (10%) - optimal for chatbot RAG
    const chunks = chunkText(plainText, 250, 25);

    // Delete existing chunks for this lesson
    await ctx.runMutation(internal.lessonRag.deleteLessonChunks, {
      lessonId: args.lessonId,
    });

    // Vectorize and store each chunk
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const embedding = await getEmbedding(chunk);
      
      await ctx.runMutation(internal.lessonRag.insertChunk, {
        lessonId: args.lessonId,
        chunkIndex: i,
        text: chunk,
        embedding,
      });
    }

    return null;
  },
});

/**
 * Search for relevant chunks using vector similarity
 * Public action for API route access
 */
export const searchLessonChunks = action({
  args: {
    lessonId: v.id("lessons"),
    queryText: v.string(),
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      text: v.string(),
      chunkIndex: v.number(),
      score: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    // Get embedding for query
    const queryEmbedding = await getEmbedding(args.queryText);
    
    // Get all chunks for this lesson
    const chunks: Array<{ text: string; chunkIndex: number; embedding: number[] }> = await ctx.runQuery(internal.lessonRag.getLessonChunks, {
      lessonId: args.lessonId,
    });

    // Calculate cosine similarity for each chunk
    const scoredResults: Array<{ text: string; chunkIndex: number; score: number }> = chunks.map((chunk) => {
      const score = cosineSimilarity(queryEmbedding, chunk.embedding);
      return {
        text: chunk.text,
        chunkIndex: chunk.chunkIndex,
        score,
      };
    });

    // Sort by score descending and take top N
    scoredResults.sort((a, b) => b.score - a.score);
    return scoredResults.slice(0, args.limit ?? 5);
  },
});

/**
 * Get lesson title (public action for API route)
 */
export const getLessonTitle = action({
  args: {
    lessonId: v.id("lessons"),
  },
  returns: v.union(
    v.object({
      title: v.string(),
    }),
    v.null()
  ),
  handler: async (ctx, args): Promise<{ title: string } | null> => {
    const lesson: { title: string } | null = await ctx.runQuery(internal.lessonRag.getLessonTitleQuery, {
      lessonId: args.lessonId,
    });
    return lesson;
  },
});

/**
 * Vectorize all existing lessons
 * Public action that can be called to process all lessons
 */
export const vectorizeAllLessons = action({
  args: {},
  returns: v.object({
    processed: v.number(),
    errors: v.array(v.string()),
  }),
  handler: async (ctx) => {
    // Get all lesson IDs
    const lessons = await ctx.runQuery(internal.lessonRag.getAllLessonsQuery);
    const lessonIds = lessons.map((lesson) => lesson._id);
    
    let processed = 0;
    const errors: string[] = [];

    // Process each lesson
    for (const lessonId of lessonIds) {
      try {
        await ctx.runAction(internal.lessonRagActions.vectorizeLesson, {
          lessonId,
        });
        processed++;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        errors.push(`Lesson ${lessonId}: ${errorMessage}`);
      }
    }

    return {
      processed,
      errors,
    };
  },
});

