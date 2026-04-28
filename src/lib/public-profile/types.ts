export type PublicProfile = {
  id: string;
  organization_id: string;
  slug: string;
  display_name: string;
  bio: string | null;
  subjects: string[];
  levels: string[];
  specialties: string[];
  formats: string[];
  years_experience: string | null;
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
  "Španski jezik",
  "Istorija",
  "Geografija",
  "Muzička kultura",
  "Likovno",
  "Ekonomija",
  "Statistika",
  "Filozofija",
];

export const COMMON_LEVELS = [
  "Niži razredi OŠ",
  "Viši razredi OŠ",
  "Gimnazija",
  "Srednja stručna škola",
  "Fakultet",
  "Odrasli",
  "Predškolski uzrast",
];

export const COMMON_SPECIALTIES = [
  "Priprema za malu maturu",
  "Priprema za veliku maturu",
  "Priprema za prijemni ispit",
  "Olimpijade i takmičenja",
  "Domaći zadaci",
  "Dopunska nastava",
  "Učenje sa decom sa smetnjama",
  "Cambridge",
  "IELTS",
  "TOEFL",
  "DELF",
  "DELE",
  "Goethe",
  "ECDL",
  "Razgovorne vežbe",
  "Poslovni jezik",
];

export const COMMON_FORMATS = [
  "Online (Zoom / Meet)",
  "Uživo kod profesora",
  "Profesor dolazi kući",
  "Hibridno",
  "Grupni časovi",
  "Individualni časovi",
];
