import type {
  OptimizationResult,
  ScoredVuln,
  Severity,
  Vulnerability,
} from "./types";

/**
 * Composite risk model.
 * Combines CVSS (severity), EPSS (exploit likelihood), CISA KEV (active
 * exploitation) and asset criticality into a single 0 - 100 risk score.
 */
export function computeRisk(v: Vulnerability): number {
  const severity = v.cvss / 10; // 0 - 1
  const exploit = v.epss; // 0 - 1
  const kev = v.kev ? 1 : 0; // 0 / 1
  const asset = v.assetCriticality / 5; // 0 - 1

  const composite =
    100 * (0.34 * severity + 0.28 * exploit + 0.22 * kev + 0.16 * asset);

  return Math.round(composite * 10) / 10;
}

export function severityFromCvss(cvss: number): Severity {
  if (cvss >= 9) return "CRITICAL";
  if (cvss >= 7) return "HIGH";
  if (cvss >= 4) return "MEDIUM";
  return "LOW";
}

export function scoreVuln(v: Vulnerability): ScoredVuln {
  const risk = computeRisk(v);
  const roi = Math.round((risk / v.fixTime) * 10) / 10;
  return {
    ...v,
    severity: severityFromCvss(v.cvss),
    risk,
    riskReduction: risk,
    roi,
  };
}

export function scoreAll(vulns: Vulnerability[]): ScoredVuln[] {
  return vulns.map(scoreVuln);
}

/**
 * 0/1 Knapsack optimization.
 * Maximize total risk reduction subject to a remediation time budget.
 * Time is discretized to 0.5h units so fractional fix times are supported.
 */
export function optimize(
  scored: ScoredVuln[],
  budgetHours: number
): OptimizationResult {
  const UNIT = 0.5;
  const capacity = Math.round(budgetHours / UNIT); // integer half-hours
  const items = scored.map((v) => ({
    v,
    w: Math.max(1, Math.round(v.fixTime / UNIT)),
    value: v.riskReduction,
  }));

  const n = items.length;
  // dp[i][c] = best value using first i items within capacity c
  const dp: number[][] = Array.from({ length: n + 1 }, () =>
    new Array(capacity + 1).fill(0)
  );

  for (let i = 1; i <= n; i++) {
    const { w, value } = items[i - 1];
    for (let c = 0; c <= capacity; c++) {
      dp[i][c] = dp[i - 1][c];
      if (w <= c) {
        const cand = dp[i - 1][c - w] + value;
        if (cand > dp[i][c]) dp[i][c] = cand;
      }
    }
  }

  // backtrack
  const selectedFlags = new Array(n).fill(false);
  let c = capacity;
  for (let i = n; i >= 1; i--) {
    if (dp[i][c] !== dp[i - 1][c]) {
      selectedFlags[i - 1] = true;
      c -= items[i - 1].w;
    }
  }

  const selected: ScoredVuln[] = [];
  const deferred: ScoredVuln[] = [];
  items.forEach((it, idx) => {
    if (selectedFlags[idx]) selected.push(it.v);
    else deferred.push(it.v);
  });

  // execute highest ROI first for the timeline
  selected.sort((a, b) => b.roi - a.roi);
  deferred.sort((a, b) => b.risk - a.risk);

  const totalRiskBefore = round(scored.reduce((s, v) => s + v.risk, 0));
  const riskReduced = round(selected.reduce((s, v) => s + v.riskReduction, 0));
  const hoursAllocated = round(selected.reduce((s, v) => s + v.fixTime, 0));

  return {
    budget: budgetHours,
    selected,
    deferred,
    totalRiskBefore,
    totalRiskAfter: round(totalRiskBefore - riskReduced),
    riskReduced,
    hoursAllocated,
    hoursRemaining: round(budgetHours - hoursAllocated),
  };
}

/**
 * Baseline: severity-first (CVSS-first) prioritization within the same budget.
 * Greedily takes highest CVSS until time runs out. Used to demonstrate the
 * inefficiency of naive severity-first triage.
 */
export function baselineSeverityFirst(
  scored: ScoredVuln[],
  budgetHours: number
): OptimizationResult {
  const sorted = [...scored].sort((a, b) => {
    if (b.cvss !== a.cvss) return b.cvss - a.cvss;
    return b.risk - a.risk;
  });

  const selected: ScoredVuln[] = [];
  const deferred: ScoredVuln[] = [];
  let used = 0;
  for (const v of sorted) {
    if (used + v.fixTime <= budgetHours + 1e-9) {
      selected.push(v);
      used += v.fixTime;
    } else {
      deferred.push(v);
    }
  }

  const totalRiskBefore = round(scored.reduce((s, v) => s + v.risk, 0));
  const riskReduced = round(selected.reduce((s, v) => s + v.riskReduction, 0));
  const hoursAllocated = round(used);

  return {
    budget: budgetHours,
    selected,
    deferred,
    totalRiskBefore,
    totalRiskAfter: round(totalRiskBefore - riskReduced),
    riskReduced,
    hoursAllocated,
    hoursRemaining: round(budgetHours - hoursAllocated),
  };
}

/**
 * Baseline: top-down (risk-first) prioritization within the same budget.
 * Greedily fixes the highest composite-risk items first until time runs out.
 * This is the intuitive "worst first" triage most teams reach for — it ignores
 * how expensive each fix is, so it often spends the whole budget on a few big
 * items and leaves cheap high-value fixes on the table.
 */
export function baselineTopDown(
  scored: ScoredVuln[],
  budgetHours: number
): OptimizationResult {
  const sorted = [...scored].sort((a, b) => {
    if (b.risk !== a.risk) return b.risk - a.risk;
    return a.fixTime - b.fixTime;
  });

  const selected: ScoredVuln[] = [];
  const deferred: ScoredVuln[] = [];
  let used = 0;
  for (const v of sorted) {
    if (used + v.fixTime <= budgetHours + 1e-9) {
      selected.push(v);
      used += v.fixTime;
    } else {
      deferred.push(v);
    }
  }

  const totalRiskBefore = round(scored.reduce((s, v) => s + v.risk, 0));
  const riskReduced = round(selected.reduce((s, v) => s + v.riskReduction, 0));
  const hoursAllocated = round(used);

  return {
    budget: budgetHours,
    selected,
    deferred,
    totalRiskBefore,
    totalRiskAfter: round(totalRiskBefore - riskReduced),
    riskReduced,
    hoursAllocated,
    hoursRemaining: round(budgetHours - hoursAllocated),
  };
}

/** Reason a vulnerability was selected, for explainability. */
export function selectionReason(v: ScoredVuln): string {
  if (v.kev && v.internetFacing)
    return "Actively exploited (KEV) and internet-facing — high ROI within budget.";
  if (v.kev) return "Listed in CISA KEV — confirmed active exploitation.";
  if (v.roi >= 40)
    return "Exceptional risk-reduction per hour relative to its fix cost.";
  if (v.epss >= 0.5)
    return "High exploit probability (EPSS) makes early remediation efficient.";
  return "Strong risk reduction achievable within the remaining time budget.";
}

export function deferralReason(v: ScoredVuln): string {
  if (v.fixTime >= 6)
    return "High remediation cost — better value available elsewhere this window.";
  if (v.roi < 15)
    return "Low risk reduction per hour; deprioritized against higher-ROI fixes.";
  return "Budget exhausted before this fix could be scheduled.";
}

function round(n: number): number {
  return Math.round(n * 10) / 10;
}
