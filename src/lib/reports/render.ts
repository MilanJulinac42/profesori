import { format } from "date-fns";
import { sr } from "date-fns/locale";
import { formatRsd } from "@/lib/money";
import { REPORT_KIND_LABELS } from "./types";
import type { ReportData } from "./types";

/**
 * Render-uje izveštaj kao HTML email — koristi inline CSS za max kompatibilnost
 * (Gmail, Outlook, Apple Mail tretiraju CSS različito).
 */
export function renderReportHtml(data: ReportData): { subject: string; html: string } {
  const subject =
    data.kind === "weekly"
      ? `${REPORT_KIND_LABELS.weekly} — ${data.studentName} — ${data.periodLabel}`
      : `${REPORT_KIND_LABELS.monthly} — ${data.studentName} — ${data.periodLabel}`;

  const greeting = renderGreeting(data);
  const closing = renderClosing(data);

  const html = `<!DOCTYPE html>
<html lang="sr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background:#f6f6f4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1a1a1a;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f6f6f4;padding:24px 0;">
<tr><td align="center">
<table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;width:100%;background:#ffffff;border:1px solid #e5e5e0;border-radius:12px;overflow:hidden;">

<!-- Header -->
<tr><td style="padding:28px 32px 20px 32px;border-bottom:1px solid #efefea;">
  <p style="margin:0 0 4px 0;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:#888;">
    ${escapeHtml(REPORT_KIND_LABELS[data.kind])}
  </p>
  <h1 style="margin:0;font-size:22px;font-weight:600;color:#111;">
    ${escapeHtml(data.studentName)}${data.studentGrade ? ` <span style="font-weight:400;color:#777;font-size:16px;">· ${escapeHtml(data.studentGrade)}</span>` : ""}
  </h1>
  <p style="margin:6px 0 0 0;font-size:13px;color:#666;">
    ${escapeHtml(data.periodLabel)}
  </p>
</td></tr>

<!-- Greeting + AI intro -->
<tr><td style="padding:24px 32px 8px 32px;">
  <p style="margin:0 0 12px 0;font-size:15px;line-height:1.55;color:#1a1a1a;">
    ${escapeHtml(greeting)}
  </p>
  <p style="margin:0;font-size:15px;line-height:1.6;color:#1a1a1a;">
    ${escapeHtml(data.aiIntro)}
  </p>
</td></tr>

<!-- Stats grid -->
<tr><td style="padding:8px 32px 16px 32px;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:16px;">
    <tr>
      ${renderStatCell("Časova održano", String(data.lessonsHeld))}
      ${renderStatCell("Ukupno minuta", String(data.totalMinutes))}
      ${renderStatCell(
        "Prosečna ocena",
        data.avgRating !== null ? `${data.avgRating.toFixed(1)} / 5` : "—",
      )}
    </tr>
  </table>
  ${
    data.lessonsCancelled > 0
      ? `<p style="margin:12px 0 0 0;font-size:13px;color:#888;">Otkazanih / no-show: ${data.lessonsCancelled}</p>`
      : ""
  }
</td></tr>

<!-- Topics -->
${
  data.topTopics.length > 0
    ? `<tr><td style="padding:8px 32px 8px 32px;">
  <p style="margin:0 0 8px 0;font-size:11px;letter-spacing:0.06em;text-transform:uppercase;color:#888;">
    Pokrivene teme
  </p>
  <p style="margin:0;font-size:14px;line-height:1.7;color:#1a1a1a;">
    ${data.topTopics
      .map(
        (t) =>
          `<span style="display:inline-block;background:#f0efe9;border-radius:6px;padding:3px 10px;margin:0 4px 4px 0;font-size:13px;">${escapeHtml(t)}</span>`,
      )
      .join("")}
  </p>
</td></tr>`
    : ""
}

<!-- Per-lesson breakdown (samo ako je mesečni ili nedeljni sa malo časova) -->
${
  data.lessons.filter((l) => l.status === "completed" && l.progress_summary).length > 0
    ? `<tr><td style="padding:16px 32px 8px 32px;">
  <p style="margin:0 0 12px 0;font-size:11px;letter-spacing:0.06em;text-transform:uppercase;color:#888;">
    Detaljnije po časovima
  </p>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
    ${data.lessons
      .filter((l) => l.status === "completed" && l.progress_summary)
      .slice(0, data.kind === "weekly" ? 7 : 20)
      .map((l) => renderLessonRow(l))
      .join("")}
  </table>
</td></tr>`
    : ""
}

<!-- Plan napred -->
${
  data.nextLessonPlan
    ? `<tr><td style="padding:16px 32px 8px 32px;">
  <p style="margin:0 0 8px 0;font-size:11px;letter-spacing:0.06em;text-transform:uppercase;color:#888;">
    Šta sledi
  </p>
  <p style="margin:0;font-size:14px;line-height:1.6;color:#1a1a1a;white-space:pre-wrap;">
    ${escapeHtml(data.nextLessonPlan)}
  </p>
</td></tr>`
    : ""
}

<!-- Naplata -->
${renderBillingBlock(data)}

<!-- Closing -->
<tr><td style="padding:20px 32px 28px 32px;border-top:1px solid #efefea;">
  <p style="margin:0;font-size:14px;line-height:1.6;color:#1a1a1a;">
    ${escapeHtml(closing)}
  </p>
  <p style="margin:8px 0 0 0;font-size:14px;color:#1a1a1a;">
    ${escapeHtml(data.teacherName)}
  </p>
</td></tr>

</table>
<p style="margin:16px auto 0 auto;max-width:600px;font-size:11px;color:#999;text-align:center;">
  Automatski izveštaj iz aplikacije Profesori.
</p>
</td></tr>
</table>
</body>
</html>`;

  return { subject, html };
}

function renderStatCell(label: string, value: string): string {
  return `<td width="33%" align="center" style="padding:12px;background:#f9f9f6;border:1px solid #efefea;border-radius:8px;">
    <div style="font-size:11px;letter-spacing:0.06em;text-transform:uppercase;color:#888;margin-bottom:4px;">${escapeHtml(label)}</div>
    <div style="font-size:22px;font-weight:600;font-variant-numeric:tabular-nums;color:#111;">${escapeHtml(value)}</div>
  </td>`;
}

function renderLessonRow(l: {
  scheduled_at: string;
  duration_minutes: number;
  status: string;
  topics: string[];
  rating: number | null;
  progress_summary: string | null;
}): string {
  const dt = new Date(l.scheduled_at);
  const dateLabel = format(dt, "EEE, d. MMM", { locale: sr });
  const timeLabel = format(dt, "HH:mm");
  return `<tr><td style="padding:8px 0;border-bottom:1px solid #f3f3ee;">
    <div style="font-size:12px;color:#888;">${escapeHtml(dateLabel)} · ${timeLabel} · ${l.duration_minutes} min${l.rating !== null ? ` · ${l.rating}/5` : ""}</div>
    ${l.topics.length > 0 ? `<div style="font-size:12px;color:#666;margin-top:2px;">${escapeHtml(l.topics.join(", "))}</div>` : ""}
    ${l.progress_summary ? `<div style="font-size:14px;color:#1a1a1a;margin-top:4px;line-height:1.5;">${escapeHtml(l.progress_summary)}</div>` : ""}
  </td></tr>`;
}

function renderBillingBlock(data: ReportData): string {
  const hasPaid = data.paidThisPeriod > 0;
  const hasDebt = data.totalDebtNow > 0;
  const hasCredit = data.totalDebtNow < 0;

  if (!hasPaid && !hasDebt && !hasCredit) return "";

  const rows: string[] = [];
  if (hasPaid) {
    rows.push(
      `<tr><td style="padding:6px 0;font-size:14px;color:#666;">Plaćeno u ovom periodu</td><td align="right" style="padding:6px 0;font-size:14px;font-weight:600;color:#1a1a1a;font-variant-numeric:tabular-nums;">${formatRsd(data.paidThisPeriod)}</td></tr>`,
    );
  }
  if (hasDebt) {
    rows.push(
      `<tr><td style="padding:6px 0;font-size:14px;color:#666;">Trenutni dug</td><td align="right" style="padding:6px 0;font-size:14px;font-weight:600;color:#a00;font-variant-numeric:tabular-nums;">${formatRsd(data.totalDebtNow)}</td></tr>`,
    );
  }
  if (hasCredit) {
    rows.push(
      `<tr><td style="padding:6px 0;font-size:14px;color:#666;">Pretplata</td><td align="right" style="padding:6px 0;font-size:14px;font-weight:600;color:#1a1a1a;font-variant-numeric:tabular-nums;">${formatRsd(-data.totalDebtNow)}</td></tr>`,
    );
  }

  return `<tr><td style="padding:16px 32px 8px 32px;">
    <p style="margin:0 0 8px 0;font-size:11px;letter-spacing:0.06em;text-transform:uppercase;color:#888;">Naplata</p>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">${rows.join("")}</table>
  </td></tr>`;
}

function renderGreeting(data: ReportData): string {
  if (data.audience === "student") {
    return `Pozdrav!`;
  }
  // Parent
  if (data.parentName && data.parentName.trim()) {
    return `Poštovani ${data.parentName.trim()},`;
  }
  return `Poštovani,`;
}

function renderClosing(data: ReportData): string {
  return data.audience === "student"
    ? `Vidimo se na sledećem času.`
    : `Hvala na poverenju.`;
}

/* ---------- Plain-text fallback (kratak, koristi se kao Resend "text" verzija) ---------- */

export function renderReportPlainText(data: ReportData): string {
  const lines: string[] = [];
  lines.push(
    data.audience === "parent" && data.parentName
      ? `Poštovani ${data.parentName},`
      : data.audience === "parent"
        ? "Poštovani,"
        : "Pozdrav!",
  );
  lines.push("");
  lines.push(data.aiIntro);
  lines.push("");
  lines.push(`Period: ${data.periodLabel}`);
  lines.push(
    `Časova održano: ${data.lessonsHeld} · Ukupno minuta: ${data.totalMinutes}${data.avgRating !== null ? ` · Prosek: ${data.avgRating.toFixed(1)}/5` : ""}`,
  );
  if (data.lessonsCancelled > 0) {
    lines.push(`Otkazanih / no-show: ${data.lessonsCancelled}`);
  }
  if (data.topTopics.length > 0) {
    lines.push(`Pokrivene teme: ${data.topTopics.join(", ")}`);
  }

  const completedWithSummary = data.lessons.filter(
    (l) => l.status === "completed" && l.progress_summary,
  );
  if (completedWithSummary.length > 0) {
    lines.push("");
    lines.push("Detaljnije po časovima:");
    for (const l of completedWithSummary.slice(
      0,
      data.kind === "weekly" ? 7 : 20,
    )) {
      const dt = new Date(l.scheduled_at);
      lines.push(
        `- ${format(dt, "d. MMM", { locale: sr })}: ${l.progress_summary}`,
      );
    }
  }

  if (data.nextLessonPlan) {
    lines.push("");
    lines.push(`Šta sledi: ${data.nextLessonPlan}`);
  }

  if (data.paidThisPeriod > 0 || data.totalDebtNow !== 0) {
    lines.push("");
    if (data.paidThisPeriod > 0) {
      lines.push(`Plaćeno u ovom periodu: ${formatRsd(data.paidThisPeriod)}`);
    }
    if (data.totalDebtNow > 0) {
      lines.push(`Trenutni dug: ${formatRsd(data.totalDebtNow)}`);
    } else if (data.totalDebtNow < 0) {
      lines.push(`Pretplata: ${formatRsd(-data.totalDebtNow)}`);
    }
  }

  lines.push("");
  lines.push(
    data.audience === "student"
      ? "Vidimo se na sledećem času."
      : "Hvala na poverenju.",
  );
  lines.push(data.teacherName);
  return lines.join("\n");
}

/**
 * Vrlo kratka verzija za WhatsApp deljenje (~300-500 chars).
 * WhatsApp poruke obično se prelistavaju brzo — samo bitno.
 */
export function renderReportShareText(data: ReportData): string {
  const lines: string[] = [];
  const kindLabel =
    data.kind === "weekly" ? "Nedeljni izveštaj" : "Mesečni izveštaj";
  lines.push(`${kindLabel} — ${data.studentName} — ${data.periodLabel}`);
  lines.push("");
  lines.push(data.aiIntro);
  lines.push("");

  const statsLine: string[] = [];
  statsLine.push(`Časova: ${data.lessonsHeld}`);
  if (data.totalMinutes > 0) statsLine.push(`${data.totalMinutes} min`);
  if (data.avgRating !== null) {
    statsLine.push(`prosek ${data.avgRating.toFixed(1)}/5`);
  }
  lines.push(statsLine.join(" · "));

  if (data.topTopics.length > 0) {
    lines.push(`Teme: ${data.topTopics.slice(0, 5).join(", ")}`);
  }

  if (data.nextLessonPlan) {
    lines.push("");
    lines.push(`Sledeći put: ${data.nextLessonPlan}`);
  }

  lines.push("");
  lines.push(`— ${data.teacherName}`);
  return lines.join("\n");
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
