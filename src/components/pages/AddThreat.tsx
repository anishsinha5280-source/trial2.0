import { useState } from "react";
import { useStore } from "../../lib/store";
import type { Severity, Vulnerability } from "../../lib/types";
import { scoreVuln } from "../../lib/risk";
import { SectionLabel } from "../common";
import { fmt } from "../../lib/ui";
import { cn } from "../../utils/cn";

type CritLevel = Severity;

interface CritPreset {
  level: CritLevel;
  label: string;
  desc: string;
  cvss: number;
  epss: number;
  asset: number;
  color: string;
}

// Risk criticality presets — map a human choice onto the composite risk model.
const CRIT_PRESETS: CritPreset[] = [
  {
    level: "CRITICAL",
    label: "Critical",
    desc: "Business-ending, actively exploited",
    cvss: 9.6,
    epss: 0.85,
    asset: 5,
    color: "#DC2626",
  },
  {
    level: "HIGH",
    label: "High",
    desc: "Serious, likely exploitable",
    cvss: 8.0,
    epss: 0.55,
    asset: 4,
    color: "#D97706",
  },
  {
    level: "MEDIUM",
    label: "Medium",
    desc: "Moderate impact / probability",
    cvss: 5.5,
    epss: 0.25,
    asset: 3,
    color: "#2563EB",
  },
  {
    level: "LOW",
    label: "Low",
    desc: "Minor, low urgency",
    cvss: 3.0,
    epss: 0.08,
    asset: 2,
    color: "#6b6862",
  },
];

export function AddThreat() {
  const { addVulnerability, setSelectedCve, setPage, raw } = useStore();

  const [name, setName] = useState("");
  const [timeTaken, setTimeTaken] = useState("2");
  const [crit, setCrit] = useState<CritLevel>("HIGH");
  const [kev, setKev] = useState(false);
  const [internetFacing, setInternetFacing] = useState(false);
  const [description, setDescription] = useState("");
  const [justAdded, setJustAdded] = useState<string | null>(null);

  const preset = CRIT_PRESETS.find((p) => p.level === crit)!;
  const fixTime = Math.max(0.5, parseFloat(timeTaken) || 0.5);

  // Live preview using the exact same engine the optimizer uses.
  const previewVuln: Vulnerability = {
    id: "preview",
    cve: "MANUAL",
    title: name || "New threat",
    description: description || "Manually added threat.",
    cvss: preset.cvss,
    epss: preset.epss,
    kev,
    assetCriticality: preset.asset,
    fixTime,
    internetFacing,
  };
  const previewScored = scoreVuln(previewVuln);

  const canSubmit = name.trim().length > 0 && fixTime > 0;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    const seq = raw.length + 1;
    const cve = `THREAT-${new Date().getFullYear()}-${String(seq).padStart(
      4,
      "0"
    )}`;
    const vuln: Vulnerability = {
      id: `manual-${Date.now()}`,
      cve,
      title: name.trim(),
      description: description.trim() || "Manually added threat.",
      cvss: preset.cvss,
      epss: preset.epss,
      kev,
      assetCriticality: preset.asset,
      fixTime,
      internetFacing,
    };

    addVulnerability(vuln);
    setJustAdded(cve);

    // reset for the next entry
    setName("");
    setTimeTaken("2");
    setCrit("HIGH");
    setKev(false);
    setInternetFacing(false);
    setDescription("");
  }

  function reviewInFindings() {
    if (!justAdded) return;
    setSelectedCve(justAdded);
    setPage("findings");
  }

  return (
    <div className="rounded-3xl border border-line bg-surface p-7">
      <div className="flex items-start justify-between gap-4">
        <div>
          <SectionLabel>Manual Entry</SectionLabel>
          <h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink">
            Add a threat
          </h2>
          <p className="mt-1 max-w-md text-sm text-mute">
            Log a threat by hand. Give it a name, the time it takes to fix, and a
            risk criticality — the engine turns that into a composite risk score
            and ROI.
          </p>
        </div>
        <span
          className="flex h-11 w-11 flex-none items-center justify-center rounded-2xl text-white"
          style={{ backgroundColor: preset.color }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 5v14M5 12h14"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
            />
          </svg>
        </span>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        {/* threat name */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-mute">
            Threat name
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Exposed admin panel"
            className="w-full rounded-xl border border-line bg-canvas px-4 py-3 text-sm text-ink placeholder:text-mute/60 transition focus:border-violet focus:outline-none focus:ring-2 focus:ring-violet/15"
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          {/* time taken */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-mute">
              Time taken to fix (hours)
            </label>
            <div className="relative">
              <input
                type="number"
                min={0.5}
                step={0.5}
                value={timeTaken}
                onChange={(e) => setTimeTaken(e.target.value)}
                className="w-full rounded-xl border border-line bg-canvas px-4 py-3 pr-10 text-sm text-ink transition focus:border-violet focus:outline-none focus:ring-2 focus:ring-violet/15"
              />
              <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-mute">
                h
              </span>
            </div>
          </div>

          {/* quick time pills */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-mute">
              Quick set
            </label>
            <div className="flex flex-wrap gap-1.5">
              {[0.5, 1, 2, 4, 8].map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => setTimeTaken(String(h))}
                  className={cn(
                    "rounded-lg border px-3 py-2 text-xs font-bold transition",
                    fixTime === h
                      ? "border-violet bg-violet text-white"
                      : "border-line bg-canvas text-mute hover:text-ink"
                  )}
                >
                  {h}h
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* risk criticality */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-mute">
            Risk criticality
          </label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {CRIT_PRESETS.map((p) => (
              <button
                key={p.level}
                type="button"
                onClick={() => setCrit(p.level)}
                className={cn(
                  "rounded-2xl border p-3 text-left transition",
                  crit === p.level
                    ? "border-transparent text-white shadow-md"
                    : "border-line bg-canvas text-ink hover:border-ink/30"
                )}
                style={
                  crit === p.level ? { backgroundColor: p.color } : undefined
                }
              >
                <div className="text-sm font-bold">{p.label}</div>
                <div
                  className={cn(
                    "mt-0.5 text-[10px] leading-snug",
                    crit === p.level ? "text-white/80" : "text-mute"
                  )}
                >
                  {p.desc}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* toggles */}
        <div className="flex flex-wrap gap-2.5">
          <Toggle
            active={kev}
            onClick={() => setKev((v) => !v)}
            label="Actively exploited (KEV)"
          />
          <Toggle
            active={internetFacing}
            onClick={() => setInternetFacing((v) => !v)}
            label="Internet-facing"
          />
        </div>

        {/* optional description */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-mute">
            Notes <span className="text-mute/60">(optional)</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="Any extra context about this threat…"
            className="w-full resize-none rounded-xl border border-line bg-canvas px-4 py-3 text-sm text-ink placeholder:text-mute/60 transition focus:border-violet focus:outline-none focus:ring-2 focus:ring-violet/15"
          />
        </div>

        {/* live preview */}
        <div className="rounded-2xl border border-line bg-canvas p-4">
          <div className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-mute">
            Engine preview
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Preview label="Composite risk" value={fmt(previewScored.risk)} accent="#5B3DF5" />
            <Preview label="Fix time" value={`${fixTime}h`} />
            <Preview label="ROI" value={`${fmt(previewScored.roi)}/h`} accent="#16A34A" />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={!canSubmit}
            className={cn(
              "rounded-full px-6 py-3 text-sm font-bold text-white transition",
              canSubmit
                ? "bg-violet shadow-md shadow-violet/25 hover:bg-violet/90"
                : "cursor-not-allowed bg-violet/40"
            )}
          >
            Add threat to workspace
          </button>
          {justAdded && (
            <div className="flex items-center gap-3 text-sm">
              <span className="inline-flex items-center gap-1.5 font-semibold text-emerald">
                <span className="h-2 w-2 rounded-full bg-emerald" />
                Added {justAdded}
              </span>
              <button
                type="button"
                onClick={reviewInFindings}
                className="font-semibold text-violet underline underline-offset-2 hover:no-underline"
              >
                Review in Findings →
              </button>
            </div>
          )}
        </div>
      </form>
    </div>
  );
}

function Toggle({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition",
        active
          ? "border-violet bg-violet/10 text-violet"
          : "border-line bg-canvas text-mute hover:text-ink"
      )}
    >
      <span
        className={cn(
          "flex h-4 w-4 items-center justify-center rounded-full border transition",
          active ? "border-violet bg-violet" : "border-mute/50"
        )}
      >
        {active && (
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
            <path
              d="M5 13l4 4L19 7"
              stroke="white"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </span>
      {label}
    </button>
  );
}

function Preview({
  label,
  value,
  accent = "var(--color-ink)",
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-wider text-mute">
        {label}
      </div>
      <div
        className="mt-0.5 font-display text-2xl font-extrabold tracking-tight"
        style={{ color: accent }}
      >
        {value}
      </div>
    </div>
  );
}
