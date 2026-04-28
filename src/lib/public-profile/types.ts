export type PublicProfile = {
  id: string;
  organization_id: string;
  slug: string;
  display_name: string;
  bio: string | null;
  subjects: string[];
  price_range_text: string | null;
  available_for_new_students: boolean;
  contact_email: string | null;
  photo_url: string | null;
  published: boolean;
  created_at: string;
  updated_at: string;
};

export const COMMON_SUBJECTS = [
  "Matematika",
  "Fizika",
  "Hemija",
  "Biologija",
  "Informatika",
  "Programiranje",
  "Srpski jezik",
  "Engleski jezik",
  "Nemački jezik",
  "Francuski jezik",
  "Italijanski jezik",
  "Ruski jezik",
  "Istorija",
  "Geografija",
  "Muzička kultura",
  "Likovno",
];
