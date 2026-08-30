import { useMemo, useState } from "react";
import type { OptimizationResult, ScoredVuln } from "../../lib/types";
import { fmt } from "../../lib/ui";

interface Props {
  scored: ScoredVuln[];
  result: OptimizationResult;
}

/**
 * 2D decision map.
 * X = remediation effort (hours), Y = risk reduction. Bubble size = risk.
 * Selected fixes are solid violet; deferred are hollow/muted.
 */
export function ScatterBubble({ scored, result }: Props) {
  const [hover, setHover] = useState<ScoredVuln | null>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });

  const W = 760;
  const H = 440;
  const pad = { l: 64, r: 24, t: 24, b: 56 };

  const maxEffort = Math.max(6, ...scored.map((v) => v.fixTime)) * 1.05;
  const maxRisk = Math.max(10, ...scored.map((v) => v.riskReduction)) * 1.08;

  const selectedIds = useMemo(
    () => new Set(result.selected.map((v) => v.id)),
    [result]
  );

  const xScale = (e: number) =>
    pad.l + (e / maxEffort) * (W - pad.l - pad.r);
  const yScale = (r: number) =>
    H - pad.b - (r / maxRisk) * (H - pad.t - pad.b);
  const rScale = (risk: number) => 6 + (risk / 100) * 22;

  // "best use of hours" region — high reduction, low effort
  const regionX = xScale(0);
  const regionW = xScale(maxEffort * 0.42) - regionX;
  const regionY = yScale(maxRisk * 0.98);
  const regionH = yScale(maxRisk * 0.34) - regionY;

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        onMouseLeave={() => setHover(null)}
      >
        {/* highlighted best-value region */}
        <rect
          x={regionX}
          y={regionY}
          width={regionW}
          height={regionH}
          rx={16}
          fill="#5B3DF5"
          opacity={0.06}
        />
        <rect
          x={regionX}
          y={regionY}
          width={regionW}
          height={regionH}
          rx={16}
          fill="none"
          stroke="#5B3DF5"
          strokeWidth={1.5}
          strokeDasharray="5 5"
          opacity={0.4}
        />
        <text
          x={regionX + 16}
          y={regionY + 24}
          className="fill-violet"
          fontSize={12}
          fontWeight={700}
        >
          Best use of available hours
        </text>

        {/* grid + axes */}
        {[0.25, 0.5, 0.75, 1].map((f) => (
          <line
            key={f}
            x1={pad.l}
            x2={W - pad.r}
            y1={yScale(maxRisk * f)}
            y2={yScale(maxRisk * f)}
            stroke="var(--color-line)"
            strokeWidth={1}
          />
        ))}
        <line
          x1={pad.l}
          x2={pad.l}
          y1={pad.t}
          y2={H - pad.b}
          stroke="var(--color-line)"
          strokeWidth={1.5}
        />
        <line
          x1={pad.l}
          x2={W - pad.r}
          y1={H - pad.b}
          y2={H - pad.b}
          stroke="var(--color-line)"
          strokeWidth={1.5}
        />

        {/* axis labels */}
        <text
          x={(pad.l + W - pad.r) / 2}
          y={H - 14}
          textAnchor="middle"
          fontSize={12}
          fontWeight={600}
          className="fill-mute"
        >
          Remediation Effort (hours) →
        </text>
        <text
          x={-H / 2}
          y={18}
          transform="rotate(-90)"
          textAnchor="middle"
          fontSize={12}
          fontWeight={600}
          className="fill-mute"
        >
          Risk Reduction →
        </text>

        {/* bubbles */}
        {scored.map((v) => {
          const sel = selectedIds.has(v.id);
          const cx = xScale(v.fixTime);
          const cy = yScale(v.riskReduction);
          const rr = rScale(v.risk);
          const active = hover?.id === v.id;
          return (
            <circle
              key={v.id}
              cx={cx}
              cy={cy}
              r={rr}
              fill={sel ? "var(--color-violet)" : "var(--color-surface)"}
              stroke={sel ? "var(--color-violet)" : "#C9C3B6"}
              strokeWidth={sel ? 0 : 1.5}
              opacity={sel ? (active ? 1 : 0.82) : active ? 0.9 : 0.55}
              style={{
                cursor: "pointer",
                transition: "opacity 0.2s, r 0.2s",
              }}
              onMouseMove={(e) => {
                const rect = (
                  e.currentTarget.ownerSVGElement as SVGSVGElement
                ).getBoundingClientRect();
                setPos({
                  x: ((cx / W) * rect.width),
                  y: ((cy / H) * rect.height),
                });
                setHover(v);
              }}
            />
          );
        })}
      </svg>

      {/* legend */}
      <div className="mt-2 flex flex-wrap items-center gap-5 pl-16 text-xs font-medium text-mute">
        <span className="inline-flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-violet" /> Selected
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-3 w-3 rounded-full border border-[#C9C3B6] bg-surface" />{" "}
          Deferred
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-4 w-4 rounded-full border-2 border-mute/40" /> Bubble
          size = risk
        </span>
      </div>

      {hover && (
        <div
          className="pointer-events-none absolute z-20 w-56 -translate-x-1/2 -translate-y-full rounded-2xl border border-line bg-surface p-3 shadow-xl"
          style={{ left: pos.x, top: pos.y - 12 }}
        >
          <div className="font-mono text-[11px] font-semibold text-violet">
            {hover.cve}
          </div>
          <div className="mt-0.5 text-sm font-semibold leading-snug text-ink">
            {hover.title}
          </div>
          <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
            <Row label="Risk" value={fmt(hover.risk)} />
            <Row label="CVSS" value={hover.cvss.toFixed(1)} />
            <Row label="EPSS" value={`${Math.round(hover.epss * 100)}%`} />
            <Row label="KEV" value={hover.kev ? "Yes" : "No"} />
            <Row label="Fix" value={`${hover.fixTime}h`} />
            <Row label="ROI" value={`${fmt(hover.roi)}/h`} />
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-mute">{label}</span>
      <span className="font-semibold text-ink">{value}</span>
    </div>
  );
}
