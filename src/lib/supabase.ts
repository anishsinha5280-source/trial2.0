import { createClient } from "@supabase/supabase-js";
import type { Vulnerability } from "./types";
import type { ImportSummary, PageId, ThemeMode } from "./store";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "placeholder-key";

export const isSupabaseConfigured = Boolean(
  import.meta.env.VITE_SUPABASE_URL &&
    import.meta.env.VITE_SUPABASE_ANON_KEY &&
    import.meta.env.VITE_SUPABASE_URL !== "https://placeholder.supabase.co"
);

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export interface ProfileRow {
  id: string;
  username: string;
  created_at: string;
  last_login_at: string | null;
}

export interface WorkspaceRow {
  user_id: string;
  loaded: boolean;
  import_summary: ImportSummary | null;
  budget: number;
  selected_cve: string | null;
  page: PageId;
  theme: ThemeMode;
  created_at: string;
  updated_at: string;
}

export interface VulnerabilityRow {
  user_id: string;
  id: string;
  cve: string;
  title: string;
  description: string;
  cvss: number;
  epss: number;
  kev: boolean;
  asset_criticality: number;
  fix_time: number;
  internet_facing: boolean | null;
  created_at?: string;
}

export function usernameToAuthEmail(username: string): string {
  return `${username.trim().toLowerCase()}@cyber-roi.local`;
}

export function toDbVulnerability(
  v: Vulnerability,
  userId: string
): VulnerabilityRow {
  return {
    user_id: userId,
    id: v.id,
    cve: v.cve,
    title: v.title,
    description: v.description || "",
    cvss: Number(v.cvss),
    epss: Number(v.epss),
    kev: Boolean(v.kev),
    asset_criticality: Number(v.assetCriticality),
    fix_time: Number(v.fixTime),
    internet_facing: v.internetFacing ?? false,
  };
}

export function fromDbVulnerability(row: VulnerabilityRow): Vulnerability {
  return {
    id: row.id,
    cve: row.cve,
    title: row.title,
    description: row.description || "",
    cvss: Number(row.cvss),
    epss: Number(row.epss),
    kev: Boolean(row.kev),
    assetCriticality: Number(row.asset_criticality),
    fixTime: Number(row.fix_time),
    internetFacing: Boolean(row.internet_facing),
  };
}
