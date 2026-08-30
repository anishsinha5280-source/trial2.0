import type { OptimizationResult } from "../../lib/types";
import { fmt } from "../../lib/ui";

interface Props {
  traditional: OptimizationResult;
  optimized: OptimizationResult;
  traditionalLabel?: string;
  traditionalSublabel?: string;
  optimizedLabel?: string;
  optimizedSublabel?: string;
}

/** Dumbbell / slope comparison with labels offset from points to avoid overlap. */
export function SlopeChart({
  traditional,
  optimized,
  traditionalLabel = "TRADITIONAL",
  traditionalSublabel = "CVSS-first",
  optimizedLabel = "CYBER-ROI",
  optimizedSublabel = "Optimization",
}: Props) {
  const W = 620;
  const H = 360;
  const leftX = 135;
  const rightX = W - 135;
  const topY = 108;
  const botY = H - 58;

  const max = Math.max(traditional.riskReduced, optimized.riskReduced, 1);
  const y = (v: number) => botY - (v / max) * (botY - topY);

  const tY = y(traditional.riskReduced);
  const oY = y(optimized.riskReduced);
  const gain = optimized.riskReduced - traditional.riskReduced;
  const midX = (leftX + rightX) / 2;
  const midY = (tY + oY) / 2;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
      {/* column headers */}
      <text
        x={leftX}
        y={28}
        textAnchor="middle"
        fontSize={13}
        fontWeight={700}
        className="fill-mute"
      >
        {traditionalLabel}
      </text>
      <text
        x={leftX}
        y={46}
        textAnchor="middle"
        fontSize={11}
        className="fill-mute"
      >
        {traditionalSublabel}
      </text>
      <text
        x={rightX}
        y={28}
        textAnchor="middle"
        fontSize={13}
        fontWeight={700}
        className="fill-violet"
      >
        {optimizedLabel}
      </text>
      <text
        x={rightX}
        y={46}
        textAnchor="middle"
        fontSize={11}
        className="fill-violet"
      >
        {optimizedSublabel}
      </text>

      {/* vertical rails */}
      <line
        x1={leftX}
        x2={leftX}
        y1={topY}
        y2={botY}
        stroke="var(--color-line)"
        strokeWidth={2}
      />
      <line
        x1={rightX}
        x2={rightX}
        y1={topY}
        y2={botY}
        stroke="var(--color-line)"
        strokeWidth={2}
      />

      {/* connecting slope */}
      <line
        x1={leftX}
        y1={tY}
        x2={rightX}
        y2={oY}
        stroke="#16A34A"
        strokeWidth={3}
        strokeLinecap="round"
      />

      {/* value labels are positioned beside points, not above them */}
      <text
        x={leftX - 16}
        y={tY + 7}
        textAnchor="end"
        fontSize={22}
        fontWeight={800}
        className="fill-ink"
      >
        {fmt(traditional.riskReduced)}
      </text>
      <text
        x={rightX + 16}
        y={oY + 8}
        textAnchor="start"
        fontSize={26}
        fontWeight={800}
        className="fill-ink"
      >
        {fmt(optimized.riskReduced)}
      </text>

      {/* points */}
      <circle cx={leftX} cy={tY} r={9} fill="#D97706" />
      <circle cx={rightX} cy={oY} r={11} fill="#5B3DF5" />

      {/* gain callout */}
      <g transform={`translate(${midX}, ${midY})`}>
        <rect x={-78} y={-16} width={156} height={32} rx={16} fill="#16A34A" />
        <text
          x={0}
          y={5}
          textAnchor="middle"
          fontSize={13}
          fontWeight={700}
          fill="#fff"
        >
          +{fmt(gain)} risk reduced
        </text>
      </g>

      <text
        x={W / 2}
        y={H - 14}
        textAnchor="middle"
        fontSize={11}
        className="fill-mute"
      >
        Risk Reduced within the same {optimized.budget}-hour window
      </text>
    </svg>
  );
}