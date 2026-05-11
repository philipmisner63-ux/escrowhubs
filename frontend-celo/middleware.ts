import { NextResponse, type NextRequest } from "next/server";

export default function middleware(request: NextRequest) {
  const response = NextResponse.next();
  response.headers.set(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, max-age=0"
  );
  return response;
}

export const config = {
  matcher: [
    // Match all pathnames except static files and API routes
    "/((?!_next|_vercel|api|favicon\\.ico|robots\\.txt|sitemap\\.xml|.*\\..*).*)",
  ],
};
