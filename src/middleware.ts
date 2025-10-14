import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    // Add custom middleware logic here if needed
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // All authenticated users can access protected routes
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    '/((?!api/auth|login|register|_next/static|_next/image|favicon.ico).*)',
  ],
};