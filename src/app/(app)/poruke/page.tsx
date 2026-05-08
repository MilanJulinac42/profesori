import { ArrowLeft, MessageCircle, Sparkles } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { BulkForm } from "./_components/bulk-form";

export default async function PorukePage() {
  const supabase = await createClient();

  const { data: students } = await supabase
    .from("students")
    .select("id, full_name, parent_name, parent_phone, parent_email, status")
    .is("deleted_at", null)
    .eq("status", "active")
    .order("full_name", { ascending: true });

  const list = (students as Array<{
    id: string;
    full_name: string;
    parent_name: string | null;
    parent_phone: string | null;
    parent_email: string | null;
    status: string;
  }> | null) ?? [];

  return (
    <div className="px-4 sm:px-8 py-6 space-y-6 max-w-4xl mx-auto w-full">
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard"
          className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5"
        >
          <ArrowLeft className="size-3.5" strokeWidth={1.75} />
          Nazad
        </Link>
      </div>

      <header className="space-y-2 pb-4 border-b border-border">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-medium tracking-tight inline-flex items-center gap-2">
              <MessageCircle className="size-5" strokeWidth={1.75} />
              Bulk poruke
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Pošalji istu poruku većem broju učenika/roditelja jednim klikom.
              Otvara svaki WhatsApp razgovor u novom tab-u sa pre-popunjenim
              tekstom.
            </p>
          </div>
          <Link
            href="/poruke/parser"
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background hover:bg-secondary text-sm h-9 px-3 shrink-0"
          >
            <Sparkles className="size-3.5" strokeWidth={2} />
            AI parser poruka
          </Link>
        </div>
      </header>

      {list.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-secondary/20 p-10 text-center">
          <p className="text-sm text-muted-foreground">
            Nemaš aktivnih učenika. Dodaj prvog pa se vrati ovde.
          </p>
        </div>
      ) : (
        <BulkForm students={list} />
      )}
    </div>
  );
}
