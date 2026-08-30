import { useStore } from "../../lib/store";
import type { ScoredVuln } from "../../lib/types";
import { SectionLabel, SeverityBadge, KevChip } from "../common";
import { fmt, riskBand } from "../../lib/ui";
import { deferralReason, selectionReason } from "../../lib/risk";
import { SEVERITY_COLOR } from "../../lib/ui";

export function Plan() {
  const { result, setSelectedCve, setPage } = useStore();

  function exportPlan() {
    const payload = {
      generatedAt: new Date().toISOString(),
      budgetHours: result.budget,
      riskReduced: result.riskReduced,
      totalRiskBefore: result.totalRiskBefore,
      totalRiskAfter: result.totalRiskAfter,
      selected: result.selected.map((v, i) => ({
        order: i + 1,
        cve: v.cve,
        title: v.title,
        fixTime: v.fixTime,
        riskReduction: v.riskReduction,
        roi: v.roi,
        reason: selectionReason(v),
      })),
      deferred: result.deferred.map((v) => ({
        cve: v.cve,
        title: v.title,
        risk: v.risk,
        fixTime: v.fixTime,
        roi: v.roi,
        reason: deferralReason(v),
      })),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "cyber-roi-remediation-plan.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  function open(v: ScoredVuln) {
    setSelectedCve(v.cve);
    setPage("findings");
  }

  return (
    <div className="mx-auto max-w-[1000px] px-6 pb-24 pt-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <SectionLabel>Execution</SectionLabel>
          <h1 className="mt-1 font-display text-4xl font-extrabold tracking-tight text-ink">
            Remediation plan
          </h1>
          <p className="mt-2 max-w-xl text-mute">
            The optimal ordered sequence of fixes for your {fmt(result.budget)}-hour
            window, followed by what was deferred.
          </p>
        </div>
        <button
          onClick={exportPlan}
          className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-5 py-2.5 text-sm font-semibold text-ink transition hover:border-ink/30"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M12 3v12m0 0l-4-4m4 4l4-4M5 21h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Export plan
        </button>
      </div>

      {/* selected — vertical execution timeline */}
      <div className="mt-10">
        <div className="mb-5 flex items-center gap-3">
          <span className="flex h-7 items-center rounded-full bg-emerald/10 px-3 text-sm font-bold text-emerald">
            {result.selected.length} selected
          </span>
          <span className="text-sm text-mute">
            reducing {fmt(result.riskReduced)} risk in {fmt(result.hoursAllocated)}h
          </span>
        </div>

        <ol className="relative">
          {result.selected.map((v, i) => (
            <li key={v.id} className="relative flex gap-5 pb-4">
              {/* rail */}
              {i < result.selected.length - 1 && (
                <span className="absolute left-[22px] top-12 h-[calc(100%-2rem)] w-0.5 bg-line" />
              )}
              <div
                className="z-10 flex h-11 w-11 flex-none items-center justify-center rounded-full font-display text-sm font-extrabold text-white"
                style={{ backgroundColor: SEVERITY_COLOR[v.severity] }}
              >
                {String(i + 1).padStart(2, "0")}
              </div>
              <button
                onClick={() => open(v)}
                className="group flex-1 rounded-2xl border border-line bg-surface p-5 text-left transition hover:border-violet/40 hover:shadow-md"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] font-semibold text-violet">
                      {v.cve}
                    </span>
                    {v.kev && <KevChip />}
                  </div>
                  <span className="rounded-full bg-canvas px-3 py-1 text-sm font-bold text-ink">
                    {v.fixTime}h
                  </span>
                </div>
                <div className="mt-1.5 font-display text-lg font-bold text-ink">
                  {v.title}
                </div>
                <div className="mt-1 text-sm font-semibold" style={{ color: SEVERITY_COLOR[v.severity] }}>
                  {riskBand(v.risk)}
                </div>
                <div className="mt-3 grid grid-cols-3 gap-3 border-t border-line pt-3">
                  <Cell label="Risk reduction" value={fmt(v.riskReduction)} />
                  <Cell label="Fix time" value={`${v.fixTime}h`} />
                  <Cell label="ROI" value={`${fmt(v.roi)}/h`} accent="#16A34A" />
                </div>
                <p className="mt-3 text-xs leading-relaxed text-mute">
                  <span className="font-semibold text-ink">Why: </span>
                  {selectionReason(v)}
                </p>
              </button>
            </li>
          ))}
        </ol>
      </div>

      {/* deferred */}
      <div className="mt-12">
        <div className="rounded-3xl border border-dashed border-line bg-surface/60 p-7">
          <h2 className="font-display text-2xl font-bold tracking-tight text-mute">
            Deferred for this window
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-mute">
            These vulnerabilities remain important but were not included in the
            current remediation window.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {result.deferred.map((v) => (
              <button
                key={v.id}
                onClick={() => open(v)}
                className="rounded-2xl border border-line bg-canvas/60 p-4 text-left opacity-90 transition hover:opacity-100"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[11px] font-semibold text-mute">
                    {v.cve}
                  </span>
                  <SeverityBadge severity={v.severity} />
                </div>
                <div className="mt-1 truncate text-sm font-semibold text-ink">
                  {v.title}
                </div>
                <div className="mt-2 flex gap-4 text-[11px] font-medium text-mute">
                  <span>Risk <b className="text-ink">{fmt(v.risk)}</b></span>
                  <span>Fix <b className="text-ink">{v.fixTime}h</b></span>
                  <span>ROI <b className="text-ink">{fmt(v.roi)}/h</b></span>
                </div>
                <p className="mt-2 text-[11px] leading-relaxed text-mute">
                  {deferralReason(v)}
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Cell({
  label,
  value,
  accent = "var(--color-ink)",
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-wider text-mute">
        {label}
      </div>
      <div className="mt-0.5 text-base font-bold" style={{ color: accent }}>
        {value}
      </div>
    </div>
  );
}
