import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Check if accessing dashboard routes
  if (request.nextUrl.pathname.startsWith("/dashboard")) {
    // In a real app, verify the token here
    // For mock auth, authentication is handled on the client side
    // This middleware just ensures the route exists
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
