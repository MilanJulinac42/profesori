import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Routes that never read Supabase auth — skip session refresh entirely.
// Saves a Supabase Auth roundtrip (~50-200ms) on every public-route hit.
function isPublicRoute(pathname: string): boolean {
  return (
    pathname.startsWith("/p/") ||
    pathname.startsWith("/h/") ||
    pathname === "/r" ||
    pathname.startsWith("/r/") ||
    pathname.startsWith("/api/google/") ||
    pathname.startsWith("/api/cron/")
  );
}

export default async function proxy(request: NextRequest) {
  if (isPublicRoute(request.nextUrl.pathname)) {
    return NextResponse.next();
  }
  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
