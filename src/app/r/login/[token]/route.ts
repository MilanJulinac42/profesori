import { NextResponse, type NextRequest } from "next/server";
import { getParentSessionByToken } from "@/lib/parent-portal/auth";

const COOKIE_NAME = "profesori_parent_token";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 godina

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ token: string }> },
) {
  const { token } = await context.params;
  const session = await getParentSessionByToken(token);

  const baseUrl = request.nextUrl.origin;

  if (!session) {
    return NextResponse.redirect(new URL("/r/expired", baseUrl));
  }

  const response = NextResponse.redirect(new URL("/r", baseUrl));
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });
  return response;
}
