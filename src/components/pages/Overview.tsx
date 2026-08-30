import { useMemo } from "react";
import { useStore } from "../../lib/store";
import { RadialGauge } from "../viz/RadialGauge";
import { TimeBudgetControl } from "../TimeBudgetControl";
import { SectionLabel } from "../common";
import { hours } from "../../lib/ui";

export function Overview() {
  const { scored, result, setPage, budget } = useStore();

  const stats = useMemo(() => {
    const critical = scored.filter((v) => v.severity === "CRITICAL").length;
    const kev = scored.filter((v) => v.kev).length;
    const high = scored.filter((v) => v.severity === "HIGH").length;
    return { critical, kev, high };
  }, [scored]);

  return (
    <div className="mx-auto max-w-[1240px] px-6 pb-24">
      {/* HERO */}
      <section className="grid items-center gap-10 pb-20 pt-14 lg:grid-cols-[1.15fr_1fr]">
        <div className="animate-floatUp">
          <h1 className="mt-6 font-display text-[52px] font-extrabold leading-[0.98] tracking-tight text-ink sm:text-[64px]">
            Reduce more risk.
            <br />
            <span className="text-white">Waste fewer hours.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-mute">
            An optimization engine for deciding which security fixes deliver the
            greatest risk reduction within a limited remediation window.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button
              onClick={() => setPage("optimize")}
              className="rounded-full bg-ink px-6 py-3 text-sm font-semibold text-canvas transition hover:opacity-90"
            >
              Plan your {hours(budget)} window →
            </button>
            <button
              onClick={() => setPage("findings")}
              className="rounded-full border border-line bg-surface px-6 py-3 text-sm font-semibold text-ink transition hover:border-ink/30"
            >
              Investigate findings
            </button>
          </div>
        </div>

        <div className="flex justify-center lg:justify-end">
          <div className="animate-count">
            <RadialGauge
              current={result.totalRiskBefore}
              reduced={result.riskReduced}
            />
          </div>
        </div>
      </section>

      {/* TIME BUDGET + RISK SNAPSHOT */}
      <section className="grid gap-6 lg:grid-cols-[1.7fr_1fr]">
        <div className="rounded-3xl border border-line bg-surface p-7">
          <div className="flex items-start justify-between">
            <div>
              <SectionLabel>Remediation Window</SectionLabel>
              <h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink">
                How many hours can you spend?
              </h2>
            </div>
            <span className="rounded-full bg-canvas px-3 py-1 text-sm font-semibold text-mute">
              {scored.length} findings
            </span>
          </div>
          <p className="mt-2 max-w-md text-sm text-mute">
            Drag the slider or pick a preset. The remediation plan and exposure
            gauge update instantly.
          </p>
          <TimeBudgetControl className="mt-6" size="md" />
        </div>

        <div className="rounded-3xl border border-line bg-surface p-7">
          <SectionLabel>At a glance</SectionLabel>
          <div className="mt-5 divide-y divide-line">
            <SnapshotRow label="Critical" value={String(stats.critical)} accent="#DC2626" />
            <SnapshotRow label="KEV" value={String(stats.kev)} accent="#5B3DF5" />
            <SnapshotRow label="High Risk" value={String(stats.high)} accent="#D97706" />
            <SnapshotRow
              label="Available Capacity"
              value={hours(budget)}
              accent="#16A34A"
            />
          </div>
        </div>
      </section>
    </div>
  );
}

function SnapshotRow({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div className="flex items-center justify-between py-4">
      <span className="flex items-center gap-2.5 text-sm font-medium text-mute">
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: accent }} />
        {label}
      </span>
      <span className="font-display text-3xl font-extrabold tracking-tight text-ink">
        {value}
      </span>
    </div>
  );
}
