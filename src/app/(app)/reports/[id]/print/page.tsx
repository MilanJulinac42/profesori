import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getReportLog } from "@/lib/reports/queries";
import { AutoPrint } from "@/components/auto-print";

/**
 * Print verzija sačuvanog izveštaja.
 * Renderuje sadržaj <body> iz `html_body` direktno u stranicu (bez iframe-a) —
 * inline CSS u email-u radi i u browser print kontekstu, a sidebar/topbar
 * imaju `print:hidden` u (app) layout-u.
 */
export default async function ReportPrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const log = await getReportLog(supabase, id);

  if (!log) notFound();

  const inner = extractBodyInner(log.html_body);

  return (
    <div className="bg-white print:bg-white min-h-full">
      <AutoPrint />
      <div
        // Email HTML koristi inline stilove → bezbedno za render-ovanje.
        dangerouslySetInnerHTML={{ __html: inner }}
      />
    </div>
  );
}

/**
 * Ekstraktuje sadržaj između <body>...</body> iz sačuvanog HTML email-a.
 * Ako ne nađe <body>, vraća ceo string (fallback).
 */
function extractBodyInner(html: string): string {
  const match = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  return match ? match[1] : html;
}
