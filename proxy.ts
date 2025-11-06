import { authkitMiddleware } from '@workos-inc/authkit-nextjs';
import { NextRequest, NextResponse } from 'next/server';

const authMiddleware = authkitMiddleware({
  eagerAuth: true,
  middlewareAuth: {
    enabled: true,
    unauthenticatedPaths: ['/', '/sign-in', '/sign-up', '/callback', '/api/uploadthing'],
  },
});

export default async function middleware(request: NextRequest, event: any) {
  const { pathname } = request.nextUrl;
  
  // Check if the user is trying to access public auth pages
  const isPublicAuthPage = pathname === '/' || pathname === '/sign-in' || pathname === '/sign-up';
  
  // If accessing public auth pages, check if user has auth session cookie
  if (isPublicAuthPage) {
    const hasAuthCookie = request.cookies.has('wos-session');
    
    // If user has auth session, redirect to /user
    if (hasAuthCookie) {
      const url = request.nextUrl.clone();
      url.pathname = '/user';
      return NextResponse.redirect(url);
    }
  }
  
  // Run the authkit middleware
  return authMiddleware(request, event);
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
