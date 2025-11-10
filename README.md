# Welcome to your Convex + Next.js + WorkOS AuthKit app

This is a [Convex](https://convex.dev/) project migrated to use WorkOS AuthKit for authentication.

After the initial setup (<2 minutes) you'll have a working full-stack app using:

- Convex as your backend (database, server logic)
- [React](https://react.dev/) as your frontend (web page interactivity)
- [Next.js](https://nextjs.org/) for optimized web hosting and page routing
- [Tailwind](https://tailwindcss.com/) for building great looking accessible UI
- [WorkOS AuthKit](https://authkit.com/) for authentication

## Get started

1. Clone this repository and install dependencies:

   ```bash
   npm install
   ```

2. Set up your environment variables:
   ```bash
   cp .env.local.example .env.local
   ```
   
   Then fill in the required values:
   - WorkOS credentials (see step 3)
   - Convex URL (will be added in step 4)
   - UploadThing credentials (get from [uploadthing.com](https://uploadthing.com/dashboard))
   
   For production deployments on Vercel, you'll also need to set:
   - `WORKOS_REDIRECT_URI` - Set this in your Vercel project settings to `https://your-vercel-site.vercel.app/callback`

3. Configure WorkOS AuthKit:
   - Create a [WorkOS account](https://workos.com/)
   - Get your Client ID and API Key from the WorkOS dashboard
   - In the WorkOS dashboard, add redirect URIs:
     - Development: `http://localhost:3000/callback`
     - Production: `https://your-vercel-site.vercel.app/callback`
   - Generate a secure password for cookie encryption (minimum 32 characters)
   - Update your `.env.local` file with these values

4. Configure Convex:

   ```bash
   npx convex dev
   ```

   This will:
   - Set up your Convex deployment
   - Add your Convex URL to `.env.local`
   - Open the Convex dashboard

   Then configure WorkOS authentication in Convex:

   ```bash
   npx convex auth add workos
   ```

   This creates `convex/auth.config.ts` with WorkOS integration

5. Run the development server:

   ```bash
   npm run dev
   ```

   This starts both the Next.js frontend and Convex backend in parallel

6. Open [http://localhost:3000](http://localhost:3000) to see your app

## WorkOS AuthKit Setup

This app uses WorkOS AuthKit for authentication. Key features:

- **Redirect-based authentication**: Users are redirected to WorkOS for sign-in/sign-up
- **Session management**: Automatic token refresh and session handling
- **Middleware protection**: Routes are protected using Next.js middleware
- **Client and server hooks**: `useAuth()` for client components, `withAuth()` for server components

## Deploying to Vercel

When deploying to Vercel, you need to configure the WorkOS redirect URI:

1. Deploy your app to Vercel
2. In your Vercel project settings, go to Environment Variables
3. Add the following environment variables:
   - `WORKOS_CLIENT_ID` - Your WorkOS Client ID
   - `WORKOS_API_KEY` - Your WorkOS API Key
   - `WORKOS_COOKIE_PASSWORD` - Your secure cookie encryption password (32+ characters)
   - `WORKOS_REDIRECT_URI` - Set to `https://${VERCEL_URL}/callback` or your custom domain callback URL
   - `NEXT_PUBLIC_CONVEX_URL` - Your Convex deployment URL
   - `UPLOADTHING_TOKEN` - Your UploadThing token
4. In the WorkOS dashboard, add your production redirect URI:
   - `https://your-vercel-site.vercel.app/callback` (or your custom domain)
5. Redeploy your app

Note: Vercel automatically provides the `VERCEL_URL` environment variable with your deployment URL.

## Learn more

To learn more about developing your project with Convex, check out:

- The [Tour of Convex](https://docs.convex.dev/get-started) for a thorough introduction to Convex principles.
- The rest of [Convex docs](https://docs.convex.dev/) to learn about all Convex features.
- [Stack](https://stack.convex.dev/) for in-depth articles on advanced topics.

## Join the community

Join thousands of developers building full-stack apps with Convex:

- Join the [Convex Discord community](https://convex.dev/community) to get help in real-time.
- Follow [Convex on GitHub](https://github.com/get-convex/), star and contribute to the open-source implementation of Convex.
