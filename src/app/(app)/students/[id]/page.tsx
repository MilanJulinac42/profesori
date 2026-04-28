import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Pencil,
  Mail,
  Phone,
  School,
  GraduationCap,
  Banknote,
  CalendarDays,
  StickyNote,
  Archive,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { formatRsd } from "@/lib/money";
import { STATUS_LABELS, type Student } from "@/lib/students/types";
import { archiveStudent } from "@/lib/students/actions";

export default async function StudentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("students")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (error || !data) notFound();
  const s = data as Student;

  return (
    <div className="px-4 sm:px-8 py-6 space-y-8 max-w-6xl mx-auto w-full">
      <div className="flex items-center justify-between">
        <Link
          href="/students"
          className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5"
        >
          <ArrowLeft className="size-3.5" strokeWidth={1.75} />
          Nazad na učenike
        </Link>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 pb-6 border-b border-border">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-medium tracking-tight">{s.full_name}</h1>
            <Badge variant={s.status === "active" ? "default" : "secondary"} className="font-normal">
              {STATUS_LABELS[s.status]}
            </Badge>
          </div>
          {s.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {s.tags.map((t) => (
                <span
                  key={t}
                  className="text-[11px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground"
                >
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/students/${s.id}/edit`}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            <Pencil className="size-3.5" strokeWidth={1.75} />
            Izmeni
          </Link>
          <form action={archiveStudent.bind(null, s.id)}>
            <button
              type="submit"
              className={buttonVariants({ variant: "ghost", size: "sm" })}
            >
              <Archive className="size-3.5" strokeWidth={1.75} />
              Arhiviraj
            </button>
          </form>
        </div>
      </div>

      {/* Stat strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat label="Dug" value="0 RSD" icon={Banknote} hint="—" />
        <Stat label="Časova ukupno" value="0" icon={CalendarDays} hint="—" />
        <Stat label="Sledeći čas" value="—" icon={CalendarDays} hint="Nije zakazan" />
        <Stat
          label="Cena po času"
          value={
            s.default_price_per_lesson > 0
              ? formatRsd(s.default_price_per_lesson)
              : "—"
          }
          icon={Banknote}
          hint="Default"
        />
      </div>

      {/* Body grid */}
      <div className="grid lg:grid-cols-[1fr_320px] gap-6">
        <div className="space-y-6 min-w-0">
          {/* Tabs placeholder — will hold lessons / payments / notes when those features land */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="text-sm font-medium">Časovi</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Časovi će se pojaviti ovde kad ih zakažeš za ovog učenika.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="text-sm font-medium">Beleške posle časova</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Posle svakog završenog časa, beleške ti dolaze ovde.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="text-sm font-medium">Uplate</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Evidencija svih uplata će biti ovde.
            </p>
          </div>
        </div>

        {/* Side panel: details */}
        <aside className="space-y-6">
          <Panel title="Škola">
            <Row icon={GraduationCap} label="Razred" value={s.grade} />
            <Row icon={School} label="Škola" value={s.school} />
          </Panel>
          <Panel title="Roditelj">
            <Row label="Ime" value={s.parent_name} />
            <Row icon={Phone} label="Telefon" value={s.parent_phone} />
            <Row icon={Mail} label="Email" value={s.parent_email} />
          </Panel>
          {s.notes && (
            <Panel title="Beleška o učeniku" icon={StickyNote}>
              <p className="text-sm whitespace-pre-wrap leading-relaxed">
                {s.notes}
              </p>
            </Panel>
          )}
        </aside>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  icon: Icon,
  hint,
}: {
  label: string;
  value: string;
  icon: typeof Banknote;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="size-3.5" strokeWidth={1.75} />
        <span className="text-xs">{label}</span>
      </div>
      <div className="text-xl font-medium tracking-tight tabular-nums mt-2">
        {value}
      </div>
      {hint && <p className="text-xs text-muted-foreground mt-0.5">{hint}</p>}
    </div>
  );
}

function Panel({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon?: typeof Banknote;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h3 className="text-xs uppercase tracking-wider text-muted-foreground inline-flex items-center gap-1.5 mb-3">
        {Icon && <Icon className="size-3" strokeWidth={2} />}
        {title}
      </h3>
      <div className="space-y-2.5">{children}</div>
    </div>
  );
}

function Row({
  icon: Icon,
  label,
  value,
}: {
  icon?: typeof Banknote;
  label: string;
  value: string | null;
}) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-2 text-sm">
      {Icon && (
        <Icon
          className="size-3.5 text-muted-foreground mt-0.5 shrink-0"
          strokeWidth={1.75}
        />
      )}
      <div className="min-w-0 flex-1">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="font-medium break-words">{value}</div>
      </div>
    </div>
  );
}
