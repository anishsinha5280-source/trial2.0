export type Severity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

export interface Vulnerability {
  id: string;
  cve: string;
  title: string;
  description: string;
  cvss: number; // 0 - 10
  epss: number; // 0 - 1 (exploit prediction)
  kev: boolean; // CISA Known Exploited Vulnerability
  assetCriticality: number; // 1 - 5
  fixTime: number; // hours to remediate
  internetFacing?: boolean;
}

export interface ScoredVuln extends Vulnerability {
  severity: Severity;
  risk: number; // composite risk points 0 - 100
  riskReduction: number; // points removed if fixed (== risk here)
  roi: number; // risk reduction per hour
}

export interface OptimizationResult {
  budget: number;
  selected: ScoredVuln[];
  deferred: ScoredVuln[];
  totalRiskBefore: number;
  totalRiskAfter: number;
  riskReduced: number;
  hoursAllocated: number;
  hoursRemaining: number;
}
