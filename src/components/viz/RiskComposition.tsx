import type { ScoredVuln } from "../../lib/types";
import { fmt } from "../../lib/ui";

/** Horizontal chain: CVSS → EPSS → KEV → Asset Criticality → Composite Risk. */
export function RiskComposition({ v }: { v: ScoredVuln }) {
  const nodes = [
    {
      label: "CVSS",
      value: v.cvss.toFixed(1),
      frac: v.cvss / 10,
      color: "#2563EB",
    },
    {
      label: "EPSS",
      value: `${Math.round(v.epss * 100)}%`,
      frac: v.epss,
      color: "#5B3DF5",
    },
    {
      label: "KEV",
      value: v.kev ? "Yes" : "No",
      frac: v.kev ? 1 : 0.06,
      color: v.kev ? "#DC2626" : "#C9C3B6",
    },
    {
      label: "Asset",
      value: `${v.assetCriticality}/5`,
      frac: v.assetCriticality / 5,
      color: "#D97706",
    },
  ];

  return (
    <div className="flex items-stretch gap-2">
      {nodes.map((n) => (
        <div key={n.label} className="flex flex-1 items-center gap-2">
          <div className="flex-1 rounded-2xl border border-line bg-surface p-3">
            <div className="text-[10px] font-semibold uppercase tracking-widest text-mute">
              {n.label}
            </div>
            <div className="mt-1 text-lg font-bold text-ink">{n.value}</div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-canvas">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.max(6, n.frac * 100)}%`,
                  backgroundColor: n.color,
                }}
              />
            </div>
          </div>
          <span className="text-mute">→</span>
        </div>
      ))}
      <div className="flex items-center">
        <div className="rounded-2xl bg-violet p-3 text-white shadow-lg shadow-violet/20">
          <div className="text-[10px] font-semibold uppercase tracking-widest text-white/70">
            Composite Risk
          </div>
          <div className="mt-1 font-display text-2xl font-extrabold leading-none">
            {fmt(v.risk)}
          </div>
        </div>
      </div>
    </div>
  );
}
