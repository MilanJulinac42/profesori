import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { exchangeCodeForTokens, getUserEmail } from "@/lib/google/oauth";

const STATE_COOKIE = "google_oauth_state";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const url = request.nextUrl;
  const code = url.searchParams.get("code");
  const stateParam = url.searchParams.get("state");
  const errorParam = url.searchParams.get("error");

  // User je odbio na Google strani
  if (errorParam) {
    return NextResponse.redirect(
      new URL(`/settings?google_error=${encodeURIComponent(errorParam)}`, request.url),
    );
  }

  const stateCookie = request.cookies.get(STATE_COOKIE)?.value;
  if (!code || !stateParam || !stateCookie || stateParam !== stateCookie) {
    return NextResponse.redirect(
      new URL("/settings?google_error=invalid_state", request.url),
    );
  }

  // Pull profile
  const { data: profile } = await supabase
    .from("users")
    .select("organization_id")
    .eq("id", user.id)
    .single();
  if (!profile) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    const tokens = await exchangeCodeForTokens(code);
    if (!tokens.access_token || !tokens.refresh_token) {
      return NextResponse.redirect(
        new URL("/settings?google_error=no_refresh_token", request.url),
      );
    }

    const expiresAt = tokens.expiry_date
      ? new Date(tokens.expiry_date)
      : new Date(Date.now() + 3500 * 1000);

    let email: string | null = null;
    if (tokens.id_token) {
      email = await getUserEmail(tokens.id_token);
    }

    // Upsert konekciju
    const { error: upsertError } = await supabase
      .from("google_connections")
      .upsert(
        {
          user_id: user.id,
          organization_id: profile.organization_id,
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          expires_at: expiresAt.toISOString(),
          scope: tokens.scope ?? "",
          google_email: email,
          calendar_id: "primary",
        },
        { onConflict: "user_id" },
      );

    if (upsertError) {
      return NextResponse.redirect(
        new URL(
          `/settings?google_error=${encodeURIComponent(upsertError.message)}`,
          request.url,
        ),
      );
    }

    const response = NextResponse.redirect(
      new URL("/settings?google_connected=1", request.url),
    );
    response.cookies.delete(STATE_COOKIE);
    return response;
  } catch (err) {
    const msg = err instanceof Error ? err.message : "exchange_failed";
    return NextResponse.redirect(
      new URL(`/settings?google_error=${encodeURIComponent(msg)}`, request.url),
    );
  }
}
