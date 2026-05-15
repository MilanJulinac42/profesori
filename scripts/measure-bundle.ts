/**
 * Measures First Load JS per route by reading per-route build manifests
 * produced by `next build`. Run AFTER a build.
 *
 *   npm run build && npm run measure
 *
 * Output: docs/bundle-baseline.txt (and console).
 */
import { promises as fs } from "node:fs";
import path from "node:path";

const NEXT_DIR = path.resolve(".next");
const APP_DIR = path.join(NEXT_DIR, "server", "app");
const STATIC_DIR = path.join(NEXT_DIR, "static");

type RouteMeasurement = {
  route: string;
  chunkCount: number;
  totalBytes: number;
  pageChunks: { file: string; bytes: number }[];
};

async function fileSize(rel: string): Promise<number> {
  try {
    const s = await fs.stat(path.join(NEXT_DIR, rel));
    return s.size;
  } catch {
    return 0;
  }
}

async function walk(dir: string, acc: string[] = []): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) await walk(full, acc);
    else if (e.name === "page_client-reference-manifest.js") acc.push(full);
  }
  return acc;
}

function manifestToRoute(manifestPath: string): string {
  // .next/server/app/(app)/dashboard/page_client-reference-manifest.js → /dashboard
  const rel = path
    .relative(APP_DIR, manifestPath)
    .replace(/\\/g, "/")
    .replace(/(^|\/)page_client-reference-manifest\.js$/, "")
    .replace(/\([^)]+\)\//g, ""); // strip route groups like (app)
  return rel === "" ? "/" : "/" + rel;
}

async function main() {
  const manifestFiles = await walk(APP_DIR);
  const rootManifest = JSON.parse(
    await fs.readFile(path.join(NEXT_DIR, "build-manifest.json"), "utf8"),
  );
  const rootMain: string[] = rootManifest.rootMainFiles ?? [];

  const rootBytes = (
    await Promise.all(rootMain.map((f) => fileSize(f)))
  ).reduce((a, b) => a + b, 0);
  const rootSet = new Set(rootMain);

  const measurements: RouteMeasurement[] = [];
  for (const m of manifestFiles) {
    const route = manifestToRoute(m);
    const content = await fs.readFile(m, "utf8");
    const matches = content.match(/static\/chunks\/[^"'\\]+\.js/g) ?? [];
    const pageChunks = Array.from(new Set(matches)).filter(
      (c) => !rootSet.has(c),
    );
    const sizes = await Promise.all(pageChunks.map((c) => fileSize(c)));
    const pageBytes = sizes.reduce((a, b) => a + b, 0);
    const pageChunkInfo = pageChunks
      .map((file, i) => ({ file, bytes: sizes[i] }))
      .sort((a, b) => b.bytes - a.bytes);
    measurements.push({
      route,
      chunkCount: rootMain.length + pageChunks.length,
      totalBytes: rootBytes + pageBytes,
      pageChunks: pageChunkInfo,
    });
  }

  measurements.sort((a, b) => b.totalBytes - a.totalBytes);

  const fmt = (n: number) =>
    n >= 1024 * 1024
      ? `${(n / 1024 / 1024).toFixed(2)} MB`
      : `${(n / 1024).toFixed(1)} KB`;

  let totalStaticBytes = 0;
  const chunksDir = path.join(STATIC_DIR, "chunks");
  try {
    const files = await fs.readdir(chunksDir);
    for (const f of files) {
      if (f.endsWith(".js")) {
        const s = await fs.stat(path.join(chunksDir, f));
        totalStaticBytes += s.size;
      }
    }
  } catch {}

  const lines: string[] = [];
  lines.push(`# Bundle baseline — ${new Date().toISOString()}`);
  lines.push("");
  lines.push(`Total static/chunks JS: ${fmt(totalStaticBytes)}`);
  lines.push(`Root main shared JS:    ${fmt(rootBytes)}  (${rootMain.length} chunks)`);
  lines.push("");
  lines.push("Per-route First Load JS (root main + page chunks, uncompressed):");
  lines.push("");
  lines.push("ROUTE                              CHUNKS    SIZE");
  lines.push("─".repeat(60));
  for (const m of measurements) {
    lines.push(
      `${m.route.padEnd(34)} ${String(m.chunkCount).padStart(6)}  ${fmt(m.totalBytes).padStart(10)}`,
    );
  }

  // Top chunk breakdown for heaviest 3 routes
  const topRoutes = measurements.slice(0, 3);
  for (const r of topRoutes) {
    lines.push("");
    lines.push(`Top page chunks for ${r.route}:`);
    for (const c of r.pageChunks.slice(0, 8)) {
      lines.push(`  ${fmt(c.bytes).padStart(10)}  ${c.file}`);
    }
  }

  const out = lines.join("\n");
  console.log(out);

  const outPath = path.join("docs", "bundle-baseline.txt");
  await fs.mkdir("docs", { recursive: true });
  await fs.writeFile(outPath, out + "\n", "utf8");
  console.log(`\nWritten: ${outPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
