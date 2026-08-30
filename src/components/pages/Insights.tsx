import { useState } from "react";
import { useStore } from "../../lib/store";
import { SlopeChart } from "../viz/SlopeChart";
import { MethodBars } from "../viz/MethodBars";
import { SectionLabel } from "../common";
import { fmt } from "../../lib/ui";
import { cn } from "../../utils/cn";

type NodeId =
  | "vuln"
  | "risk"
  | "effort"
  | "time"
  | "optimization"
  | "plan";

interface NodeDef {
  id: NodeId;
  label: string;
  color: string;
  detail: { heading: string; items: string[]; note: string };
}

export function Insights() {
  const { result, baseline, topDown, scored, budget } = useStore();
  const [openNode, setOpenNode] = useState<NodeId>("risk");

  const nodes: NodeDef[] = [
    {
      id: "vuln",
      label: "Vulnerability",
      color: "#2563EB",
      detail: {
        heading: "The raw finding",
        items: [
          `${scored.length} findings imported from the scanner`,
          "Each carries CVE, title, description and metadata",
          "This is the input — not the decision",
        ],
        note: "The scanner tells us what exists. It does not tell us what to fix first.",
      },
    },
    {
      id: "risk",
      label: "Risk",
      color: "#5B3DF5",
      detail: {
        heading: "Composite risk model",
        items: [
          "CVSS — technical severity (0–10)",
          "EPSS — probability of exploitation",
          "CISA KEV — confirmed active exploitation",
          "Asset Criticality — business impact",
        ],
        note: "These four signals combine into a single 0–100 risk score per finding.",
      },
    },
    {
      id: "effort",
      label: "Effort",
      color: "#D97706",
      detail: {
        heading: "Remediation cost",
        items: [
          "Each fix has an estimated engineering effort in hours",
          "High severity does not mean cheap to fix",
          "ROI = risk reduction ÷ fix time",
        ],
        note: "Effort is what turns a priority list into a scheduling problem.",
      },
    },
    {
      id: "time",
      label: "Time Limit",
      color: "#16A34A",
      detail: {
        heading: "Available engineering hours",
        items: [
          `Current window: ${fmt(budget)} hours`,
          "Teams never have time to fix everything",
          "The budget is the hard constraint",
        ],
        note: "The whole product exists because time is finite.",
      },
    },
    {
      id: "optimization",
      label: "Optimization",
      color: "#5B3DF5",
      detail: {
        heading: "0/1 Knapsack",
        items: [
          "Maximize total risk reduction…",
          "…subject to the time budget",
          "Each fix is either fully in or out (0/1)",
          "Solved with dynamic programming",
        ],
        note: "This is the engine — it finds the provably best combination of fixes.",
      },
    },
    {
      id: "plan",
      label: "Remediation Plan",
      color: "#171717",
      detail: {
        heading: "The answer",
        items: [
          `${result.selected.length} fixes selected`,
          `${fmt(result.riskReduced)} risk points reduced`,
          `${fmt(result.hoursAllocated)}h allocated of ${fmt(budget)}h`,
          "Ordered by ROI for execution",
        ],
        note: "A concrete, defensible plan answering: given limited time, what should we fix?",
      },
    },
  ];

  const active = nodes.find((n) => n.id === openNode)!;

  return (
    <div className="mx-auto max-w-[1100px] px-6 pb-24 pt-12">
      {/* COMPARISON */}
      <section>
        <SectionLabel>Strategy Comparison</SectionLabel>
        <h1 className="mt-2 max-w-3xl font-display text-4xl font-extrabold leading-tight tracking-tight text-ink">
          Top-down triage vs. Knapsack optimization
        </h1>
        <p className="mt-3 max-w-2xl text-mute">
          The same {fmt(budget)}-hour budget, three strategies. Top-down fixes
          the highest-risk items first; CVSS-first fixes the scariest CVEs
          first. Both ignore fix cost. CYBER-ROI runs a 0/1 knapsack to maximize
          risk reduced per hour.
        </p>

        {/* three-way method comparison */}
        <div className="mt-8 rounded-3xl border border-line bg-surface p-7">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-mute">
            Risk reduced within {fmt(budget)}h
          </div>
          <div className="mt-6">
            <MethodBars
              methods={[
                {
                  key: "topdown",
                  label: "Top-down",
                  sublabel: "highest risk first",
                  result: topDown,
                  color: "#DC2626",
                },
                {
                  key: "cvss",
                  label: "CVSS-first",
                  sublabel: "highest severity first",
                  result: baseline,
                  color: "#D97706",
                },
                {
                  key: "knapsack",
                  label: "Knapsack",
                  sublabel: "0/1 optimization",
                  result: result,
                  color: "#5B3DF5",
                  best: true,
                },
              ]}
            />
          </div>

          <div className="mt-7 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl bg-emerald/[0.08] p-4">
              <div className="font-display text-3xl font-extrabold text-emerald">
                +{fmt(Math.max(0, result.riskReduced - topDown.riskReduced))}
              </div>
              <div className="text-sm font-medium text-mute">
                more risk reduced than top-down triage — same hours.
              </div>
            </div>
            <div className="rounded-2xl bg-violet/[0.08] p-4">
              <div className="font-display text-3xl font-extrabold text-violet">
                {gainPct(result.riskReduced, topDown.riskReduced)}
              </div>
              <div className="text-sm font-medium text-mute">
                improvement of knapsack over the top-down method.
              </div>
            </div>
          </div>
        </div>

        {/* knapsack vs top-down slope */}
        <div className="mt-6 grid items-center gap-6 lg:grid-cols-[1.4fr_1fr]">
          <div className="rounded-3xl border border-line bg-surface p-6">
            <SlopeChart
              traditional={topDown}
              optimized={result}
              traditionalLabel="TOP-DOWN"
              traditionalSublabel="highest risk first"
              optimizedLabel="KNAPSACK"
              optimizedSublabel="0/1 optimization"
            />
          </div>
          <div className="rounded-3xl border border-line bg-surface p-7">
            <SectionLabel>Why top-down falls short</SectionLabel>
            <p className="mt-3 text-sm leading-relaxed text-mute">
              Top-down triage sorts by risk and fixes the worst items first. But
              the biggest risks are often the most time-consuming, so the budget
              drains on a few large fixes — leaving cheap, high-ROI wins
              deferred.
            </p>
            <ul className="mt-5 space-y-3 text-sm">
              <li className="flex items-start gap-2.5">
                <span className="mt-1.5 h-1.5 w-1.5 flex-none rounded-full bg-crimson" />
                <span className="text-ink">
                  Top-down: <b>{topDown.selected.length}</b> fixes,{" "}
                  <b>{fmt(topDown.riskReduced)}</b> risk reduced
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="mt-1.5 h-1.5 w-1.5 flex-none rounded-full bg-violet" />
                <span className="text-ink">
                  Knapsack: <b>{result.selected.length}</b> fixes,{" "}
                  <b>{fmt(result.riskReduced)}</b> risk reduced
                </span>
              </li>
            </ul>
            <p className="mt-5 border-l-2 border-emerald pl-4 text-mute">
              Knapsack considers <b>risk and effort together</b>, so it packs the
              most total risk reduction into the exact same window.
            </p>
          </div>
        </div>
      </section>

      {/* ASSET RISK MAP */}
      <section className="mt-16">
        <SectionLabel>Asset Risk Map</SectionLabel>
        <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-ink">
          Where exposure is concentrated
        </h2>
        <p className="mt-2 max-w-2xl text-mute">
          Asset context is derived from the imported vulnerability records. Each row groups findings sharing the same criticality and internet-exposure profile.
        </p>
        <div className="mt-8 overflow-hidden rounded-3xl border border-line bg-surface">
          <div className="hidden grid-cols-[1.3fr_0.8fr_0.9fr_1fr_1.5fr] gap-4 border-b border-line bg-canvas px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-mute md:grid">
            <span>Asset profile</span><span>Risk score</span><span>Criticality</span><span>Exposure</span><span>Associated vulnerabilities</span>
          </div>
          {assetProfiles(scored).map((asset) => (
            <div key={asset.key} className="grid gap-3 border-b border-line px-6 py-5 last:border-b-0 md:grid-cols-[1.3fr_0.8fr_0.9fr_1fr_1.5fr] md:items-center md:gap-4">
              <div><div className="font-semibold text-ink">{asset.label}</div><div className="text-xs text-mute">{asset.count} finding{asset.count === 1 ? '' : 's'}</div></div>
              <div className="font-display text-xl font-extrabold text-ink">{fmt(asset.risk)}</div>
              <div className="text-sm font-semibold text-ink">{asset.criticality}/5</div>
              <div><span className={cn('rounded-full px-3 py-1 text-xs font-bold', asset.internetFacing ? 'bg-crimson/10 text-crimson' : 'bg-emerald/10 text-emerald')}>{asset.internetFacing ? 'Internet-facing' : 'Not internet-facing'}</span></div>
              <div className="flex flex-wrap gap-1.5">{asset.vulns.map((v) => <span key={v.id} className="rounded-full border border-line px-2 py-1 font-mono text-[10px] font-semibold text-mute">{v.cve}</span>)}</div>
            </div>
          ))}
        </div>
      </section>

      {/* EXPLAINABILITY */}
      <section className="mt-16">
        <SectionLabel>Explainability</SectionLabel>
        <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-ink">
          How a finding becomes a plan
        </h2>
        <p className="mt-2 max-w-2xl text-mute">
          Follow the chain. Click any node to reveal what happens at that stage.
        </p>

        {/* chain */}
        <div className="mt-8 flex flex-wrap items-center gap-2">
          {nodes.map((n, i) => (
            <div key={n.id} className="flex items-center gap-2">
              <button
                onClick={() => setOpenNode(n.id)}
                className={cn(
                  "rounded-2xl border px-4 py-3 text-sm font-bold transition",
                  openNode === n.id
                    ? "border-transparent text-white shadow-lg"
                    : "border-line bg-surface text-ink hover:border-ink/30"
                )}
                style={
                  openNode === n.id
                    ? { backgroundColor: n.color }
                    : undefined
                }
              >
                {n.label}
              </button>
              {i < nodes.length - 1 && (
                <span className="text-lg text-mute">→</span>
              )}
            </div>
          ))}
        </div>

        {/* detail */}
        <div className="mt-6 animate-floatUp rounded-3xl border border-line bg-surface p-8">
          <div className="flex items-center gap-3">
            <span
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: active.color }}
            />
            <h3 className="font-display text-2xl font-bold tracking-tight text-ink">
              {active.detail.heading}
            </h3>
          </div>
          <ul className="mt-5 grid gap-2 sm:grid-cols-2">
            {active.detail.items.map((it) => (
              <li
                key={it}
                className="flex items-start gap-2.5 rounded-xl bg-canvas px-4 py-3 text-sm font-medium text-ink"
              >
                <span
                  className="mt-1.5 h-1.5 w-1.5 flex-none rounded-full"
                  style={{ backgroundColor: active.color }}
                />
                {it}
              </li>
            ))}
          </ul>
          <p className="mt-5 border-l-2 pl-4 text-mute" style={{ borderColor: active.color }}>
            {active.detail.note}
          </p>
        </div>
      </section>
    </div>
  );
}

function gainPct(optimized: number, base: number): string {
  if (base <= 0) return optimized > 0 ? "+100%" : "0%";
  const pct = ((optimized - base) / base) * 100;
  const rounded = Math.round(pct);
  return `${rounded >= 0 ? "+" : ""}${rounded}%`;
}

interface AssetProfile { key: string; label: string; risk: number; criticality: number; internetFacing: boolean; count: number; vulns: scoredPlaceholder[] }
type scoredPlaceholder = { id: string; cve: string };

function assetProfiles(items: Array<scoredPlaceholder & { risk: number; assetCriticality: number; internetFacing?: boolean }>): AssetProfile[] {
  const groups = new Map<string, AssetProfile>();
  for (const v of items) {
    const internetFacing = Boolean(v.internetFacing);
    const key = `${v.assetCriticality}-${internetFacing}`;
    const current = groups.get(key) ?? { key, label: `Criticality ${v.assetCriticality} asset profile`, risk: 0, criticality: v.assetCriticality, internetFacing, count: 0, vulns: [] };
    current.risk += v.risk;
    current.count += 1;
    current.vulns.push({ id: v.id, cve: v.cve });
    groups.set(key, current);
  }
  return [...groups.values()].sort((a, b) => b.risk - a.risk).map((asset) => ({ ...asset, risk: Math.round(asset.risk * 10) / 10 }));
}
