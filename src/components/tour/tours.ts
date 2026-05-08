/**
 * Definicija svih tour-ova u aplikaciji.
 *
 * driver.js handle-uje popover/highlight, a TourProvider handle-uje
 * navigaciju između stranica preko localStorage state-a (tour može da
 * pređe sa /students na /students/[id] i nastavi).
 */

import type { DriveStep } from "driver.js";

export type TourId = "welcome" | "schedule" | "reports";

export type TourStep = DriveStep & {
  /** Putanja na kojoj ovaj korak živi. Ako se razlikuje od trenutne, tour
   * automatski navigira. Default: prva pojava `path` u tour-u, ili tour.entryPath. */
  path?: string;
};

export type Tour = {
  id: TourId;
  label: string;
  description: string;
  /** Stranica na kojoj tour počinje. Ako profesor nije tu, navigiraćemo. */
  entryPath: string;
  steps: TourStep[];
};

export const TOURS: Record<TourId, Tour> = {
  // ============================================================
  // WELCOME — single page na /dashboard
  // ============================================================
  welcome: {
    id: "welcome",
    label: "Glavni tour",
    description: "Brza obilazak svih delova aplikacije.",
    entryPath: "/dashboard",
    steps: [
      {
        path: "/dashboard",
        popover: {
          title: "Dobro došao u Profesori",
          description:
            "Da te brzo provedem kroz glavne delove. Možeš preskočiti u svakom trenutku — ovaj tour je uvek dostupan iz dugmeta „?“ u gornjem desnom uglu.",
        },
      },
      {
        path: "/dashboard",
        element: '[data-tour="nav-students"]',
        popover: {
          title: "Učenici",
          description:
            "Tu dodaješ i upravljaš učenicima — ime, razred, cena po času, email roditelja.",
          side: "right",
          align: "start",
        },
      },
      {
        path: "/dashboard",
        element: '[data-tour="nav-schedule"]',
        popover: {
          title: "Raspored",
          description:
            "Zakaži pojedinačne časove ili recurring serije. Dialog časa ima beleške, AI predloge, glasovne snimke i domaće zadatke.",
          side: "right",
          align: "start",
        },
      },
      {
        path: "/dashboard",
        element: '[data-tour="nav-exercises"]',
        popover: {
          title: "AI generator zadataka",
          description:
            "Generiše matematičke zadatke za bilo koji razred — sa rešenjima i postupcima. Štampaj ili pošalji kao domaći.",
          side: "right",
          align: "start",
        },
      },
      {
        path: "/dashboard",
        element: '[data-tour="nav-billing"]',
        popover: {
          title: "Naplata",
          description:
            "Evidencija plaćanja u kešu. Dug, opomene preko WhatsApp/SMS/Email. Mi ne dirimo finansijski tok — sve je interna evidencija.",
          side: "right",
          align: "start",
        },
      },
      {
        path: "/dashboard",
        element: '[data-tour="app-value"]',
        popover: {
          title: "Šta je app uradio za tebe",
          description:
            "Prati koliko vremena ti app štedi — broj beleški, izveštaja, AI generacija, domaćih. Direktan ROI po nedelji.",
          side: "bottom",
        },
      },
      {
        path: "/dashboard",
        element: '[data-tour="help-button"]',
        popover: {
          title: "Uvek dostupno",
          description:
            "Ovo dugme te svuda u app-u vraća na ovaj ili druge tour-ove. Idemo, lepo je da se zna.",
          side: "left",
        },
      },
    ],
  },

  // ============================================================
  // SCHEDULE — vodi kroz raspored (single page na /schedule)
  // ============================================================
  schedule: {
    id: "schedule",
    label: "Raspored detaljno",
    description: "Zakazivanje časa, recurring, AI predlog za sledeći put.",
    entryPath: "/schedule",
    steps: [
      {
        path: "/schedule",
        popover: {
          title: "Raspored",
          description:
            "Ovde vidiš sve časove. Levo je nedeljni pregled, desno mesec. Možeš birati nedelju strelicama.",
        },
      },
      {
        path: "/schedule",
        element: '[data-tour="schedule-create"]',
        popover: {
          title: "Zakaži čas",
          description:
            "Glavno dugme — otvara dialog za pojedinačni čas ili recurring seriju (npr. ponedeljkom u 17h, 8 puta).",
          side: "bottom",
        },
      },
      {
        path: "/schedule",
        element: '[data-tour="schedule-week"]',
        popover: {
          title: "Nedeljni pregled",
          description:
            "Klikni na prazan slot da zakažeš čas tu. Klikni na postojeći čas da ga otvoriš — tu unosiš beleške, koristiš AI predlog za sledeći put i zadaješ domaći.",
          side: "top",
        },
      },
      {
        path: "/schedule",
        element: '[data-tour="schedule-week"]',
        popover: {
          title: "Posle časa",
          description:
            "Otvoriš čas, snimiš glasovnu belešku ili otkucaš — AI strukturira draft (notes, teme, ocena, plan za sledeći put). Sve to onda hrani izveštaje za roditelje.",
          side: "top",
        },
      },
    ],
  },

  // ============================================================
  // REPORTS — vodi profesora od /students do izveštaja na /students/[id]
  // ============================================================
  reports: {
    id: "reports",
    label: "Izveštaji za roditelje",
    description: "Kako se generišu i šalju nedeljni/mesečni izveštaji.",
    entryPath: "/students",
    steps: [
      {
        path: "/students",
        popover: {
          title: "Lista učenika",
          description:
            "Krećeš odavde. Klikni na bilo kog učenika da vidiš njegov profil — tu su izveštaji, naplata, časovi, beleške. Ako nemaš još učenika, prvo dodaj jednog.",
        },
      },
      {
        path: "/students",
        element: '[data-tour="students-first-row"]',
        popover: {
          title: "Otvori profil učenika",
          description:
            "Klikni „Dalje“ ovde — automatski ćemo otvoriti profil prvog učenika i nastaviti tour.",
          side: "bottom",
        },
      },
      {
        path: "/students/[id]",
        element: '[data-tour="reports-panel"]',
        popover: {
          title: "Panel izveštaja",
          description:
            "Tu su nedeljni i mesečni izveštaji. Klikni „Pregled“ da generišeš + vidiš HTML pre slanja. Klikni „Pošalji“ da ode email-om roditelju.",
          side: "top",
        },
      },
      {
        path: "/students/[id]",
        element: '[data-tour="reports-panel"]',
        popover: {
          title: "Keširanje + regeneracija",
          description:
            "Prvi klik na „Pregled“ generiše + sačuva draft (status „Nacrt“). Sledeći klik vraća keširan — bez novog AI poziva. Klik „Regeneriši“ pravi novu verziju ako su se beleške promenile.",
          side: "top",
        },
      },
    ],
  },
};

export const TOUR_LIST: Tour[] = [
  TOURS.welcome,
  TOURS.schedule,
  TOURS.reports,
];

/** Da li putanja matchuje šablon koraka (path može biti `/students/[id]`). */
export function pathMatches(template: string, actual: string): boolean {
  if (template === actual) return true;
  if (!template.includes("[")) return false;
  // /students/[id] → /students/abc-123 ✓
  const re = new RegExp(
    "^" + template.replace(/\[[^\]]+\]/g, "[^/]+").replace(/\//g, "\\/") + "$",
  );
  return re.test(actual);
}
