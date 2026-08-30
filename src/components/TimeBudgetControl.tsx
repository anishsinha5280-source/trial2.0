import { useStore } from "../lib/store";
import { cn } from "../utils/cn";

const PRESETS = [4, 8, 16, 24, 40, 60];

interface Props {
  size?: "md" | "lg";
  className?: string;
}

/**
 * Shared time-budget selector (slider + preset pills) bound to the global
 * budget state, so it recomputes every optimization the moment it changes.
 */
export function TimeBudgetControl({ size = "md", className }: Props) {
  const { budget, setBudget } = useStore();

  const numberClass =
    size === "lg" ? "text-[96px] sm:text-[128px]" : "text-[64px] sm:text-[76px]";

  return (
    <div className={className}>
      {/* number */}
      <div className="text-center">
        <div
          className={cn(
            "font-display font-extrabold leading-none tracking-tighter text-ink",
            numberClass
          )}
        >
          {budget.toFixed(1)}
          <span className="text-3xl font-bold text-mute"> h</span>
        </div>
      </div>

      {/* slider */}
      <div className="mt-6">
        <input
          type="range"
          min={0.5}
          max={60}
          step={0.5}
          value={budget}
          onChange={(e) => setBudget(parseFloat(e.target.value))}
          className="range-slider w-full"
          style={{
            background: `linear-gradient(to right, var(--color-violet) 0%, var(--color-violet) ${
              (budget / 60) * 100
            }%, var(--color-line) ${(budget / 60) * 100}%, var(--color-line) 100%)`,
          }}
        />
        <div className="mt-2 flex justify-between text-xs font-medium text-mute">
          <span>0.5h</span>
          <span>60h</span>
        </div>
      </div>

      {/* presets */}
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        {PRESETS.map((p) => (
          <button
            key={p}
            onClick={() => setBudget(p)}
            className={cn(
              "rounded-full border px-5 py-2 text-sm font-bold transition",
              budget === p
                ? "border-violet bg-violet text-white"
                : "border-line bg-surface text-mute hover:border-ink/30 hover:text-ink"
            )}
          >
            {p} HOURS
          </button>
        ))}
      </div>
    </div>
  );
}
