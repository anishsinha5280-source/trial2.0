import { useRef, useState } from "react";
import { useStore } from "../../lib/store";
import type { Vulnerability } from "../../lib/types";
import { SectionLabel } from "../common";
import { demoVulnerabilities } from "../../data/demo";
import { AddThreat } from "./AddThreat";
import { cn } from "../../utils/cn";

type ImportMode = "file" | "manual";

interface ParseOutcome {
  vulns: Vulnerability[];
  total: number;
  valid: number;
  warnings: number;
}

export function Import() {
  const { importData, loadDemo, setPage } = useStore();
  const [mode, setMode] = useState<ImportMode>("file");
  const [drag, setDrag] = useState(false);
  const [summary, setSummary] = useState<ParseOutcome | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function num(v: unknown, fallback = 0): number {
    const n = typeof v === "string" ? parseFloat(v) : (v as number);
    return isNaN(n) ? fallback : n;
  }
  function bool(v: unknown): boolean {
    if (typeof v === "boolean") return v;
    const s = String(v).toLowerCase().trim();
    return s === "true" || s === "yes" || s === "1";
  }

  function normalize(rows: Record<string, unknown>[]): ParseOutcome {
    let warnings = 0;
    const vulns: Vulnerability[] = [];
    rows.forEach((r, i) => {
      const cvss = num(r.cvss ?? r.CVSS);
      const hasCore = (r.cve ?? r.CVE) && cvss > 0;
      if (!hasCore) warnings++;
      vulns.push({
        id: `imp-${i}`,
        cve: String(r.cve ?? r.CVE ?? `CVE-UNKNOWN-${i}`),
        title: String(r.title ?? r.name ?? "Untitled finding"),
        description: String(r.description ?? r.desc ?? "No description provided."),
        cvss: Math.min(10, Math.max(0, cvss || 5)),
        epss: Math.min(1, Math.max(0, num(r.epss ?? r.EPSS, 0.1))),
        kev: bool(r.kev ?? r.KEV),
        assetCriticality: Math.min(
          5,
          Math.max(1, num(r.assetCriticality ?? r.asset ?? 3, 3))
        ),
        fixTime: Math.max(0.5, num(r.fixTime ?? r.effort ?? r.hours, 1)),
        internetFacing: bool(r.internetFacing ?? r.internet),
      });
    });
    return {
      vulns,
      total: rows.length,
      valid: rows.length - warnings,
      warnings,
    };
  }

  function parseCSV(text: string): Record<string, unknown>[] {
    const lines = text.trim().split(/\r?\n/);
    if (lines.length < 2) return [];
    const headers = lines[0].split(",").map((h) => h.trim());
    return lines.slice(1).map((line) => {
      const cells = line.split(",");
      const obj: Record<string, unknown> = {};
      headers.forEach((h, i) => (obj[h] = cells[i]?.trim()));
      return obj;
    });
  }

  async function handleFile(file: File) {
    setError(null);
    try {
      const text = await file.text();
      let rows: Record<string, unknown>[];
      if (file.name.endsWith(".json") || text.trim().startsWith("[")) {
        const parsed = JSON.parse(text);
        rows = Array.isArray(parsed) ? parsed : parsed.findings ?? [];
      } else {
        rows = parseCSV(text);
      }
      if (rows.length === 0) {
        setError("No findings detected in that file.");
        return;
      }
      setSummary(normalize(rows));
    } catch {
      setError("Could not parse that file. Expecting CSV or JSON.");
    }
  }

  function confirmImport() {
    if (!summary) return;
    importData(summary.vulns, {
      total: summary.total,
      valid: summary.valid,
      warnings: summary.warnings,
    });
    setPage("overview");
  }

  function useDemo() {
    // preview the demo summary with animation
    setSummary({
      vulns: demoVulnerabilities,
      total: 52,
      valid: 48,
      warnings: 4,
    });
    loadDemo();
  }

  return (
    <div className="mx-auto max-w-[820px] px-6 pb-24 pt-16">
      <div className="text-center">
        <SectionLabel>Data Operation</SectionLabel>
        <h1 className="mx-auto mt-3 max-w-lg font-display text-5xl font-extrabold leading-tight tracking-tight text-ink">
          Bring your findings
        </h1>
        <p className="mt-3 text-mute">
          Import scanner output, or log a threat by hand — either way the
          engine decides what to fix.
        </p>
      </div>

      {/* mode tabs */}
      <div className="mx-auto mt-8 grid max-w-sm grid-cols-2 rounded-full border border-line bg-surface p-1">
        <button
          onClick={() => setMode("file")}
          className={cn(
            "rounded-full px-4 py-2 text-sm font-bold transition",
            mode === "file" ? "bg-ink text-canvas" : "text-mute"
          )}
        >
          Import file
        </button>
        <button
          onClick={() => setMode("manual")}
          className={cn(
            "rounded-full px-4 py-2 text-sm font-bold transition",
            mode === "manual" ? "bg-violet text-white" : "text-mute"
          )}
        >
          Add a threat
        </button>
      </div>

      {mode === "manual" && (
        <div className="mt-8">
          <AddThreat />
        </div>
      )}

      {mode === "file" && (
      <>
      {/* drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          const f = e.dataTransfer.files?.[0];
          if (f) handleFile(f);
        }}
        className={`mt-10 flex flex-col items-center justify-center rounded-3xl border-2 border-dashed p-14 text-center transition ${
          drag
            ? "border-violet bg-violet/[0.05]"
            : "border-line bg-surface"
        }`}
      >
        <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-violet/10 text-violet">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 16V4m0 0L7 9m5-5l5 5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </span>
        <p className="mt-5 text-lg font-bold text-ink">
          Drag &amp; drop CSV / JSON
        </p>
        <p className="mt-1 text-sm text-mute">or</p>
        <button
          onClick={() => inputRef.current?.click()}
          className="mt-2 rounded-full bg-ink px-6 py-2.5 text-sm font-semibold text-canvas transition hover:opacity-90"
        >
          Browse files
        </button>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.json,application/json,text/csv"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />

        <div className="mt-8 flex items-center gap-3 text-sm text-mute">
          <span className="h-px w-10 bg-line" />
          or explore the demo dataset
          <span className="h-px w-10 bg-line" />
        </div>
        <button
          onClick={useDemo}
          className="mt-3 rounded-full border border-violet px-6 py-2.5 text-sm font-bold text-violet transition hover:bg-violet hover:text-white"
        >
          Load Demo Findings
        </button>
      </div>

      {error && (
        <div className="mt-4 rounded-2xl border border-crimson/30 bg-crimson/[0.05] p-4 text-sm font-medium text-crimson">
          {error}
        </div>
      )}

      {/* animated import summary */}
      {summary && (
        <div className="mt-8 animate-floatUp rounded-3xl border border-line bg-surface p-8">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-bold tracking-tight text-ink">
              Import summary
            </h2>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald/10 px-3 py-1 text-xs font-bold text-emerald">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald" /> Ready
            </span>
          </div>
          <div className="mt-6 grid grid-cols-3 gap-4">
            <SummaryStat value={summary.total} label="findings" color="var(--color-ink)" delay={0} />
            <SummaryStat value={summary.valid} label="valid" color="#16A34A" delay={0.12} />
            <SummaryStat value={summary.warnings} label="warnings" color="#D97706" delay={0.24} />
          </div>
          <button
            onClick={confirmImport}
            className="mt-8 w-full rounded-2xl bg-violet py-3.5 text-sm font-bold text-white transition hover:bg-violet/90"
          >
            Use these findings →
          </button>
        </div>
      )}
      </>
      )}
    </div>
  );
}

function SummaryStat({
  value,
  label,
  color,
  delay,
}: {
  value: number;
  label: string;
  color: string;
  delay: number;
}) {
  return (
    <div
      className="rounded-2xl border border-line bg-canvas p-5 text-center"
      style={{ animation: `countPulse 0.6s ${delay}s both` }}
    >
      <div
        className="font-display text-4xl font-extrabold tracking-tight"
        style={{ color }}
      >
        {value}
      </div>
      <div className="mt-1 text-xs font-semibold uppercase tracking-wider text-mute">
        {label}
      </div>
    </div>
  );
}
