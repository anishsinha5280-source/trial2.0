import type { Severity } from "../lib/types";
import { SEVERITY_COLOR } from "../lib/ui";
import { cn } from "../utils/cn";

export function SeverityBadge({
  severity,
  className,
}: {
  severity: Severity;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
        className
      )}
      style={{
        color: SEVERITY_COLOR[severity],
        backgroundColor: `color-mix(in srgb, ${SEVERITY_COLOR[severity]} 14%, var(--color-surface))`,
      }}
    >
      {severity}
    </span>
  );
}

export function KevChip() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-crimson/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-crimson">
      <span className="h-1.5 w-1.5 rounded-full bg-crimson" /> KEV
    </span>
  );
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-mute">
      {children}
    </span>
  );
}

export function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-violet">
      <span className="h-1.5 w-1.5 rounded-full bg-violet" />
      {children}
    </div>
  );
}
