import { fmt0 } from "../../lib/ui";

interface Props {
  current: number;
  reduced: number; // how much would be reduced
  size?: number;
}

/** Large radial visualization of current risk exposure with optimized delta. */
export function RadialGauge({ current, reduced, size = 340 }: Props) {
  const stroke = 26;
  const r = (size - stroke) / 2 - 8;
  const cx = size / 2;
  const cy = size / 2;
  const circ = 2 * Math.PI * r;
  const gap = 0.14; // portion left open at the bottom
  const arc = 1 - gap;

  const reducedFrac = current > 0 ? Math.min(1, reduced / current) : 0;
  const remainingFrac = 1 - reducedFrac;

  // track from start angle
  const rotate = 90 + (gap * 360) / 2;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="overflow-visible">
        <defs>
          <linearGradient id="riskArc" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#5B3DF5" />
            <stop offset="100%" stopColor="#2563EB" />
          </linearGradient>
        </defs>
        <g transform={`rotate(${rotate} ${cx} ${cy})`}>
          {/* base track */}
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke="var(--color-line)"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${circ * arc} ${circ}`}
          />
          {/* remaining risk after optimization (solid violet) */}
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke="url(#riskArc)"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${circ * arc * remainingFrac} ${circ}`}
            style={{
              transition: "stroke-dasharray 0.9s cubic-bezier(0.22,1,0.36,1)",
            }}
          />
          {/* reduced portion (emerald dashed hint) */}
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke="#16A34A"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${circ * arc * reducedFrac} ${circ}`}
            strokeDashoffset={-circ * arc * remainingFrac}
            opacity={0.28}
            style={{
              transition: "all 0.9s cubic-bezier(0.22,1,0.36,1)",
            }}
          />
        </g>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-mute">
          Current Risk Exposure
        </span>
        <span className="mt-1 font-display text-[64px] font-extrabold leading-none tracking-tight text-ink">
          {fmt0(current)}
        </span>
        <span className="mt-1 text-sm font-medium text-mute">Risk Points</span>
        <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-emerald/10 px-3 py-1 text-sm font-semibold text-emerald">
          −{fmt0(reduced)} after optimization
        </span>
      </div>
    </div>
  );
}
