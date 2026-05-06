"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/supabase/auth";
import { listHomeworkForLesson } from "./queries";
import type { Homework } from "./types";

/** Server-action wrapper za client component (HomeworkSection) da pull-uje
 * početno stanje pri otvaranju dijaloga. */
export async function listHomeworkForLessonAction(
  lessonId: string,
): Promise<Homework[]> {
  await requireUser();
  const supabase = await createClient();
  return listHomeworkForLesson(supabase, lessonId);
}

export type CreateHomeworkInput = {
  studentId: string;
  lessonId?: string | null;
  exerciseSetId?: string | null;
  title: string;
  description?: string;
  dueDate?: string; // YYYY-MM-DD
};

export type CreateResult =
  | { ok: true; homeworkId: string; publicToken: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

export async function createHomeworkAction(
  input: CreateHomeworkInput,
): Promise<CreateResult> {
  try {
    const { profile } = await requireUser();
    const supabase = await createClient();

    const fieldErrors: Record<string, string> = {};
    if (!input.studentId) fieldErrors.student_id = "Učenik je obavezan.";
    if (!input.title || !input.title.trim())
      fieldErrors.title = "Naslov je obavezan.";
    if (input.title && input.title.trim().length > 200)
      fieldErrors.title = "Naslov je predugačak (max 200 char).";

    if (Object.keys(fieldErrors).length > 0) {
      return { ok: false, error: "Proveri polja.", fieldErrors };
    }

    const { data, error } = await supabase
      .from("homework")
      .insert({
        organization_id: profile.organization_id,
        student_id: input.studentId,
        lesson_id: input.lessonId ?? null,
        exercise_set_id: input.exerciseSetId ?? null,
        title: input.title.trim(),
        description: input.description?.trim() || null,
        due_date: input.dueDate || null,
      })
      .select("id, public_token")
      .single();

    if (error) return { ok: false, error: error.message };

    revalidatePath(`/students/${input.studentId}`);
    if (input.lessonId) revalidatePath(`/lessons/${input.lessonId}`);
    revalidatePath("/dashboard");

    return { ok: true, homeworkId: data.id, publicToken: data.public_token };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Greška pri kreiranju.",
    };
  }
}

export type UpdateHomeworkInput = {
  homeworkId: string;
  title?: string;
  description?: string;
  dueDate?: string | null;
  status?: "assigned" | "submitted" | "graded" | "skipped";
  teacherGrade?: number | null;
  teacherFeedback?: string | null;
};

export async function updateHomeworkAction(
  input: UpdateHomeworkInput,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await requireUser();
    const supabase = await createClient();

    const patch: Record<string, unknown> = {};
    if (input.title !== undefined) patch.title = input.title.trim();
    if (input.description !== undefined)
      patch.description = input.description.trim() || null;
    if (input.dueDate !== undefined) patch.due_date = input.dueDate || null;
    if (input.status !== undefined) {
      patch.status = input.status;
      if (input.status === "graded") patch.graded_at = new Date().toISOString();
    }
    if (input.teacherGrade !== undefined) patch.teacher_grade = input.teacherGrade;
    if (input.teacherFeedback !== undefined)
      patch.teacher_feedback = input.teacherFeedback?.trim() || null;

    const { data: row, error } = await supabase
      .from("homework")
      .update(patch)
      .eq("id", input.homeworkId)
      .select("student_id, lesson_id")
      .single();

    if (error) return { ok: false, error: error.message };

    revalidatePath(`/students/${row.student_id}`);
    if (row.lesson_id) revalidatePath(`/lessons/${row.lesson_id}`);
    revalidatePath("/dashboard");

    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Greška pri izmeni.",
    };
  }
}

export async function deleteHomeworkAction(
  homeworkId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await requireUser();
    const supabase = await createClient();

    const { data: row, error } = await supabase
      .from("homework")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", homeworkId)
      .select("student_id")
      .single();

    if (error) return { ok: false, error: error.message };

    revalidatePath(`/students/${row.student_id}`);
    revalidatePath("/dashboard");

    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Greška pri brisanju.",
    };
  }
}

/**
 * PUBLIC upload action — uploaduje sliku u Supabase Storage bucket
 * 'homework-submissions' i vraća public URL. Autorizacija je preko
 * `public_token` (validiramo da postoji red sa tim tokenom).
 *
 * FormData mora da sadrži: token, file.
 */
export async function uploadHomeworkImageAction(
  formData: FormData,
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  try {
    const token = formData.get("token");
    const file = formData.get("file");

    if (typeof token !== "string" || !/^[a-f0-9]{32}$/.test(token)) {
      return { ok: false, error: "Nevalidan token." };
    }
    if (!(file instanceof File)) {
      return { ok: false, error: "Nedostaje fajl." };
    }
    if (file.size > 5 * 1024 * 1024) {
      return { ok: false, error: "Slika je veća od 5 MB." };
    }
    if (
      !["image/jpeg", "image/png", "image/webp", "image/heic"].includes(file.type)
    ) {
      return { ok: false, error: "Dozvoljen format: JPG, PNG, WebP, HEIC." };
    }

    const { createClient: createServiceClient } = await import(
      "@supabase/supabase-js"
    );
    const supabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } },
    );

    // Validacija: token mora odgovarati postojećem domaćem.
    const { data: hw } = await supabase
      .from("homework")
      .select("id")
      .eq("public_token", token)
      .is("deleted_at", null)
      .maybeSingle();
    if (!hw) return { ok: false, error: "Domaći nije pronađen." };

    // Upload — putanja: <token>/<timestamp>-<random>.<ext>
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const path = `${token}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const buffer = Buffer.from(await file.arrayBuffer());
    const { error: uploadError } = await supabase.storage
      .from("homework-submissions")
      .upload(path, buffer, { contentType: file.type, upsert: false });

    if (uploadError) return { ok: false, error: uploadError.message };

    const { data: urlData } = supabase.storage
      .from("homework-submissions")
      .getPublicUrl(path);

    return { ok: true, url: urlData.publicUrl };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Greška pri uploadu.",
    };
  }
}

/**
 * PUBLIC akcija — poziva je student/roditelj sa public stranice.
 * Ne traži auth; autorizacija je preko `public_token`.
 */
export async function submitHomeworkAction(input: {
  publicToken: string;
  submissionNote?: string;
  imageUrls?: string[];
}): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    if (!input.publicToken || !/^[a-f0-9]{32}$/.test(input.publicToken)) {
      return { ok: false, error: "Nevalidan token." };
    }

    const { createClient: createServiceClient } = await import("@supabase/supabase-js");
    const supabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } },
    );

    const { data: hw } = await supabase
      .from("homework")
      .select("id, status, student_id")
      .eq("public_token", input.publicToken)
      .is("deleted_at", null)
      .maybeSingle();

    if (!hw) return { ok: false, error: "Domaći nije pronađen." };

    if (hw.status === "submitted" || hw.status === "graded") {
      return { ok: false, error: "Domaći je već predat." };
    }

    const images = (input.imageUrls ?? []).slice(0, 5);

    const { error } = await supabase
      .from("homework")
      .update({
        status: "submitted",
        submission_note: input.submissionNote?.trim() || null,
        submission_images: images,
        submitted_at: new Date().toISOString(),
      })
      .eq("id", hw.id);

    if (error) return { ok: false, error: error.message };

    revalidatePath(`/h/${input.publicToken}`);
    revalidatePath(`/students/${hw.student_id}`);
    revalidatePath("/dashboard");

    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Greška pri predaji.",
    };
  }
}
