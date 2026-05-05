"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TopicInput } from "@/components/topic-input";
import { StarRating } from "@/components/star-rating";
import {
  AINoteCapture,
  type FilledDraft,
} from "@/components/ai-note-capture";
import { saveLessonNotesFromDraft } from "@/lib/lessons/actions";

type Initial = {
  notes_after_lesson: string | null;
  topics_covered: string[];
  progress_summary: string | null;
  next_lesson_plan: string | null;
  lesson_rating: number | null;
};

export function NoteCaptureScreen({
  lessonId,
  topicSuggestions,
  initial,
}: {
  lessonId: string;
  topicSuggestions: string[];
  initial: Initial;
}) {
  const router = useRouter();

  const [notesAfter, setNotesAfter] = useState(initial.notes_after_lesson ?? "");
  const [progressSummary, setProgressSummary] = useState(
    initial.progress_summary ?? "",
  );
  const [topics, setTopics] = useState<string[]>(initial.topics_covered);
  const [rating, setRating] = useState<number | null>(initial.lesson_rating);
  const [nextPlan, setNextPlan] = useState(initial.next_lesson_plan ?? "");
  const [transcriptRaw, setTranscriptRaw] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function applyDraft(draft: FilledDraft) {
    setNotesAfter(draft.notes_after_lesson || "");
    setProgressSummary(draft.progress_summary || "");
    setTopics(draft.topics_covered ?? []);
    setNextPlan(draft.next_lesson_plan || "");
    if (draft.suggested_rating !== null && draft.suggested_rating !== undefined) {
      setRating(draft.suggested_rating);
    }
    setTranscriptRaw(draft.transcript_raw ?? null);
  }

  function onSave() {
    startTransition(async () => {
      setError(null);
      const res = await saveLessonNotesFromDraft(lessonId, {
        notes_after_lesson: notesAfter,
        topics_covered: topics,
        progress_summary: progressSummary,
        next_lesson_plan: nextPlan,
        suggested_rating: rating ?? null,
        transcript_raw: transcriptRaw,
      });
      if (res.error) {
        setError(res.error);
        return;
      }
      router.push("/dashboard");
      router.refresh();
    });
  }

  return (
    <div className="space-y-5">
      <AINoteCapture lessonId={lessonId} onDraft={applyDraft} />

      <div className="space-y-1.5">
        <Label htmlFor="notes_after_lesson" className="text-xs">
          Šta je rađeno (privatno za tebe)
        </Label>
        <Textarea
          id="notes_after_lesson"
          value={notesAfter}
          onChange={(e) => setNotesAfter(e.target.value)}
          rows={3}
          placeholder="Kratko: o čemu ste pričali, šta ste vežbali..."
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="progress_summary" className="text-xs">
          Rezime za izveštaj (vidi roditelj/učenik)
        </Label>
        <Textarea
          id="progress_summary"
          value={progressSummary}
          onChange={(e) => setProgressSummary(e.target.value)}
          rows={2}
          placeholder="1-2 rečenice o napretku — ide u nedeljni/mesečni izveštaj."
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Teme</Label>
        <TopicInput
          value={topics}
          onChange={setTopics}
          suggestions={topicSuggestions}
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Kako je išlo</Label>
        <StarRating value={rating} onChange={setRating} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="next_lesson_plan" className="text-xs">
          Šta za sledeći put
        </Label>
        <Textarea
          id="next_lesson_plan"
          value={nextPlan}
          onChange={(e) => setNextPlan(e.target.value)}
          rows={2}
          placeholder="Plan za sledeći čas..."
        />
      </div>

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <div className="flex items-center gap-2 pt-2 sticky bottom-4 bg-background/80 backdrop-blur-sm py-3 -mx-4 px-4 sm:mx-0 sm:px-0 border-t border-border sm:border-0">
        <Button type="button" onClick={onSave} disabled={pending} className="flex-1 sm:flex-none">
          <Check className="size-4" strokeWidth={2} />
          {pending ? "Čuvanje..." : "Sačuvaj belešku"}
        </Button>
      </div>
    </div>
  );
}
