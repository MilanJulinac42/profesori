"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Users,
  CalendarDays,
  Wallet,
  LayoutDashboard,
  Sparkles,
  GraduationCap,
  Settings,
  MessageSquare,
  ClipboardList,
  Mail,
  Loader2,
  Globe,
  Pause,
  CircleSlash,
  CircleDot,
  type LucideIcon,
} from "lucide-react";
import { usePalette } from "./palette-context";
import {
  loadPaletteData,
  type PaletteStudent,
} from "@/lib/palette/data";

type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  keywords?: string[];
};

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, keywords: ["pregled", "home"] },
  { label: "Učenici", href: "/students", icon: Users, keywords: ["lista"] },
  { label: "Raspored", href: "/schedule", icon: CalendarDays, keywords: ["kalendar", "casovi"] },
  { label: "Naplata", href: "/billing", icon: Wallet, keywords: ["uplate", "dug", "duguje"] },
  { label: "Zadaci (AI)", href: "/exercises", icon: ClipboardList, keywords: ["vezbe", "vežbe"] },
  { label: "Poruke", href: "/poruke", icon: MessageSquare, keywords: ["sms", "whatsapp"] },
  { label: "AI Asistent", href: "/asistent", icon: Sparkles, keywords: ["chat", "pitaj"] },
  { label: "Javni profil", href: "/profile", icon: Globe, keywords: ["bio"] },
  { label: "Upiti", href: "/profile/inbox", icon: Mail, keywords: ["booking", "kontakti"] },
  { label: "Podešavanja", href: "/settings", icon: Settings, keywords: ["calendar", "google", "trial"] },
];

const ADD_ITEMS: NavItem[] = [
  { label: "Dodaj učenika", href: "/students/new", icon: Users, keywords: ["novi", "kreiraj"] },
  { label: "Uvezi CSV", href: "/students/import", icon: Users, keywords: ["import", "excel"] },
  { label: "Novi zadatak (AI)", href: "/exercises/new", icon: ClipboardList, keywords: ["generiši"] },
];

const MAX_STUDENT_RESULTS = 8;

function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

function matches(query: string, ...fields: (string | null | undefined)[]) {
  if (!query) return true;
  const q = normalize(query);
  return fields.some((f) => f && normalize(f).includes(q));
}

const STATUS_ICON: Record<PaletteStudent["status"], LucideIcon> = {
  active: CircleDot,
  paused: Pause,
  inactive: CircleSlash,
};

const STATUS_COLOR: Record<PaletteStudent["status"], string> = {
  active: "text-emerald-500",
  paused: "text-amber-500",
  inactive: "text-muted-foreground/60",
};

export function Palette() {
  const { open, setOpen } = usePalette();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [students, setStudents] = useState<PaletteStudent[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Lazy load students the first time the palette opens.
  useEffect(() => {
    if (!open || students !== null) return;
    setLoading(true);
    loadPaletteData()
      .then((d) => setStudents(d.students))
      .catch(() => setStudents([]))
      .finally(() => setLoading(false));
  }, [open, students]);

  // Reset query + focus input when opened.
  useEffect(() => {
    if (open) {
      setQuery("");
      setActiveIdx(0);
      // Defer focus to next tick so the input is mounted.
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [open]);

  // Build a flat list of results across sections for keyboard nav.
  const sections = useMemo(() => {
    const studentMatches = (students ?? [])
      .filter((s) =>
        matches(query, s.full_name, s.parent_name, s.parent_phone, s.grade),
      )
      .slice(0, MAX_STUDENT_RESULTS);

    const navMatches = NAV_ITEMS.filter((n) =>
      matches(query, n.label, ...(n.keywords ?? [])),
    );

    const addMatches = ADD_ITEMS.filter((n) =>
      matches(query, n.label, ...(n.keywords ?? [])),
    );

    return { studentMatches, navMatches, addMatches };
  }, [query, students]);

  const flatItems = useMemo(
    () => [
      ...sections.studentMatches.map((s) => ({
        kind: "student" as const,
        href: `/students/${s.id}`,
        student: s,
      })),
      ...sections.addMatches.map((n) => ({ kind: "nav" as const, item: n })),
      ...sections.navMatches.map((n) => ({ kind: "nav" as const, item: n })),
    ],
    [sections],
  );

  // Clamp activeIdx to results length.
  useEffect(() => {
    if (activeIdx >= flatItems.length) setActiveIdx(0);
  }, [flatItems.length, activeIdx]);

  const navigate = useCallback(
    (href: string) => {
      setOpen(false);
      router.push(href);
    },
    [router, setOpen],
  );

  function onKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(flatItems.length - 1, i + 1));
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(0, i - 1));
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      const item = flatItems[activeIdx];
      if (!item) return;
      navigate(item.kind === "student" ? `/students/${item.student.id}` : item.item.href);
    }
  }

  if (!open) return null;

  let runningIdx = 0;

  return (
    <div
      aria-modal="true"
      role="dialog"
      aria-label="Pretraga"
      onKeyDown={onKeyDown}
      className="fixed inset-0 z-[60] print:hidden"
    >
      <div
        aria-hidden
        onClick={() => setOpen(false)}
        className="absolute inset-0 bg-background/60 backdrop-blur-sm animate-palette-fade"
      />
      <div className="relative z-10 mx-auto mt-[8vh] sm:mt-[12vh] max-w-xl w-[calc(100%-2rem)] rounded-2xl border border-border bg-card shadow-2xl overflow-hidden flex flex-col animate-palette-pop">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <Search className="size-4 text-muted-foreground" strokeWidth={2} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIdx(0);
            }}
            placeholder="Traži učenika ili stranicu… (Esc za izlaz)"
            className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground"
            autoComplete="off"
            spellCheck={false}
          />
          <span className="hidden sm:inline text-[10px] uppercase tracking-[0.12em] font-medium text-muted-foreground border border-border rounded px-1.5 py-0.5">
            ⌘K
          </span>
        </div>

        <div className="max-h-[60vh] overflow-y-auto py-1">
          {loading && students === null && (
            <div className="px-4 py-6 flex items-center justify-center text-xs text-muted-foreground gap-2">
              <Loader2 className="size-3.5 animate-spin" strokeWidth={2} />
              Učitavanje…
            </div>
          )}

          {!loading && flatItems.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              Nema rezultata za <strong>{query}</strong>.
            </div>
          )}

          {sections.studentMatches.length > 0 && (
            <Section title="Učenici">
              {sections.studentMatches.map((s) => {
                const idx = runningIdx++;
                const StatusIcon = STATUS_ICON[s.status];
                return (
                  <Item
                    key={s.id}
                    active={idx === activeIdx}
                    onClick={() => navigate(`/students/${s.id}`)}
                    onMouseEnter={() => setActiveIdx(idx)}
                  >
                    <span className="flex size-8 items-center justify-center rounded-full bg-secondary text-xs font-medium text-foreground shrink-0">
                      {initials(s.full_name)}
                    </span>
                    <span className="flex-1 min-w-0 flex flex-col">
                      <span className="text-sm font-medium truncate inline-flex items-center gap-1.5">
                        {s.full_name}
                        <StatusIcon
                          className={`size-2.5 ${STATUS_COLOR[s.status]}`}
                          strokeWidth={3}
                        />
                      </span>
                      <span className="text-[11px] text-muted-foreground truncate">
                        {[s.grade, s.parent_name, s.parent_phone]
                          .filter(Boolean)
                          .join(" · ") || "—"}
                      </span>
                    </span>
                    <GraduationCap
                      className="size-3.5 text-muted-foreground/50 shrink-0"
                      strokeWidth={1.75}
                    />
                  </Item>
                );
              })}
            </Section>
          )}

          {sections.addMatches.length > 0 && (
            <Section title="Kreiraj">
              {sections.addMatches.map((n) => {
                const idx = runningIdx++;
                const Icon = n.icon;
                return (
                  <Item
                    key={n.href}
                    active={idx === activeIdx}
                    onClick={() => navigate(n.href)}
                    onMouseEnter={() => setActiveIdx(idx)}
                  >
                    <span className="flex size-8 items-center justify-center rounded-lg tile-violet shrink-0">
                      <Icon className="size-4" strokeWidth={2} />
                    </span>
                    <span className="flex-1 text-sm font-medium">{n.label}</span>
                  </Item>
                );
              })}
            </Section>
          )}

          {sections.navMatches.length > 0 && (
            <Section title="Otvori">
              {sections.navMatches.map((n) => {
                const idx = runningIdx++;
                const Icon = n.icon;
                return (
                  <Item
                    key={n.href}
                    active={idx === activeIdx}
                    onClick={() => navigate(n.href)}
                    onMouseEnter={() => setActiveIdx(idx)}
                  >
                    <span className="flex size-8 items-center justify-center rounded-lg bg-secondary shrink-0">
                      <Icon className="size-4" strokeWidth={1.75} />
                    </span>
                    <span className="flex-1 text-sm font-medium">{n.label}</span>
                  </Item>
                );
              })}
            </Section>
          )}
        </div>

        <div className="border-t border-border px-3 py-2 flex items-center justify-between text-[10px] text-muted-foreground">
          <span className="inline-flex items-center gap-2">
            <Kbd>↑</Kbd>
            <Kbd>↓</Kbd>
            navigacija
          </span>
          <span className="inline-flex items-center gap-2">
            <Kbd>Enter</Kbd>
            otvori
          </span>
          <span className="hidden sm:inline-flex items-center gap-2">
            <Kbd>⌘I</Kbd>
            AI asistent
          </span>
          <span className="inline-flex items-center gap-2">
            <Kbd>Esc</Kbd>
            izlaz
          </span>
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="px-1 py-1.5">
      <p className="text-[10px] uppercase tracking-[0.14em] font-semibold text-muted-foreground px-3 pt-2 pb-1.5">
        {title}
      </p>
      <ul>{children}</ul>
    </div>
  );
}

function Item({
  active,
  onClick,
  onMouseEnter,
  children,
}: {
  active: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
  children: React.ReactNode;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        onMouseEnter={onMouseEnter}
        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
          active ? "bg-secondary" : "hover:bg-secondary/60"
        }`}
      >
        {children}
      </button>
    </li>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded border border-border bg-background text-[10px] font-medium tabular-nums">
      {children}
    </kbd>
  );
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("") || "?";
}
