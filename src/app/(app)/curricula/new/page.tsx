import { createCurriculumAction } from "@/lib/curriculum/actions";

// Single-purpose route: trigger the create-action and redirect.
// Hit by direct link / future onboarding flows.
export default async function NewCurriculumPage() {
  await createCurriculumAction();
  return null;
}
