"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Upload,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Loader2,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { parseCsv } from "@/lib/csv";
import {
  IMPORT_FIELDS,
  autoMap,
  validateRow,
  type ColumnMapping,
  type ImportFieldKey,
} from "@/lib/students/import";
import { bulkImportStudents } from "@/lib/students/actions";

const PREVIEW_ROWS = 5;
const SAMPLE_CSV = `Ime,Razred,Roditelj,Telefon,Email,Cena,Trajanje,Beleska,Tagovi
Marko Petrović,VIII,Petar Petrović,+381 64 1234567,roditelj@example.com,3000,60,Voli matematiku,prioritet,redovan
Ana Jovanović,V,Milena Jovanović,+381 60 7654321,ana.parent@example.com,2500,45,,prijatelj`;

type Stage = "upload" | "mapping" | "done";

export function ImportWizard() {
  const [stage, setStage] = useState<Stage>("upload");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<ColumnMapping>({});
  const [parseError, setParseError] = useState<string | null>(null);
  const [result, setResult] = useState<{ inserted: number } | null>(null);
  const [pending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  function handleFile(file: File) {
    setParseError(null);
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      const parsed = parseCsv(text);
      if (parsed.headers.length === 0 || parsed.rows.length === 0) {
        setParseError("CSV je prazan ili bez header reda.");
        return;
      }
      setHeaders(parsed.headers);
      setRows(parsed.rows);
      setMapping(autoMap(parsed.headers));
      setStage("mapping");
    };
    reader.onerror = () => setParseError("Greška pri čitanju fajla.");
    reader.readAsText(file, "utf-8");
  }

  const fullNameMappedIdx = useMemo(
    () =>
      Object.entries(mapping).find(([, v]) => v === "full_name")?.[0] ?? null,
    [mapping],
  );

  function setColumnField(colIdx: number, value: ImportFieldKey | null) {
    setMapping((prev) => {
      const next: ColumnMapping = { ...prev };
      // Clear any other column that was previously mapped to this field —
      // each field can only be assigned to one column.
      if (value) {
        for (const k of Object.keys(next)) {
          if (next[Number(k)] === value) next[Number(k)] = null;
        }
      }
      next[colIdx] = value;
      return next;
    });
  }

  function importAll() {
    setParseError(null);
    const validated = rows.map((cells, i) =>
      validateRow(cells, mapping, i + 2 /* header is line 1 */),
    );
    const successful = validated.filter((v) => v.ok);
    const failed = validated.filter((v) => !v.ok);

    if (failed.length === rows.length) {
      setParseError("Nijedan red nije ispravan. Popravi mapiranje ili CSV.");
      return;
    }

    startTransition(async () => {
      const res = await bulkImportStudents(successful.map((v) => v.row));
      if (!res.ok) {
        setParseError(res.error);
        return;
      }
      setResult({ inserted: res.inserted });
      setStage("done");
      router.refresh();
    });
  }

  if (stage === "done" && result) {
    return (
      <div className="card-elevated card-glow rounded-2xl p-6 space-y-4 text-center">
        <div className="inline-flex size-14 items-center justify-center rounded-2xl tile-emerald mx-auto">
          <CheckCircle2 className="size-6" strokeWidth={2} />
        </div>
        <div>
          <h2 className="font-display text-2xl text-foreground">
            Gotovo.
          </h2>
          <p className="text-sm text-muted-foreground mt-1.5">
            Uvezeno {result.inserted}{" "}
            {result.inserted === 1
              ? "učenik"
              : result.inserted < 5
                ? "učenika"
                : "učenika"}
            .
          </p>
        </div>
        <div className="flex items-center justify-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setStage("upload");
              setHeaders([]);
              setRows([]);
              setMapping({});
              setResult(null);
              if (fileInputRef.current) fileInputRef.current.value = "";
            }}
          >
            Uvezi još jedan CSV
          </Button>
          <Button type="button" onClick={() => router.push("/students")}>
            Otvori učenike
            <ArrowRight className="size-3.5 ml-1" strokeWidth={2} />
          </Button>
        </div>
      </div>
    );
  }

  if (stage === "upload") {
    return (
      <div className="space-y-4">
        <label
          htmlFor="csv-file"
          className="block cursor-pointer rounded-2xl border-2 border-dashed border-border bg-card hover:border-brand/40 hover:bg-secondary/30 p-10 text-center transition-colors"
        >
          <input
            ref={fileInputRef}
            id="csv-file"
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />
          <Upload
            className="size-8 mx-auto text-muted-foreground mb-3"
            strokeWidth={1.5}
          />
          <p className="text-sm font-medium">Klikni da izabereš CSV fajl</p>
          <p className="text-xs text-muted-foreground mt-1">
            ili prevuci fajl ovde
          </p>
        </label>

        {parseError && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive inline-flex items-start gap-2">
            <AlertTriangle className="size-4 mt-0.5 shrink-0" strokeWidth={2} />
            {parseError}
          </div>
        )}

        <details className="card-elevated rounded-xl p-4">
          <summary className="text-sm font-medium cursor-pointer inline-flex items-center gap-2">
            <FileText className="size-3.5" strokeWidth={1.75} />
            Kako CSV treba da izgleda?
          </summary>
          <div className="mt-3 space-y-2 text-xs text-muted-foreground">
            <p>
              Prvi red su nazivi kolona. Prepoznajem ove (na srpskom ili
              engleskom):
            </p>
            <ul className="list-disc pl-5 space-y-0.5">
              {IMPORT_FIELDS.map((f) => (
                <li key={f.key}>
                  <span className="text-foreground">{f.label}</span>{" "}
                  {f.required && <span className="text-destructive">(obavezno)</span>}
                </li>
              ))}
            </ul>
            <p className="pt-2">Primer:</p>
            <pre className="bg-background/60 rounded-md p-2.5 overflow-x-auto text-[11px] font-mono leading-snug">
              {SAMPLE_CSV}
            </pre>
          </div>
        </details>
      </div>
    );
  }

  // Mapping stage.
  const validatedPreview = rows.slice(0, PREVIEW_ROWS).map((cells, i) =>
    validateRow(cells, mapping, i + 2),
  );
  const validCount = validatedPreview.filter((v) => v.ok).length;

  return (
    <div className="space-y-5">
      <div className="card-elevated card-glow rounded-xl p-4 space-y-3">
        <h2 className="text-sm font-semibold">Mapiranje kolona</h2>
        <p className="text-xs text-muted-foreground">
          Za svaku kolonu izaberi koje polje učenika sadrži, ili "Preskoči".
          Ime učenika je obavezno.
        </p>
        <div className="overflow-x-auto -mx-1">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-2 py-2 font-medium text-muted-foreground">
                  CSV kolona
                </th>
                <th className="text-left px-2 py-2 font-medium text-muted-foreground">
                  Polje
                </th>
                <th className="text-left px-2 py-2 font-medium text-muted-foreground">
                  Primer
                </th>
              </tr>
            </thead>
            <tbody>
              {headers.map((h, i) => (
                <tr key={i} className="border-b border-border/40">
                  <td className="px-2 py-2 font-medium">{h || `(prazno)`}</td>
                  <td className="px-2 py-2">
                    <select
                      value={mapping[i] ?? ""}
                      onChange={(e) =>
                        setColumnField(
                          i,
                          (e.target.value as ImportFieldKey) || null,
                        )
                      }
                      className="text-xs h-8 px-2 rounded-md border border-border bg-background"
                    >
                      <option value="">Preskoči</option>
                      {IMPORT_FIELDS.map((f) => (
                        <option key={f.key} value={f.key}>
                          {f.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-2 py-2 text-muted-foreground truncate max-w-[200px]">
                    {rows[0]?.[i] ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card-elevated rounded-xl p-4 space-y-2">
        <h2 className="text-sm font-semibold inline-flex items-center gap-2">
          Pregled prvih {Math.min(PREVIEW_ROWS, rows.length)} redova
          <span className="text-[11px] text-muted-foreground font-normal">
            ({validCount} ispravnih, {validatedPreview.length - validCount}{" "}
            sa problemom)
          </span>
        </h2>
        <ul className="space-y-1.5 text-xs">
          {validatedPreview.map((v, i) => (
            <li
              key={i}
              className={
                v.ok
                  ? "flex items-center gap-2"
                  : "flex items-center gap-2 text-destructive"
              }
            >
              {v.ok ? (
                <CheckCircle2
                  className="size-3.5 text-emerald-500 shrink-0"
                  strokeWidth={2}
                />
              ) : (
                <AlertTriangle
                  className="size-3.5 shrink-0"
                  strokeWidth={2}
                />
              )}
              <span className="truncate">
                {v.ok ? v.row.full_name : `Red ${v.lineNumber}: ${v.error}`}
              </span>
            </li>
          ))}
          {rows.length > PREVIEW_ROWS && (
            <li className="text-[11px] text-muted-foreground/70 pt-1">
              … i još {rows.length - PREVIEW_ROWS} {rows.length - PREVIEW_ROWS === 1 ? "red" : "redova"}
            </li>
          )}
        </ul>
      </div>

      {parseError && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive inline-flex items-start gap-2 w-full">
          <AlertTriangle className="size-4 mt-0.5 shrink-0" strokeWidth={2} />
          {parseError}
        </div>
      )}

      <div className="flex items-center justify-between gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setStage("upload");
            setHeaders([]);
            setRows([]);
            setMapping({});
            if (fileInputRef.current) fileInputRef.current.value = "";
          }}
          disabled={pending}
        >
          Vrati se
        </Button>
        <Button
          type="button"
          onClick={importAll}
          disabled={pending || fullNameMappedIdx === null}
        >
          {pending ? (
            <>
              <Loader2 className="size-4 animate-spin" strokeWidth={2} />
              Uvozim…
            </>
          ) : (
            <>
              Uvezi {rows.length}{" "}
              {rows.length === 1 ? "učenika" : "učenika"}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
