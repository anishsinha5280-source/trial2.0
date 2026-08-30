import type { Severity } from "./types";

export const SEVERITY_COLOR: Record<Severity, string> = {
  CRITICAL: "#DC2626",
  HIGH: "#D97706",
  MEDIUM: "#2563EB",
  LOW: "#6b6862",
};

export const SEVERITY_SOFT: Record<Severity, string> = {
  CRITICAL: "#FBEBEB",
  HIGH: "#FBF1E3",
  MEDIUM: "#E9F0FE",
  LOW: "#EFEDE7",
};

export function fmt(n: number, digits = 1): string {
  return n.toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export function fmt0(n: number): string {
  return Math.round(n).toLocaleString();
}

export function hours(n: number): string {
  return `${n % 1 === 0 ? n.toFixed(0) : n.toFixed(1)}h`;
}

export function riskBand(risk: number): string {
  if (risk >= 70) return "Very High Risk";
  if (risk >= 50) return "High Risk";
  if (risk >= 30) return "Medium Risk";
  return "Low Risk";
}
