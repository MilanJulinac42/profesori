# Curriculum / Plan učenika — full design + delivery plan

**Status:** ⏳ Not started — to be built in a fresh session.
**Last design discussion:** 2026-05-17
**Owner:** Milan

This document is the complete brief. A new Claude session should be able to read this and execute Phase 1 without re-asking design questions.

---

## 0. Context — read this first

**Project:** Profesori — SaaS for solo private-lesson teachers in Serbia.

**Important constraints (don't re-suggest, don't ignore):**
- **Teachers work "na crno"** (off the books). Only the SaaS subscription itself is declared. Don't propose tax exports, invoice generators, legal-entity features, or anything that assumes formal income tracking.
- **No payment processing in the app.** Money flows directly between teacher and student/parent (cash, bank transfer via Intesa, etc.). Don't suggest Stripe, payment links, in-app checkout.
- **Single-teacher orgs.** Each organization has one teacher. Don't build team/multi-user features.
- **Serbian only.** UI in Latinica.
- **Existing stack:** Next.js 16 (App Router, Turbopack), React 19, Tailwind v4, Supabase (Postgres + Auth + Storage), Anthropic Claude API for AI assistant, Resend for email, Vercel for hosting.

**What's already built that this feature touches:**
- `students` table + `/students/[id]` page with tabs (`pregled`, `naplata`, `casovi`, `domaci`, `izvestaji`)
- `lessons` table with `topics_covered text[]`, `notes_after_lesson`, `progress_summary`, `next_lesson_plan`
- AI assistant (streaming chat at `/api/assistant/chat`, has a tools system in `lib/assistant/tools.ts`)
- Reports system (weekly/monthly auto via cron, manual via "Pošalji sada")
- Yearbook at `/students/[id]/yearbook` (year-end print packet)
- Existing public-profile fields `subjects[]`, `levels[]` — keep separate from curriculum

---

## 1. Feature intent

**One-line:** Teachers define curricula (subject + grade + ordered topics), assign them to students, and track per-student progress through each topic as lessons are logged.

**Why now:** Teachers currently note `topics_covered` as free text per lesson. There's no notion of "where is Marko in the syllabus, what's left, what's next." The yearbook shows what was covered but not against any plan.

**Killer UI:** "Putovanje kroz napredak" — a visual journey (vertical road on mobile, horizontal on desktop) with stations (sections) and branching subtopics. Not a spreadsheet. The teacher should feel like they're tracking real progress, not filling rows.

---

## 2. Design decisions — locked

These were settled in the design discussion. Don't reopen unless implementation surfaces a real conflict.

| ID | Question | Decision |
|---|---|---|
| Q1 | Granularity — one curriculum per (subject, grade), or split (e.g. Algebra vs Geometry separately)? | **One curriculum per (subject, grade)**. Internal hierarchy carries the split via sections. |
| Q2 | Can a student have multiple active curricula at once? | **Yes.** Common case: regular school + entrance-exam prep. |
| Q3 | How is "mastered" set? | **Manual toggle only.** No auto-rules in Phase 1. AI may *suggest* later (Phase 3). |
| Q4 | System-seeded curricula vs teacher-created? | **Teacher-created only.** No system seed at all. Each teacher builds their own. AI generation comes later, after we see patterns. |
| Q5 | Auto-suggest curriculum on student create? | **Yes but gentle.** Soft hint in empty Plan tab. Never auto-assigned. |
| Q6 | Hierarchy depth | **2 levels max.** Section → subtopic. `parent_unit_id` may be null (= section) or point to a section (= subtopic). No deeper nesting. |
| Q7 | AI auto-detection of covered units from voice notes / topics_covered | **Yes as proposal.** Never auto-applied. Shows "AI predlaže: …, potvrdi?" with Y/N. Phase 3. |
| Q8 | Curriculum progress in reports/yearbook | **Yes.** Reports include "Marko je u martu pokrio 4 nove teme, 2 savladao." Phase 3. |
| O1 | Subject input on new curriculum | **Plain text + autocomplete** from previously used subjects in the same org. |
| O2 | Auto-sync curriculum subject to public-profile subjects? | **No.** Independent. Curriculum is internal tooling; public profile stays separate. |
| O3 | Empty state on Plan tab | **Adaptive.** If org has curricula → "Dodeli kurikulum" picker. If org has none → "Napravi prvi kurikulum" → `/curricula/new`. |
| O4 | Sharing curricula between teachers? | **Strictly private for now.** RLS by `organization_id`. Schema doesn't preclude adding `is_public` later. |

---

## 3. Data model

5 new tables. Migration number TBD — check `supabase/migrations/` for next free index (was 0039 at write time; probably 0040).

```sql
-- A curriculum belongs to one org. Teacher creates from scratch.
create table public.curricula (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  subject text not null,           -- "Matematika", "Klavir", whatever
  grade_label text,                 -- "8. razred OŠ", "Cambridge B1", nullable
  name text not null,               -- "Matematika 8. razred"
  description text,
  is_active boolean not null default true,
                                   -- false = draft, hidden from assignment picker
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index curricula_org_idx
  on public.curricula (organization_id)
  where deleted_at is null;

-- Hierarchical units. parent_unit_id NULL = section, non-NULL = subtopic.
-- 2 levels max — enforced in app code, not DB constraint (keep schema simple).
create table public.curriculum_units (
  id uuid primary key default gen_random_uuid(),
  curriculum_id uuid not null references public.curricula (id) on delete cascade,
  parent_unit_id uuid references public.curriculum_units (id) on delete cascade,
  title text not null,
  description text,
  order_index integer not null default 0,
  est_lessons integer,             -- "obično 2-3 časa" — orijentacija, optional
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index curriculum_units_curriculum_idx
  on public.curriculum_units (curriculum_id, parent_unit_id, order_index);

-- Many-to-many between students and curricula. Students can have multiple
-- active curricula (Q2). UNIQUE partial index prevents the same curriculum
-- being active twice for the same student.
create table public.student_curricula (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students (id) on delete cascade,
  curriculum_id uuid not null references public.curricula (id) on delete cascade,
  started_at timestamptz not null default now(),
  ended_at timestamptz                          -- null = active
);

create unique index student_curricula_one_active_idx
  on public.student_curricula (student_id, curriculum_id)
  where ended_at is null;

-- Per-student, per-unit progress.
create table public.student_unit_progress (
  id uuid primary key default gen_random_uuid(),
  student_curriculum_id uuid not null
    references public.student_curricula (id) on delete cascade,
  unit_id uuid not null
    references public.curriculum_units (id) on delete cascade,
  status text not null default 'not_started'
    check (status in ('not_started','in_progress','mastered','skipped')),
  last_lesson_id uuid references public.lessons (id) on delete set null,
  mastered_at timestamptz,
  notes text,
  updated_at timestamptz not null default now(),
  unique (student_curriculum_id, unit_id)
);

create index student_unit_progress_sc_idx
  on public.student_unit_progress (student_curriculum_id);

-- Many-to-many lesson ↔ unit. Set when a lesson is marked completed AND
-- the teacher (or AI-confirmed) tagged it with units.
create table public.lesson_units (
  lesson_id uuid not null references public.lessons (id) on delete cascade,
  unit_id uuid not null references public.curriculum_units (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (lesson_id, unit_id)
);

create index lesson_units_unit_idx
  on public.lesson_units (unit_id);
```

### RLS

All tables ENABLE ROW LEVEL SECURITY.

- `curricula`, `curriculum_units`: read/write only own org. Use the existing `public.current_organization_id()` helper.
- `student_curricula`, `student_unit_progress`: chain via `student_id → students.organization_id`.
- `lesson_units`: chain via `lesson_id → lessons.organization_id`.

For chained tables, use a CTE in the policy or join via a function. Existing migrations have patterns for both — match the style of `student_curriculum_progress`-style tables elsewhere (e.g. payments, lessons).

---

## 4. UX — the "journey" view

This is the most important part. Don't ship a spreadsheet.

### Header (sticky on the Plan tab)

```
┌────────────────────────────────────────────────────┐
│ Plan · Marko Petrović                              │
│ Matematika · 8. razred                             │
│                                                    │
│ [████████████░░░░░░░░░░░░░] 43%                   │
│ 12 od 28 tema · 3 u toku · trenutno: Krug         │
└────────────────────────────────────────────────────┘
```

If multiple active curricula: tab selector under the title to switch ("Matematika 8" / "Priprema za MG").

### Journey (the big piece)

A **vertical road** with stations (sections). Subtopics branch to the right from each station.

```
   ●━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
   Algebra                          ┃→ ✓ Linearne jednačine
   ✓ Savladano (5/5)                ┃→ ✓ Razlomci
                                    ┃→ ✓ Polinomi
   │
   ▼
   ◉━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
   Geometrija                       ┃→ ✓ Pitagora
   U toku (2/4)                     ┃→ ◉ Krug ← trenutno
                                    ┃→ ○ Mnogougli
                                    ┃→ ○ Površine
   │
   ▼
   ○━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
   Trigonometrija                   ┃→ ○ Sinus
   Nije počeo (0/3)                 ┃→ ○ Kosinus
                                    ┃→ ○ Identiteti
```

#### Station states

| Status | Visual |
|---|---|
| `not_started` | Outline circle, muted gray, opacity 60% |
| `in_progress` | Ring around empty circle with subtle pulse glow, full brand color, prominent |
| `mastered` | Filled circle with ✓ checkmark, brand cyan, slightly muted (job's done) |
| `skipped` | Strikethrough circle, gray, smallest |

A station is `mastered` iff **all of its subtopics** are mastered or skipped (computed, not stored — derived in the SELECT or in the React render).
A station is `in_progress` iff any subtopic is in_progress, or some are mastered but not all.
A station with **no children** uses its own status.

#### Subtopic rows

Each subtopic shows:
- Small circle icon matching its status
- Title
- (optional) "x časova" if it has lesson_units links

#### Connections

Curved SVG lines between stations and subtopics. Lines are:
- Brand-colored for completed (mastered) sections
- Muted gradient for in-progress (mastered portion solid, rest faded)
- Gray dashed for not-yet-started

#### Mobile vs desktop

- **Mobile (<768px):** Vertical road, subtopics expand below their section in a list.
- **Desktop (≥768px):** Same vertical road but subtopics branch to the right with proper SVG curves. Use `ResizeObserver` for layout if needed.

### Interaction — click a station or subtopic

Opens a **side panel** (desktop) or **bottom sheet** (mobile) — reuse the assistant widget pattern.

Panel contents:
- Title + breadcrumb (Section ▸ Subtopic)
- Description (if set)
- Current status badge
- Status toggle buttons (4 buttons: Nije počeo / U toku / Savladano / Preskoči)
- List of lessons that linked to this unit, with date + click-through to lesson
- "Beleške" textarea (`notes` on `student_unit_progress`)
- (Phase 3) "AI generiši zadatke za ovu temu" — calls existing exercise generator with unit title as the topic
- "Zatvori" or backdrop click

### Mikro-animacije

- Marking a unit as `mastered` → checkmark scales in with a brief brand-color flash. Optional confetti for a section mastered (all subtopics done).
- Status changes animate via Framer-style (but use CSS / motion already in deps).
- Progress bar at top eases to new value over 600ms.

### Empty states

- **No curriculum assigned to this student:**
  - If org has 1+ curricula: "Dodeli kurikulum" picker (cards with curriculum name + subject + grade)
  - If org has zero curricula: empty card with CTA "Napravi prvi kurikulum" → `/curricula/new`
- **Curriculum assigned but no units yet:** "Ovaj kurikulum je prazan. Dodaj prvu sekciju u editoru." → link to `/curricula/[id]`

### Accessibility

- All status toggles are buttons with proper aria-labels ("Označi kao savladano").
- The journey container is a `<nav>` with `aria-label="Plan učenika"`.
- Subtopics are an `<ul>` per section.
- Decorative SVG paths get `aria-hidden`.
- Status icons get `aria-label`.

---

## 5. Curriculum editor — `/curricula` and `/curricula/[id]`

### `/curricula` (list)

- Page header: "Moji kurikulumi" + "Novi kurikulum" button → `/curricula/new`
- Grid of cards, one per active curriculum:
  - Title, subject, grade
  - Counts: "5 sekcija · 24 teme · korišćen na 3 učenika"
  - Click → editor
- Inactive (draft) curricula shown below in a collapsed section "Skice"

### `/curricula/[id]` (editor)

Server-rendered shell. Client component handles all the editing in place.

**Header:**
- Editable name, subject, grade_label, description (all inline-edit, save on blur)
- "Aktivan" toggle (controls visibility in assignment picker)
- "Obriši kurikulum" — soft-delete with confirmation; warns if assigned to any students

**Body — sections list with drag-reorder:**

Each section card:
- Section title (inline-edit)
- Subtopic list (also drag-reorder, within the section only)
- "+ Dodaj podtemu" inline at the bottom
- "+ Dodaj sekciju" at the bottom of the page
- Drag handle on section to reorder sections themselves
- Optional `est_lessons` input per unit ("~3 časa") — small, secondary

**Drag-and-drop:**
- Reuse the schedule drag-drop pattern (Pointer Events, not libraries)
- Updates `order_index` via server action on drop
- Visual feedback: dragged item is semi-transparent + dropzone highlighted

**Save semantics:**
- All edits autosave (debounce 300ms) — keep teacher in flow
- Show a tiny "Sačuvano" toast on each save
- On network failure, keep changes in local state with retry button

---

## 6. Phased delivery plan

### 🟢 Phase 1 — Foundation + Editor + Journey UI (~6-8h)

1. **Migration**
   - `0040_curriculum.sql` with all 5 tables + indexes + RLS policies

2. **Server: actions + queries**
   - `src/lib/curriculum/queries.ts`:
     - `listOrgCurricula(supabase, orgId): Curriculum[]`
     - `getCurriculumWithUnits(supabase, id): CurriculumDetail`
     - `getStudentPlan(supabase, studentId): StudentPlan` — returns all active curricula assignments + units + progress in one shape suitable for the journey UI
   - `src/lib/curriculum/actions.ts`:
     - `createCurriculum`, `updateCurriculum`, `softDeleteCurriculum`
     - `addUnit`, `updateUnit`, `deleteUnit`, `reorderUnits` (takes array of {id, order_index})
     - `assignCurriculumToStudent`, `unassignCurriculum` (sets ended_at)
     - `updateUnitStatus(studentCurriculumId, unitId, status)`

3. **List page `/curricula`**
   - Server-rendered list. Cards with summary counts.
   - "Novi kurikulum" → server action that creates draft + redirect to `/curricula/[id]`

4. **Editor `/curricula/[id]`**
   - Inline-edit name/subject/grade/description
   - Sections + subtopics with drag-reorder
   - Autosave per field
   - Confirm-on-delete for both curriculum and units

5. **Plan tab on `/students/[id]?tab=plan`**
   - Add `plan` to `TabValue` union in `src/app/(app)/students/[id]/page.tsx`
   - New block component `PlanTabBlock` fetched via Suspense (reuse the pattern from existing tabs)
   - Empty states (no curricula in org / no assignment for this student)
   - Curriculum picker (modal) for assignment

6. **Journey component**
   - `src/app/(app)/students/[id]/_components/plan-journey.tsx` (client)
   - Receives `{ studentCurricula, units, progress }` as props
   - Pure SVG/CSS for the road + branches
   - Side panel / bottom sheet for unit details
   - Status toggle buttons → server action → optimistic update + revalidatePath

7. **Pump up the UI quality** — this is the priority. Don't ship a spreadsheet. See section 4.

**End of Phase 1 deliverable:** Teacher can create a curriculum, assign it to a student, manually toggle unit statuses from the journey UI, and feel like they're moving forward.

---

### 🟡 Phase 2 — Lesson linking + Auto-progress (~3-4h)

8. **Lesson dialog enhancement** (`src/app/(app)/schedule/_components/lesson-dialog.tsx`)
   - New section: "Koje teme si pokrio?" multi-select
   - Options filtered to units belonging to student's active curricula
   - On save (or on status flip to `completed`), write `lesson_units` rows

9. **Auto-progress on lesson save**
   - When a lesson goes `scheduled → completed` and has linked units:
     - For each linked unit where progress is `not_started`, flip to `in_progress`
     - Update `last_lesson_id` to this lesson
   - Don't touch `mastered` or `skipped` automatically.

10. **Quick "Označi savladano" from the lesson note flow**
    - On the lesson note save dialog, show pills of currently linked in-progress units with a "Sad savladano" toggle
    - One click per unit promotes status to `mastered` + sets `mastered_at`

---

### 🟠 Phase 3 — AI integration + reports (~3h)

11. **AI assistant tool**
    - New tool `get_student_curriculum_progress(student_id)` in `src/lib/assistant/tools.ts`
    - Returns assigned curricula + unit statuses
    - Used by the assistant to answer "Šta je sledeće za Marka?" or "Koliko je Marko savladao u martu?"

12. **AI proposal in voice-note flow**
    - In `src/lib/lessons/transcribe.ts` `processNoteText` (or in a follow-up step), match `topics_covered` against student's active-curriculum unit titles using fuzzy/normalized match
    - Return `suggested_unit_ids: string[]` alongside the draft
    - In the lesson note save UI, render these as a soft suggestion: "AI predlaže: ✓ Kvadratne jednačine, ✓ Razlomci. Potvrdi?"
    - Important: gentle, not pushy (Q5). Don't auto-apply.

13. **Reports integration**
    - In `src/lib/reports/generate.ts`, add a `curriculum_progress` block to `ReportData`:
      - New units `in_progress` this period
      - Newly `mastered` this period
      - % overall progress of active curricula
    - Render in `src/lib/reports/render.ts` (HTML email body)

14. **Yearbook integration**
    - In the existing `/students/[id]/yearbook/page.tsx`, add a section "Plan učenja"
    - List sections covered in the year + masterery counts
    - Visual: small horizontal progress bars per active curriculum

15. **Dashboard widget (optional, low priority)**
    - "Šta je sledeće za tvoje učenike?" — top 3 students by recent lesson date, showing next not-started unit

---

### 🔵 Phase 4 — Auto-suggest + nice-to-haves (~2h)

16. **Auto-suggest curriculum on new student**
    - On `/students/new` form, after submit, if `grade` matches the `grade_label` of any of the org's active curricula, show a follow-up step: "Imam kurikulum za 8. razred — želiš da ga dodelim?"
    - One-click yes → calls `assignCurriculumToStudent` and redirects to `/students/[id]?tab=plan`
    - Skip is fine — never blocks the flow

17. **Bulk-assign**
    - From `/curricula/[id]` editor: "Dodeli ovaj kurikulum trenutnim učenicima" → multi-select students → bulk assign
    - Useful when a teacher refines a curriculum and wants to push it to all the relevant kids at once

---

## 7. File-by-file scaffolding

When you start Phase 1, expect to touch:

**New files:**
- `supabase/migrations/0040_curriculum.sql`
- `src/lib/curriculum/types.ts`
- `src/lib/curriculum/queries.ts`
- `src/lib/curriculum/actions.ts`
- `src/app/(app)/curricula/page.tsx` (list)
- `src/app/(app)/curricula/new/page.tsx` (creates draft + redirects)
- `src/app/(app)/curricula/[id]/page.tsx` (editor shell)
- `src/app/(app)/curricula/[id]/_components/editor.tsx` (client, inline edits + drag-reorder)
- `src/app/(app)/students/[id]/_components/plan-journey.tsx` (client, the killer UI)
- `src/app/(app)/students/[id]/_components/plan-empty-state.tsx`
- `src/app/(app)/students/[id]/_components/plan-unit-panel.tsx` (side panel / bottom sheet)
- `src/app/(app)/students/[id]/_components/curriculum-picker-dialog.tsx`

**Modified files (Phase 1):**
- `src/app/(app)/students/[id]/page.tsx` — add `plan` to TabValue, render `PlanTabBlock`
- `src/app/(app)/layout.tsx` — maybe `/curricula` should be in the sidebar (add to `Sidebar` items list)
- `src/components/layout/sidebar.tsx` — add "Kurikulumi" link with appropriate icon

**Modified files (Phase 2+):**
- `src/app/(app)/schedule/_components/lesson-dialog.tsx` — add unit picker
- `src/lib/lessons/actions.ts` — `updateLesson` writes `lesson_units` + auto-progresses
- `src/lib/lessons/transcribe.ts` — return suggested unit ids
- `src/lib/reports/generate.ts` + `render.ts` — curriculum_progress block
- `src/app/(app)/students/[id]/yearbook/page.tsx` — plan section
- `src/lib/assistant/tools.ts` — new tool definition

---

## 8. Open implementation questions

These are fine to defer until they actually come up while coding. Don't pre-decide.

1. **Color theming for status states:** Use existing `tile-emerald/violet/amber/rose` palette. Pick one combo for mastered (probably cyan/emerald), one for in-progress (violet?), etc. Adjust during build.

2. **Drag-and-drop library:** None. Reuse the Pointer-Events approach already in `week-view.tsx` for lessons. SortableJS or react-dnd would be overkill.

3. **SVG curve math for branching subtopics:** Quadratic Bezier from section center to subtopic anchor. Static — recompute only on resize. Cache.

4. **Optimistic updates:** Yes for status toggles. Pessimistic (with spinner) for unit add/delete in the editor — they're rare.

5. **What happens when teacher edits a unit's title after it's already linked to lessons / has progress?** Title change just propagates. No version history. Soft-delete on unit cascades to `student_unit_progress` and `lesson_units`.

6. **Performance ceiling:** Plan tab renders all units of all active curricula in one go. If a curriculum has 100 units, that's fine. Don't paginate until someone hits a real ceiling.

7. **Multi-org sharing (deferred Q4):** When this comes up later, the pattern is: add `is_public boolean` to `curricula`, add a new public-readable view, build a marketplace UI. Schema as designed supports this addition without a migration of existing data.

---

## 9. What this is NOT

To avoid scope creep:

- Not a quiz / test creator (we have AI exercises separately)
- Not a learning management system (no student logins, no submission grading)
- Not a content library (curricula are skeletons; the actual teaching material lives in the teacher's head / Google Drive / wherever)
- Not a marketplace (Q4 says private for now)
- Not a tool for the student or parent to see (Phase 1 is teacher-only; parent-facing progress lands in reports/yearbook in Phase 3)

---

## 10. Definition of Done — Phase 1

Phase 1 ships when:

- [ ] Migration applied; all 5 tables exist with correct RLS
- [ ] Teacher can create a curriculum from scratch at `/curricula/new`
- [ ] Editor supports section + subtopic CRUD + drag-reorder + autosave
- [ ] Teacher can assign a curriculum to a student from the Plan tab
- [ ] Plan tab renders the journey UI (vertical road + branching subtopics)
- [ ] Clicking a unit opens the side/bottom panel with status toggle + notes
- [ ] Status changes persist + the journey re-renders correctly
- [ ] Mobile + desktop layouts both look polished (this is the high bar)
- [ ] Empty states for "no curricula in org" and "no assignment yet" both work
- [ ] No regressions in existing student tabs

**Estimated time: 6-8 hours of focused work.**

---

## 11. After Phase 1 — feedback loop

Before starting Phase 2:

1. Use the editor to build 1-2 real curricula (e.g. Math 8th grade based on what you know teachers cover).
2. Assign to one or two test students.
3. Toggle statuses manually for a few sessions.
4. Notice what feels awkward — that's the input for Phase 2 priorities (unit picker UX, auto-progress rules, suggestion granularity).

---

## 12. Anti-goals — things to push back on

If a new session suggests these, decline:

- **AI-generated default curricula** — explicitly deferred. We're learning what real teachers build.
- **Importing curriculum from a file (Excel, CSV)** — premature. Editor first.
- **Curriculum marketplace** — Q4 deferred.
- **Student progress visible to parents on a separate page** — Phase 3 puts it in reports/yearbook. Don't build another surface.
- **Gamification (badges, XP, levels)** — feels gimmicky for adult teachers. Skip.
- **Auto-master based on N lessons** — Q3 explicitly says manual.
- **Free-form tags on units** (beyond title + description) — keep it lean.

---

## Quick reference for new session prompt

If starting a fresh Claude session, paste this as the kickoff:

> Read `docs/curriculum-plan.md` first. We're starting **Phase 1** of the curriculum feature. Don't re-ask the design questions — they're settled in the doc. Don't seed any default content (Q4). Build the schema, editor, and the journey UI on the Plan tab. The UI is the priority — don't ship a spreadsheet.

Good luck. Build something that feels like progress, not bookkeeping.
