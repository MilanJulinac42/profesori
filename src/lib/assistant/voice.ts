"use server";

import { requireUser } from "@/lib/supabase/auth";
import { transcribeAudio } from "@/lib/lessons/transcribe";
import { checkAssistantRateLimit } from "./rate-limit";

export type TranscribeResult =
  | { ok: true; transcript: string }
  | { ok: false; error: string };

const MAX_AUDIO_BYTES = 8 * 1024 * 1024; // 8 MB — covers ~3 min of opus

/**
 * Server action that takes recorded audio from the assistant input and
 * returns a plain transcript via Whisper. Same rate-limit bucket as the
 * chat endpoint (a transcribe + send is one "AI exchange").
 */
export async function transcribeAssistantVoice(
  formData: FormData,
): Promise<TranscribeResult> {
  try {
    const { authUser } = await requireUser();

    const rate = await checkAssistantRateLimit(authUser.id);
    if (!rate.ok) {
      return { ok: false, error: rate.message };
    }

    const file = formData.get("audio");
    if (!(file instanceof File)) {
      return { ok: false, error: "Audio fajl nije priložen." };
    }
    if (file.size === 0) {
      return { ok: false, error: "Prazan snimak." };
    }
    if (file.size > MAX_AUDIO_BYTES) {
      return { ok: false, error: "Snimak je predugačak (preko 8 MB)." };
    }

    const transcript = await transcribeAudio(file);
    const trimmed = transcript.trim();
    if (!trimmed) {
      return { ok: false, error: "Nisam čuo ništa. Probaj ponovo." };
    }
    return { ok: true, transcript: trimmed };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Greška pri transkripciji.",
    };
  }
}
