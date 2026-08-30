import { useMemo, useState } from "react";
import { useStore } from "../../lib/store";
import { CapacityTimeline } from "../viz/CapacityTimeline";
import { BeforeAfter } from "../viz/BeforeAfter";
import { TimeBudgetControl } from "../TimeBudgetControl";
import { SectionLabel } from "../common";
import { fmt, fmt0 } from "../../lib/ui";
import { optimize } from "../../lib/risk";

export function Optimize() {
  const { budget, result, scored, setPage } = useStore();
  const [whatIfBudget, setWhatIfBudget] = useState(budget);
  const whatIfResult = useMemo(() => optimize(scored, whatIfBudget), [scored, whatIfBudget]);

  return (
    <div className="mx-auto max-w-[1000px] px-6 pb-24 pt-12">
      <div className="text-center">
        <SectionLabel>Remediation Planner</SectionLabel>
        <h1 className="mx-auto mt-3 max-w-2xl font-display text-[40px] font-extrabold leading-tight tracking-tight text-ink sm:text-5xl">
          How many hours can you spend?
        </h1>
      </div>

      {/* giant number + slider + presets */}
      <div className="mx-auto mt-10 max-w-2xl">
        <TimeBudgetControl size="lg" />
      </div>

      {/* result statement */}
      <div className="mt-16 rounded-3xl border border-line bg-surface p-8 text-center">
        <p className="font-display text-2xl font-bold tracking-tight text-ink">
          Your {fmt(budget)} hours can reduce
        </p>
        <div className="mt-2 font-display text-[72px] font-extrabold leading-none tracking-tight text-violet">
          {fmt(result.riskReduced)}
        </div>
        <p className="text-lg font-semibold text-mute">risk points</p>

        <div className="mx-auto mt-8 grid max-w-xl grid-cols-3 divide-x divide-line">
          <ResultStat value={String(result.selected.length)} label="vulnerabilities selected" />
          <ResultStat value={`${fmt(result.hoursAllocated)}h`} label="hours allocated" />
          <ResultStat value={`${fmt(result.hoursRemaining)}h`} label="hours remaining" />
        </div>
      </div>

      {/* what-if simulator — deliberately local so the existing optimizer remains unchanged */}
      <div className="mt-8 rounded-3xl border border-line bg-surface p-8">
        <SectionLabel>What-If Simulator</SectionLabel>
        <h2 className="mb-2 mt-1 font-display text-2xl font-bold tracking-tight text-ink">
          Test a different remediation window
        </h2>
        <p className="max-w-2xl text-sm leading-relaxed text-mute">
          Adjust a separate time budget to preview risk reduction and priority changes.
          Your primary optimization plan above is not changed.
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-4">
          <label htmlFor="what-if-budget" className="text-sm font-semibold text-ink">
            Preview budget: <span className="font-display text-lg">{whatIfBudget.toFixed(1)}h</span>
          </label>
          <input
            id="what-if-budget"
            type="range"
            min={0.5}
            max={60}
            step={0.5}
            value={whatIfBudget}
            onChange={(e) => setWhatIfBudget(parseFloat(e.target.value))}
            className="range-slider min-w-[220px] flex-1"
            style={{ background: `linear-gradient(to right, var(--color-violet) 0%, var(--color-violet) ${(whatIfBudget / 60) * 100}%, var(--color-line) ${(whatIfBudget / 60) * 100}%, var(--color-line) 100%)` }}
          />
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <ResultStat value={fmt(whatIfResult.riskReduced)} label="estimated risk reduction" />
          <ResultStat value={String(whatIfResult.selected.length)} label="recommended priorities" />
          <ResultStat value={`${fmt(whatIfResult.hoursAllocated)}h`} label="hours allocated" />
        </div>
        <div className="mt-6 grid gap-3 lg:grid-cols-2">
          <div className="rounded-2xl bg-emerald/[0.08] p-4">
            <div className="text-xs font-bold uppercase tracking-wider text-emerald">Recommended at {whatIfBudget.toFixed(1)}h</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {whatIfResult.selected.length ? whatIfResult.selected.map((v, i) => (
                <span key={v.id} className="rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-ink">
                  {i + 1}. {v.cve}
                </span>
              )) : <span className="text-sm text-mute">No fixes fit this window.</span>}
            </div>
          </div>
          <div className="rounded-2xl bg-canvas p-4">
            <div className="text-xs font-bold uppercase tracking-wider text-mute">Priority changes from current plan</div>
            <div className="mt-3 space-y-2 text-sm text-mute">
              <p><b className="text-ink">{whatIfResult.selected.filter((v) => !result.selected.some((current) => current.id === v.id)).length}</b> newly included</p>
              <p><b className="text-ink">{result.selected.filter((v) => !whatIfResult.selected.some((candidate) => candidate.id === v.id)).length}</b> no longer included</p>
            </div>
          </div>
        </div>
      </div>

      {/* time budget visualization */}
      <div className="mt-8 rounded-3xl border border-line bg-surface p-8">
        <SectionLabel>Time Budget</SectionLabel>
        <h2 className="mb-6 mt-1 font-display text-2xl font-bold tracking-tight text-ink">
          Capacity timeline
        </h2>
        <CapacityTimeline result={result} />
      </div>

      {/* before / after */}
      <div className="mt-8 rounded-3xl border border-line bg-surface p-10">
        <div className="text-center">
          <SectionLabel>Net Effect</SectionLabel>
          <h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink">
            Total risk, before and after
          </h2>
        </div>
        <div className="mt-8">
          <BeforeAfter
            before={result.totalRiskBefore}
            after={result.totalRiskAfter}
          />
        </div>
        <p className="mt-8 text-center text-mute">
          A{" "}
          <span className="font-bold text-emerald">
            {fmt0(
              (result.riskReduced / Math.max(1, result.totalRiskBefore)) * 100
            )}
            %
          </span>{" "}
          reduction in total exposure using only {fmt(result.hoursAllocated)}{" "}
          engineering hours.
        </p>
        <div className="mt-8 text-center">
          <button
            onClick={() => setPage("plan")}
            className="rounded-full bg-ink px-6 py-3 text-sm font-semibold text-canvas transition hover:opacity-90"
          >
            View the remediation plan →
          </button>
        </div>
      </div>
    </div>
  );
}

function ResultStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="px-3">
      <div className="font-display text-3xl font-extrabold tracking-tight text-ink">
        {value}
      </div>
      <div className="mt-1 text-xs font-medium text-mute">{label}</div>
    </div>
  );
}
