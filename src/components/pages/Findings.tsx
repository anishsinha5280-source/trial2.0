import { useMemo, useState } from "react";
import { useStore } from "../../lib/store";
import type { ScoredVuln } from "../../lib/types";
import { KevChip, SectionLabel, SeverityBadge } from "../common";
import { RiskComposition } from "../viz/RiskComposition";
import { fmt } from "../../lib/ui";
import { selectionReason, deferralReason } from "../../lib/risk";
import { cn } from "../../utils/cn";

type Filter = "all" | "critical" | "kev" | "selected";

export function Findings() {
  const { scored, result, selectedCve, setSelectedCve } = useStore();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const selectedIds = useMemo(
    () => new Set(result.selected.map((v) => v.id)),
    [result]
  );

  const list = useMemo(() => {
    let l = [...scored].sort((a, b) => b.roi - a.roi);
    if (filter === "critical") l = l.filter((v) => v.severity === "CRITICAL");
    if (filter === "kev") l = l.filter((v) => v.kev);
    if (filter === "selected") l = l.filter((v) => selectedIds.has(v.id));
    if (query.trim()) {
      const q = query.toLowerCase();
      l = l.filter(
        (v) =>
          v.cve.toLowerCase().includes(q) ||
          v.title.toLowerCase().includes(q) ||
          v.description.toLowerCase().includes(q)
      );
    }
    return l;
  }, [scored, filter, query, selectedIds]);

  const active =
    scored.find((v) => v.cve === selectedCve) ?? list[0] ?? scored[0];

  const filters: { id: Filter; label: string }[] = [
    { id: "all", label: "All" },
    { id: "critical", label: "Critical" },
    { id: "kev", label: "KEV" },
    { id: "selected", label: "Selected" },
  ];

  return (
    <div className="mx-auto max-w-[1240px] px-6 pb-24 pt-10">
      <div className="mb-8">
        <SectionLabel>Investigation</SectionLabel>
        <h1 className="mt-1 font-display text-4xl font-extrabold tracking-tight text-ink">
          Findings
        </h1>
        <p className="mt-2 max-w-2xl text-mute">
          Every finding is an intelligence record. Select one to open its full
          risk profile.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        {/* LEFT list */}
        <div className="flex flex-col rounded-3xl border border-line bg-surface p-3">
          <div className="p-2">
            <div className="relative">
              <svg
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-mute"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
                <path d="M21 21l-4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search CVE, title, keyword…"
                className="w-full rounded-xl border border-line bg-canvas py-2.5 pl-9 pr-3 text-sm text-ink placeholder:text-mute focus:border-ink focus:outline-none"
              />
            </div>
            <div className="mt-3 flex gap-1.5">
              {filters.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  className={cn(
                    "flex-1 rounded-lg px-2 py-1.5 text-xs font-semibold transition",
                    filter === f.id
                      ? "bg-ink text-canvas"
                      : "bg-canvas text-mute hover:text-ink"
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="scroll-thin mt-1 max-h-[640px] overflow-y-auto pr-1">
            {list.map((v) => (
              <button
                key={v.id}
                onClick={() => setSelectedCve(v.cve)}
                className={cn(
                  "mb-1.5 w-full rounded-2xl border p-3 text-left transition",
                  active?.id === v.id
                    ? "border-ink bg-violet/[0.04] ring-1 ring-violet/20"
                    : "border-transparent hover:border-line hover:bg-canvas"
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[11px] font-semibold text-mute">
                    {v.cve}
                  </span>
                  <SeverityBadge severity={v.severity} />
                </div>
                <div className="mt-1 truncate text-sm font-semibold text-ink">
                  {v.title}
                </div>
                <div className="mt-2 flex items-center gap-3 text-[11px] font-medium text-mute">
                  <span>
                    Risk{" "}
                    <span className="font-bold text-ink">{fmt(v.risk)}</span>
                  </span>
                  <span>
                    Fix <span className="font-bold text-ink">{v.fixTime}h</span>
                  </span>
                  <span>
                    ROI{" "}
                    <span className="font-bold text-emerald">{fmt(v.roi)}/h</span>
                  </span>
                  {selectedIds.has(v.id) && (
                    <span className="ml-auto h-2 w-2 rounded-full bg-emerald" />
                  )}
                </div>
              </button>
            ))}
            {list.length === 0 && (
              <div className="p-8 text-center text-sm text-mute">
                No findings match your search.
              </div>
            )}
          </div>
        </div>

        {/* RIGHT profile */}
        {active && (
          <VulnProfile
            key={active.id}
            v={active}
            selected={selectedIds.has(active.id)}
          />
        )}
      </div>
    </div>
  );
}

function VulnProfile({ v, selected }: { v: ScoredVuln; selected: boolean }) {
  const { removeVulnerability, setSelectedCve } = useStore();
  const isManual = v.id.startsWith("manual-");
  return (
    <div className="animate-floatUp rounded-3xl border border-line bg-surface p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-semibold text-mute">
              {v.cve}
            </span>
            {v.kev && <KevChip />}
            {v.internetFacing && (
              <span className="rounded-full bg-blue/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue">
                Internet-facing
              </span>
            )}
            {isManual && (
              <span className="rounded-full bg-violet/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-mute">
                Manual entry
              </span>
            )}
          </div>
          <h2 className="mt-2 max-w-xl font-display text-3xl font-extrabold leading-tight tracking-tight text-ink">
            {v.title}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <SeverityBadge severity={v.severity} className="px-3 py-1 text-xs" />
          {isManual && (
            <button
              onClick={() => {
                setSelectedCve(null);
                removeVulnerability(v.id);
              }}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-line text-mute transition hover:border-crimson/40 hover:text-crimson"
              title="Remove this manually-added threat"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                <path d="M4 7h16M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2m-8 0v12a1 1 0 001 1h6a1 1 0 001-1V7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}
        </div>
      </div>

      <p className="mt-4 max-w-2xl leading-relaxed text-mute">
        {v.description}
      </p>

      <Divider label="Risk Composition" />
      <RiskComposition v={v} />

      <Divider label="Remediation" />
      <div className="grid grid-cols-3 gap-4">
        <Metric label="Estimated effort" value={`${v.fixTime}h`} />
        <Metric label="Risk reduction" value={fmt(v.riskReduction)} accent="#5B3DF5" />
        <Metric label="ROI" value={`${fmt(v.roi)}/h`} accent="#16A34A" />
      </div>

      <Divider label="Optimization Status" />
      <div
        className={cn(
          "flex items-start gap-4 rounded-2xl border p-5",
          selected
            ? "border-emerald/30 bg-emerald/[0.06]"
            : "border-line bg-canvas"
        )}
      >
        <span
          className={cn(
            "mt-0.5 flex h-10 w-10 flex-none items-center justify-center rounded-full text-white",
            selected ? "bg-emerald" : "bg-mute/70"
          )}
        >
          {selected ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
            </svg>
          )}
        </span>
        <div>
          <div
            className={cn(
              "font-display text-xl font-bold",
              selected ? "text-emerald" : "text-ink"
            )}
          >
            {selected ? "Selected" : "Deferred"}
          </div>
          <p className="mt-1 max-w-lg text-sm text-mute">
            {selected ? selectionReason(v) : deferralReason(v)}
          </p>
        </div>
      </div>
    </div>
  );
}

function Divider({ label }: { label: string }) {
  return (
    <div className="my-7 flex items-center gap-3">
      <SectionLabel>{label}</SectionLabel>
      <span className="h-px flex-1 bg-line" />
    </div>
  );
}

function Metric({
  label,
  value,
  accent = "var(--color-ink)",
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="rounded-2xl border border-line bg-canvas p-4">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-mute">
        {label}
      </div>
      <div
        className="mt-1 font-display text-3xl font-extrabold tracking-tight"
        style={{ color: accent }}
      >
        {value}
      </div>
    </div>
  );
}
