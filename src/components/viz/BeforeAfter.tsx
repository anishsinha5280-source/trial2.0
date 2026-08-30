import { fmt } from "../../lib/ui";

interface Props {
  before: number;
  after: number;
}

function Circle({
  value,
  label,
  color,
  scale,
}: {
  value: number;
  label: string;
  color: string;
  scale: number;
}) {
  const size = 90 + scale * 90;
  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className="flex items-center justify-center rounded-full"
        style={{
          width: size,
          height: size,
          backgroundColor: `${color}14`,
          border: `2px solid ${color}`,
        }}
      >
        <div className="text-center">
          <div
            className="font-display font-extrabold leading-none tracking-tight"
            style={{ color, fontSize: 24 + scale * 11 }}
          >
            {fmt(value)}
          </div>
          <div className="text-[10px] font-semibold uppercase tracking-widest text-mute">
            risk
          </div>
        </div>
      </div>
      <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-mute">
        {label}
      </span>
    </div>
  );
}

export function BeforeAfter({ before, after }: Props) {
  const afterScale = before > 0 ? after / before : 0;
  // Derive the reduction directly from the displayed values so
  // before − after always equals the net reduction shown.
  const reduced = Math.round((before - after) * 10) / 10;
  return (
    <div className="flex items-center justify-center gap-8">
      <Circle value={before} label="Before" color="#DC2626" scale={1} />
      <div className="flex flex-col items-center gap-2 text-mute">
        <span className="font-display text-xl font-extrabold tracking-tight text-emerald">
          −{fmt(reduced)}
        </span>
        <svg width="52" height="24" viewBox="0 0 52 24" fill="none">
          <path
            d="M2 12h44m0 0l-8-7m8 7l-8 7"
            stroke="#16A34A"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span className="text-[10px] font-semibold uppercase tracking-widest">
          net reduction
        </span>
      </div>
      <Circle value={after} label="After" color="#16A34A" scale={afterScale} />
    </div>
  );
}
