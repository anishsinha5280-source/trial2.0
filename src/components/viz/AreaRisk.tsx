import { useMemo } from "react";
import type { ScoredVuln } from "../../lib/types";
import { SEVERITY_COLOR } from "../../lib/ui";

/** Area visualization of risk contribution across findings, ordered by risk. */
export function AreaRisk({ scored }: { scored: ScoredVuln[] }) {
  const W = 560;
  const H = 260;
  const pad = { l: 8, r: 8, t: 16, b: 8 };

  const data = useMemo(
    () => [...scored].sort((a, b) => b.risk - a.risk),
    [scored]
  );

  if (data.length === 0) return null;

  const maxRisk = Math.max(...data.map((d) => d.risk), 10);
  const stepX = (W - pad.l - pad.r) / Math.max(1, data.length - 1);
  const x = (i: number) => pad.l + i * stepX;
  const y = (r: number) => H - pad.b - (r / maxRisk) * (H - pad.t - pad.b);

  const linePts = data.map((d, i) => `${x(i)},${y(d.risk)}`).join(" ");
  const areaPts = `${pad.l},${H - pad.b} ${linePts} ${x(
    data.length - 1
  )},${H - pad.b}`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
      <defs>
        <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#5B3DF5" stopOpacity={0.34} />
          <stop offset="100%" stopColor="#5B3DF5" stopOpacity={0.02} />
        </linearGradient>
      </defs>

      {[0.25, 0.5, 0.75].map((f) => (
        <line
          key={f}
          x1={pad.l}
          x2={W - pad.r}
          y1={y(maxRisk * f)}
          y2={y(maxRisk * f)}
          stroke="var(--color-line)"
          strokeDasharray="3 4"
        />
      ))}

      <polygon points={areaPts} fill="url(#areaFill)" />
      <polyline
        points={linePts}
        fill="none"
        stroke="#5B3DF5"
        strokeWidth={2.5}
        strokeLinejoin="round"
      />
      {data.map((d, i) =>
        i % 2 === 0 || data.length < 20 ? (
          <circle
            key={d.id}
            cx={x(i)}
            cy={y(d.risk)}
            r={3}
            fill={SEVERITY_COLOR[d.severity]}
            stroke="var(--color-surface)"
            strokeWidth={1.4}
          />
        ) : null
      )}
    </svg>
  );
}
