import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { authorizedClient } from "@/lib/google/oauth";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Niste prijavljeni." }, { status: 401 });
  }

  const { data: conn } = await supabase
    .from("google_connections")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!conn) {
    return NextResponse.json({ ok: true });
  }

  // Best-effort revoke
  try {
    const oauth2 = authorizedClient({
      access_token: conn.access_token as string,
      refresh_token: conn.refresh_token as string,
      expires_at: new Date(conn.expires_at as string),
    });
    await oauth2.revokeCredentials();
  } catch (err) {
    console.warn("[google] revoke failed (non-fatal):", err);
  }

  await supabase.from("google_connections").delete().eq("user_id", user.id);

  return NextResponse.json({ ok: true });
}
