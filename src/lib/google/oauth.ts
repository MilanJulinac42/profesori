import { google } from "googleapis";
import type { OAuth2Client } from "google-auth-library";

export const SCOPES = [
  "https://www.googleapis.com/auth/calendar.events.owned",
  "https://www.googleapis.com/auth/calendar.calendars",
  "https://www.googleapis.com/auth/calendar.calendarlist.readonly",
  "openid",
  "email",
];

function getRedirectUri(): string {
  const base =
    process.env.GOOGLE_REDIRECT_URI ||
    `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/api/google/callback`;
  return base;
}

/** Kreira novu OAuth2 klijenat instancu — koristi se za autorizaciju i refresh. */
export function getOAuth2Client(): OAuth2Client {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error(
      "GOOGLE_CLIENT_ID i GOOGLE_CLIENT_SECRET moraju biti podešeni u env-u.",
    );
  }
  return new google.auth.OAuth2(clientId, clientSecret, getRedirectUri());
}

/** Generiše URL za Google consent screen. */
export function buildAuthUrl(state: string): string {
  const oauth2 = getOAuth2Client();
  return oauth2.generateAuthUrl({
    access_type: "offline", // da bismo dobili refresh_token
    prompt: "consent", // da uvek dobijemo refresh_token (čak i ako je već autorizovan)
    scope: SCOPES,
    state,
    include_granted_scopes: true,
  });
}

/** Razmena code → tokens. */
export async function exchangeCodeForTokens(code: string) {
  const oauth2 = getOAuth2Client();
  const { tokens } = await oauth2.getToken(code);
  return tokens;
}

/** Pull korisnikov email iz id_token-a (već imamo iz exchange-a). */
export async function getUserEmail(idToken: string): Promise<string | null> {
  try {
    const oauth2 = getOAuth2Client();
    const ticket = await oauth2.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    return payload?.email ?? null;
  } catch {
    return null;
  }
}

/** Konstrukcija autorizovanog OAuth klijenta sa već postojećim tokens. */
export function authorizedClient(input: {
  access_token: string;
  refresh_token: string;
  expires_at: Date;
}): OAuth2Client {
  const client = getOAuth2Client();
  client.setCredentials({
    access_token: input.access_token,
    refresh_token: input.refresh_token,
    expiry_date: input.expires_at.getTime(),
  });
  return client;
}
