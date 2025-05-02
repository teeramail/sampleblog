// Placeholder middleware to help with type inference
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Allow all requests to proceed
  return NextResponse.next();
}

// Configure which routes this middleware will run on
export const config = {
  // Apply this middleware to admin routes and API routes
  matcher: [
    '/admin/:path*',
    '/api/:path*',
  ],
};