/**
 * Script to vectorize all existing lessons
 * 
 * Usage:
 *   bun scripts/vectorize-lessons.ts
 * 
 * Or with tsx:
 *   npx tsx scripts/vectorize-lessons.ts
 * 
 * Make sure NEXT_PUBLIC_CONVEX_URL is set in your environment
 */

import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";

async function main() {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  
  if (!convexUrl) {
    console.error("Error: NEXT_PUBLIC_CONVEX_URL environment variable is not set");
    process.exit(1);
  }

  const convex = new ConvexHttpClient(convexUrl);

  console.log("Starting to vectorize all lessons...");
  console.log("This may take a while depending on the number of lessons and their content size.\n");

  try {
    const result = await convex.action(api.lessonRagActions.vectorizeAllLessons, {});

    console.log("\n✅ Vectorization complete!");
    console.log(`Processed: ${result.processed} lessons`);
    
    if (result.errors.length > 0) {
      console.log(`\n⚠️  Errors encountered: ${result.errors.length}`);
      result.errors.forEach((error) => {
        console.error(`  - ${error}`);
      });
    } else {
      console.log("\n✨ All lessons processed successfully!");
    }
  } catch (error) {
    console.error("\n❌ Error running vectorization:", error);
    process.exit(1);
  }
}

main();

