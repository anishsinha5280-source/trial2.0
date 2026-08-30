import type { OptimizationResult, ScoredVuln } from "../../lib/types";
import { SEVERITY_COLOR } from "../../lib/ui";

/** Horizontal capacity timeline — each block is a scheduled remediation. */
export function CapacityTimeline({ result }: { result: OptimizationResult }) {
  const total = result.budget;
  const blocks = result.selected;

  return (
    <div>
      <div className="mb-3 flex items-baseline justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-mute">
          {result.budget} hours available
        </span>
        <span className="text-sm font-semibold text-ink">
          {result.hoursRemaining}h remaining
        </span>
      </div>

      <div className="flex h-16 w-full gap-1 overflow-hidden rounded-2xl bg-canvas p-1">
        {blocks.map((v: ScoredVuln, i) => {
          const pct = (v.fixTime / total) * 100;
          return (
            <div
              key={v.id}
              className="group relative flex min-w-0 items-center justify-center rounded-xl px-2 text-white transition"
              style={{
                width: `${pct}%`,
                backgroundColor: SEVERITY_COLOR[v.severity],
                animation: `floatUp 0.5s ${i * 0.06}s both`,
              }}
              title={`${v.title} · ${v.fixTime}h`}
            >
              <span className="truncate text-[11px] font-semibold">
                {v.title}
              </span>
              <div className="pointer-events-none absolute -top-1 left-1/2 z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-lg bg-ink px-2.5 py-1.5 text-[11px] font-medium text-canvas opacity-0 shadow-lg transition group-hover:opacity-100">
                {v.cve} · {v.fixTime}h · ROI {v.roi}/h
              </div>
            </div>
          );
        })}
        {result.hoursRemaining > 0.01 && (
          <div
            className="flex items-center justify-center rounded-xl border-2 border-dashed border-[#C9C3B6] text-[11px] font-semibold text-mute"
            style={{ width: `${(result.hoursRemaining / total) * 100}%` }}
          >
            {result.hoursRemaining > 0.4 ? `${result.hoursRemaining}h free` : ""}
          </div>
        )}
      </div>
    </div>
  );
}
