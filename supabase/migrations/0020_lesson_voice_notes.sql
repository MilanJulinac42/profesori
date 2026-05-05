-- Voice/AI-assisted post-lesson note fields.
-- progress_summary = AI-distilovan kratak rezime za reportovanje (1-3 rečenice).
-- voice_transcript_raw = sirov Whisper transkript pre AI cleanup-a (audit / fallback).

alter table public.lessons
  add column progress_summary text,
  add column voice_transcript_raw text;
