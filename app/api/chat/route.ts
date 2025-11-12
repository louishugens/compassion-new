import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { streamText, UIMessage, convertToModelMessages } from "ai";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { messages, lessonId }: { messages: UIMessage[]; lessonId: Id<"lessons"> } = body;

    console.log("Chat API called with:", { lessonId, messageCount: messages?.length });

    if (!lessonId) {
      console.error("Missing lessonId");
      return new Response("lessonId is required", { status: 400 });
    }

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      console.error("Invalid messages array");
      return new Response("messages array is required", { status: 400 });
    }

    // Get Convex client
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!convexUrl) {
      return new Response("Convex URL not configured", { status: 500 });
    }

    const convex = new ConvexHttpClient(convexUrl);
    
    // Get the last user message for RAG search
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || lastMessage.role !== "user") {
      return new Response("Last message must be from user", { status: 400 });
    }

    // Extract text content from UIMessage parts
    let queryText: string = "";
    if (lastMessage.parts && Array.isArray(lastMessage.parts)) {
      const textPart = lastMessage.parts.find((part: any) => part.type === "text");
      if (textPart && "text" in textPart) {
        queryText = textPart.text;
      }
    }

    if (!queryText || !queryText.trim()) {
      return new Response("Message content is required", { status: 400 });
    }

    console.log("Query text extracted:", queryText);

    // Search for relevant chunks using RAG
    const relevantChunks = await convex.action(api.lessonRagActions.searchLessonChunks, {
      lessonId: lessonId as Id<"lessons">,
      queryText: queryText.trim(),
      limit: 5,
    });

    console.log("Found chunks:", relevantChunks.length);

    // Build context from relevant chunks
    const context = relevantChunks
      .map((chunk: { text: string; chunkIndex: number; score: number }) => chunk.text)
      .join("\n\n");

    // Get lesson title for context - use public action
    const lesson = await convex.action(api.lessonRagActions.getLessonTitle, {
      lessonId: lessonId as Id<"lessons">,
    });

    if (!lesson) {
      return new Response("Lesson not found", { status: 404 });
    }

    // Create system message with context
    const systemMessage = `You are a helpful assistant helping beneficiaries understand lessons. 
You are currently helping with the lesson: "${lesson.title}"

Use the following context from the lesson to answer questions:
${context}

Answer questions in a clear, simple, and helpful way. If the answer isn't in the context, say so politely.
Always identify and respond in the same language as the question. Also reason in the same language as the question.`;

    console.log("Preparing to stream response with", messages.length, "messages");

    // Stream response using model that supports reasoning
    // For reasoning to work, use a model like "deepseek/deepseek-r1" or "openai/o1"
    // convertToModelMessages handles the conversion from UIMessage to model messages
    const result = streamText({
      model: "openai/gpt-5-nano",
      messages: convertToModelMessages(messages),
      system: systemMessage,
    });

    console.log("StreamText result created, returning response");
    return result.toUIMessageStreamResponse({
      sendSources: false,
      sendReasoning: false,
    });
  } catch (error) {
    console.error("Chat API error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error("Error details:", { errorMessage, errorStack });
    return new Response(
      JSON.stringify({ 
        error: "Internal server error",
        message: errorMessage,
        ...(process.env.NODE_ENV === "development" && { stack: errorStack })
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

