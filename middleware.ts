import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware to protect routes that require authentication
 * Runs before every request to check if user is authenticated
 */
export async function middleware(request: NextRequest) {
    // Temporarily allow all routes - auth will be handled client-side
    // This helps us debug the authentication issue
    console.log('Middleware: Allowing access to:', request.nextUrl.pathname);
    return NextResponse.next();
}

/**
 * Configure which routes this middleware runs on
 * Exclude static files, images, and API routes
 */
export const config = {
    matcher: [
        '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
