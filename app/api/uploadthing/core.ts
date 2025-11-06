import { createUploadthing, type FileRouter } from 'uploadthing/next';
import { withAuth } from '@workos-inc/authkit-nextjs';

const f = createUploadthing();

// FileRouter for your app, can contain multiple FileRoutes
export const ourFileRouter = {
  // Define as many FileRoutes as you like, each with a unique routeSlug
  lessonImage: f({ image: { maxFileSize: '4MB', maxFileCount: 1 } })
    .middleware(async ({ req }) => {
      // Check authentication
      const { user } = await withAuth();
      if (!user) throw new Error('Unauthorized');

      // Return metadata that will be accessible in onUploadComplete
      return { userId: user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // This code RUNS ON YOUR SERVER after upload
      console.log('Upload complete for userId:', metadata.userId);
      console.log('file url', file.url);

      // Return data to the client
      return { url: file.url };
    }),

  lessonVideo: f({ video: { maxFileSize: '32MB', maxFileCount: 1 } })
    .middleware(async ({ req }) => {
      // Check authentication
      const { user } = await withAuth();
      if (!user) throw new Error('Unauthorized');

      return { userId: user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log('Upload complete for userId:', metadata.userId);
      console.log('file url', file.url);

      return { url: file.url };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;

