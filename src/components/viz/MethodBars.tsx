import type { OptimizationResult } from "../../lib/types";
import { fmt } from "../../lib/ui";

interface Method {
  key: string;
  label: string;
  sublabel: string;
  result: OptimizationResult;
  color: string;
  best?: boolean;
}

interface Props {
  methods: Method[];
}

/**
 * Horizontal bar comparison of risk reduced by each strategy within the same
 * time budget. Makes the knapsack advantage over top-down / severity-first
 * triage immediately obvious.
 */
export function MethodBars({ methods }: Props) {
  const max = Math.max(...methods.map((m) => m.result.riskReduced), 1);

  return (
    <div className="space-y-5">
      {methods.map((m) => {
        const pct = (m.result.riskReduced / max) * 100;
        return (
          <div key={m.key}>
            <div className="mb-1.5 flex items-baseline justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-ink">{m.label}</span>
                <span className="text-xs text-mute">{m.sublabel}</span>
                {m.best && (
                  <span className="rounded-full bg-emerald/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald">
                    Best
                  </span>
                )}
              </div>
              <div className="flex items-baseline gap-2">
                <span
                  className="font-display text-xl font-extrabold tracking-tight"
                  style={{ color: m.color }}
                >
                  {fmt(m.result.riskReduced)}
                </span>
                <span className="text-[11px] font-medium text-mute">
                  {m.result.selected.length} fixes · {fmt(m.result.hoursAllocated)}h
                </span>
              </div>
            </div>
            <div className="h-3.5 w-full overflow-hidden rounded-full bg-canvas">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${Math.max(3, pct)}%`,
                  backgroundColor: m.color,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
