import OpenAI from "openai";

let client: OpenAI | null = null;

export function getOpenAI(): OpenAI {
  if (!client) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error(
        "OPENAI_API_KEY nije podešen. Dodaj ga u .env.local (potreban za Whisper transkripciju).",
      );
    }
    client = new OpenAI({ apiKey });
  }
  return client;
}

/**
 * Whisper model za transkripciju srpskog. gpt-4o-mini-transcribe je jeftiniji i odličan za srpski.
 * gpt-4o-transcribe je tačniji ali dvostruko skuplji.
 */
export const TRANSCRIBE_MODEL = "gpt-4o-mini-transcribe";
