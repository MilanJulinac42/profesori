import { Resend } from "resend";

let client: Resend | null = null;

export function getResend(): Resend {
  if (!client) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error(
        "RESEND_API_KEY nije podešen. Dodaj ga u .env.local da bi slao izveštaje email-om.",
      );
    }
    client = new Resend(apiKey);
  }
  return client;
}

export function getResendFromEmail(): string {
  const from = process.env.RESEND_FROM_EMAIL;
  if (!from) {
    throw new Error(
      "RESEND_FROM_EMAIL nije podešen. Postavi npr. 'Profesori <reports@tvojdomen.com>'.",
    );
  }
  return from;
}
