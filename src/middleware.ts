import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // For the first implementation, we're just checking for a token
  // In a production app, you should validate the token on the server
  const token = request.cookies.get("token")?.value || 
                request.headers.get("Authorization")?.split("Bearer ")[1];

  // If no token is found and the route should be protected, redirect to sign-in
  if (!token && request.nextUrl.pathname.startsWith("/workspace")) {
    // Store the original URL to redirect back after login
    const redirectUrl = new URL("/auth/sign-in", request.url);
    redirectUrl.searchParams.set("callbackUrl", request.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.next();
}

// Only run middleware on matching routes
export const config = {
  matcher: [
    "/workspace/:path*",
  ],
}; 