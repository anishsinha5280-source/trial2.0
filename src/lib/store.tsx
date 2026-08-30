import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { OptimizationResult, ScoredVuln, Vulnerability } from "./types";
import {
  baselineSeverityFirst,
  baselineTopDown,
  optimize,
  scoreAll,
} from "./risk";
import { demoVulnerabilities } from "../data/demo";
import {
  supabase,
  isSupabaseConfigured,
  usernameToAuthEmail,
  toDbVulnerability,
  fromDbVulnerability,
  type WorkspaceRow,
  type VulnerabilityRow,
} from "./supabase";

export type PageId =
  | "overview"
  | "findings"
  | "optimize"
  | "plan"
  | "insights"
  | "import";

export type ThemeMode = "light" | "dark";

export interface ImportSummary {
  total: number;
  valid: number;
  warnings: number;
}

export interface AuthResult {
  ok: boolean;
  message?: string;
  username?: string;
  database: "created" | "loaded" | null;
}

interface Store {
  page: PageId;
  setPage: (p: PageId) => void;

  raw: Vulnerability[];
  scored: ScoredVuln[];
  loaded: boolean;
  importSummary: ImportSummary | null;
  loadDemo: () => void;
  importData: (v: Vulnerability[], summary: ImportSummary) => void;
  addVulnerability: (v: Vulnerability) => void;
  removeVulnerability: (id: string) => void;
  clearData: () => void;

  budget: number;
  setBudget: (h: number) => void;

  result: OptimizationResult;
  baseline: OptimizationResult;
  topDown: OptimizationResult;

  selectedCve: string | null;
  setSelectedCve: (id: string | null) => void;

  backendConnected: boolean;

  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;

  authedUser: string | null;
  knownUsers: string[];
  lastDatabaseAction: "created" | "loaded" | null;
  login: (username: string, password: string) => Promise<AuthResult> | AuthResult;
  register: (username: string, password: string) => Promise<AuthResult> | AuthResult;
  logout: () => void;
}

const Ctx = createContext<Store | null>(null);

const KNOWN_USERS_KEY = "cyber-roi-known-users";

const DEFAULT_IMPORT_SUMMARY: ImportSummary = {
  total: 52,
  valid: 48,
  warnings: 4,
};

const DEFAULT_ADMIN_USERS = [
  { username: "admin", password: "cyber-roi-2026" },
  { username: "analyst", password: "risk-intel" },
];

function normalizeUser(username: string): string {
  return username.trim().toLowerCase();
}

function shouldSeedDemo(username: string): boolean {
  return DEFAULT_ADMIN_USERS.some((u) => u.username === normalizeUser(username));
}

function getSavedKnownUsers(): string[] {
  try {
    const raw = localStorage.getItem(KNOWN_USERS_KEY);
    const parsed = raw ? (JSON.parse(raw) as string[]) : [];
    const set = new Set<string>([
      ...DEFAULT_ADMIN_USERS.map((u) => u.username),
      ...parsed,
    ]);
    return Array.from(set).sort();
  } catch {
    return DEFAULT_ADMIN_USERS.map((u) => u.username);
  }
}

function saveKnownUser(username: string): string[] {
  try {
    const list = getSavedKnownUsers();
    const set = new Set([...list, normalizeUser(username)]);
    const updated = Array.from(set).sort();
    localStorage.setItem(KNOWN_USERS_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return getSavedKnownUsers();
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [page, setPage] = useState<PageId>("overview");
  const [raw, setRaw] = useState<Vulnerability[]>(demoVulnerabilities);
  const [loaded, setLoaded] = useState<boolean>(true);
  const [importSummary, setImportSummary] = useState<ImportSummary | null>(
    DEFAULT_IMPORT_SUMMARY
  );
  const [budget, setBudgetState] = useState<number>(60);
  const [selectedCve, setSelectedCveState] = useState<string | null>(null);
  const [backendConnected, setBackendConnected] = useState(false);
  const [theme, setThemeState] = useState<ThemeMode>("light");
  const [authedUser, setAuthedUser] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [knownUsers, setKnownUsers] = useState<string[]>(getSavedKnownUsers);
  const [lastDatabaseAction, setLastDatabaseAction] = useState<
    "created" | "loaded" | null
  >(null);

  const userIdRef = useRef<string | null>(null);
  userIdRef.current = currentUserId;

  const authedUserRef = useRef<string | null>(null);
  authedUserRef.current = authedUser;

  // Apply theme to DOM
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  // Check Supabase connectivity
  async function checkConnectivity() {
    if (!isSupabaseConfigured) {
      setBackendConnected(false);
      return;
    }
    try {
      const { error } = await supabase.auth.getSession();
      if (error) {
        setBackendConnected(false);
      } else {
        setBackendConnected(true);
      }
    } catch {
      setBackendConnected(false);
    }
  }

  // Seed user data in Supabase if not yet present
  async function seedUserData(
    uid: string,
    username: string,
    withDemoData: boolean,
    activeTheme: ThemeMode
  ) {
    const now = new Date().toISOString();
    try {
      // 1. Profile
      await supabase.from("profiles").upsert(
        {
          id: uid,
          username,
          created_at: now,
          last_login_at: now,
        },
        { onConflict: "id" }
      );

      // 2. Workspace
      await supabase.from("workspaces").upsert(
        {
          user_id: uid,
          loaded: withDemoData,
          import_summary: withDemoData ? DEFAULT_IMPORT_SUMMARY : null,
          budget: 60,
          selected_cve: null,
          page: withDemoData ? "overview" : "import",
          theme: activeTheme,
          created_at: now,
          updated_at: now,
        },
        { onConflict: "user_id" }
      );

      // 3. Vulnerabilities
      if (withDemoData) {
        await supabase.from("vulnerabilities").delete().eq("user_id", uid);
        const rows = demoVulnerabilities.map((v) => toDbVulnerability(v, uid));
        if (rows.length > 0) {
          await supabase.from("vulnerabilities").insert(rows);
        }
      }
    } catch (err) {
      console.error("Error seeding user data:", err);
    }
  }

  // Load user data from Supabase
  async function loadUserData(
    uid: string,
    username: string
  ): Promise<"created" | "loaded"> {
    try {
      // Query workspace
      const { data: wsData, error: wsError } = await supabase
        .from("workspaces")
        .select("*")
        .eq("user_id", uid)
        .maybeSingle();

      // Query vulnerabilities
      const { data: vData } = await supabase
        .from("vulnerabilities")
        .select("*")
        .eq("user_id", uid)
        .order("created_at", { ascending: false });

      if (!wsData || wsError) {
        const seedDemo = shouldSeedDemo(username);
        await seedUserData(uid, username, seedDemo, theme);
        setRaw(seedDemo ? demoVulnerabilities : []);
        setLoaded(seedDemo);
        setImportSummary(seedDemo ? DEFAULT_IMPORT_SUMMARY : null);
        setBudgetState(60);
        setSelectedCveState(null);
        setPage(seedDemo ? "overview" : "import");
        return "created";
      }

      const workspace = wsData as WorkspaceRow;
      const vulns = ((vData as VulnerabilityRow[]) || []).map(fromDbVulnerability);

      setRaw(vulns);
      setLoaded(workspace.loaded);
      setImportSummary(workspace.import_summary);
      setBudgetState(Number(workspace.budget) || 60);
      setSelectedCveState(workspace.selected_cve);
      setPage((workspace.page as PageId) || "overview");
      setThemeState((workspace.theme as ThemeMode) || "light");

      return "loaded";
    } catch (err) {
      console.error("Error loading user data from Supabase:", err);
      return "loaded";
    }
  }

  // Initialize and restore active session on mount
  useEffect(() => {
    checkConnectivity();

    let mounted = true;

    async function initSession() {
      try {
        const { data } = await supabase.auth.getSession();
        const session = data?.session;
        if (session?.user && mounted) {
          const uid = session.user.id;
          let username =
            session.user.user_metadata?.username ||
            session.user.email?.split("@")[0] ||
            "user";
          username = normalizeUser(username);

          setCurrentUserId(uid);
          setAuthedUser(username);
          setKnownUsers(saveKnownUser(username));

          const action = await loadUserData(uid, username);
          if (mounted) {
            setLastDatabaseAction(action);
          }
        }
      } catch (err) {
        console.error("Session initialization error:", err);
      }
    }

    initSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === "SIGNED_OUT") {
        if (mounted) {
          setAuthedUser(null);
          setCurrentUserId(null);
          setLastDatabaseAction(null);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const scored = useMemo(() => scoreAll(raw), [raw]);
  const result = useMemo(() => optimize(scored, budget), [scored, budget]);
  const baseline = useMemo(
    () => baselineSeverityFirst(scored, budget),
    [scored, budget]
  );
  const topDown = useMemo(
    () => baselineTopDown(scored, budget),
    [scored, budget]
  );

  function setPageWithPersist(p: PageId) {
    setPage(p);
    const uid = userIdRef.current;
    if (uid && isSupabaseConfigured) {
      supabase
        .from("workspaces")
        .update({ page: p, updated_at: new Date().toISOString() })
        .eq("user_id", uid)
        .then(() => {});
    }
  }

  function setBudget(b: number) {
    setBudgetState(b);
    const uid = userIdRef.current;
    if (uid && isSupabaseConfigured) {
      supabase
        .from("workspaces")
        .update({ budget: b, updated_at: new Date().toISOString() })
        .eq("user_id", uid)
        .then(() => {});
    }
  }

  function setSelectedCve(cve: string | null) {
    setSelectedCveState(cve);
    const uid = userIdRef.current;
    if (uid && isSupabaseConfigured) {
      supabase
        .from("workspaces")
        .update({ selected_cve: cve, updated_at: new Date().toISOString() })
        .eq("user_id", uid)
        .then(() => {});
    }
  }

  function setTheme(t: ThemeMode) {
    setThemeState(t);
    const uid = userIdRef.current;
    if (uid && isSupabaseConfigured) {
      supabase
        .from("workspaces")
        .update({ theme: t, updated_at: new Date().toISOString() })
        .eq("user_id", uid)
        .then(() => {});
    }
  }

  async function login(
    usernameInput: string,
    password: string
  ): Promise<AuthResult> {
    const username = normalizeUser(usernameInput);
    if (!username || !password) {
      return {
        ok: false,
        message: "Enter a username and password.",
        database: null,
      };
    }

    if (!isSupabaseConfigured) {
      // Fallback for unconfigured Supabase in development/demo
      return {
        ok: false,
        message: "Supabase connection is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.",
        database: null,
      };
    }

    const email = usernameToAuthEmail(username);

    let signInRes = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    // If login failed and it's a default demo account with default password, auto-create it
    if (signInRes.error && shouldSeedDemo(username)) {
      const isDemoCred = DEFAULT_ADMIN_USERS.some(
        (u) => u.username === username && u.password === password
      );
      if (isDemoCred) {
        const signUpRes = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { username },
          },
        });
        if (signUpRes.data?.user) {
          signInRes = await supabase.auth.signInWithPassword({
            email,
            password,
          });
        }
      }
    }

    if (signInRes.error || !signInRes.data?.user) {
      return {
        ok: false,
        message: "Incorrect username or password.",
        database: null,
      };
    }

    const user = signInRes.data.user;
    setCurrentUserId(user.id);
    setAuthedUser(username);
    setKnownUsers(saveKnownUser(username));

    // Update last login timestamp in profile
    await supabase.from("profiles").upsert({
      id: user.id,
      username,
      last_login_at: new Date().toISOString(),
    });

    const action = await loadUserData(user.id, username);
    setLastDatabaseAction(action);
    setBackendConnected(true);

    return { ok: true, username, database: action };
  }

  async function register(
    usernameInput: string,
    password: string
  ): Promise<AuthResult> {
    const username = normalizeUser(usernameInput);
    if (!/^[a-z0-9._-]{3,24}$/.test(username)) {
      return {
        ok: false,
        message:
          "Use 3-24 characters: letters, numbers, dots, dashes or underscores.",
        database: null,
      };
    }
    if (password.length < 8) {
      return {
        ok: false,
        message: "Use at least 8 characters for the password.",
        database: null,
      };
    }

    if (!isSupabaseConfigured) {
      return {
        ok: false,
        message: "Supabase connection is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.",
        database: null,
      };
    }

    const email = usernameToAuthEmail(username);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username },
      },
    });

    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes("already registered") || msg.includes("exists")) {
        return {
          ok: false,
          message: "That username already exists. Sign in instead.",
          database: null,
        };
      }
      return {
        ok: false,
        message: error.message,
        database: null,
      };
    }

    const user = data.user;
    if (!user) {
      return {
        ok: false,
        message: "Registration failed. Please try again.",
        database: null,
      };
    }

    // Ensure session is active
    let sessionUser = user;
    if (!data.session) {
      const signInRes = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInRes.data?.user) {
        sessionUser = signInRes.data.user;
      }
    }

    setCurrentUserId(sessionUser.id);
    setAuthedUser(username);
    setKnownUsers(saveKnownUser(username));

    // Seed new user workspace in Supabase
    await seedUserData(sessionUser.id, username, false, theme);
    setRaw([]);
    setLoaded(false);
    setImportSummary(null);
    setBudgetState(60);
    setSelectedCveState(null);
    setPage("import");
    setLastDatabaseAction("created");
    setBackendConnected(true);

    return { ok: true, username, database: "created" };
  }

  async function logout() {
    if (isSupabaseConfigured) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.error("Sign out error:", err);
      }
    }
    setAuthedUser(null);
    setCurrentUserId(null);
    setLastDatabaseAction(null);
  }

  const value: Store = {
    page,
    setPage: setPageWithPersist,
    raw,
    scored,
    loaded,
    importSummary,
    loadDemo: () => {
      setRaw(demoVulnerabilities);
      setLoaded(true);
      setImportSummary(DEFAULT_IMPORT_SUMMARY);
      const uid = userIdRef.current;
      if (uid && isSupabaseConfigured) {
        (async () => {
          try {
            await supabase.from("vulnerabilities").delete().eq("user_id", uid);
            const rows = demoVulnerabilities.map((v) =>
              toDbVulnerability(v, uid)
            );
            if (rows.length > 0) {
              await supabase.from("vulnerabilities").insert(rows);
            }
            await supabase
              .from("workspaces")
              .update({
                loaded: true,
                import_summary: DEFAULT_IMPORT_SUMMARY,
                updated_at: new Date().toISOString(),
              })
              .eq("user_id", uid);
          } catch (err) {
            console.error("Error persisting loadDemo to Supabase:", err);
          }
        })();
      }
    },
    importData: (v, summary) => {
      setRaw(v);
      setLoaded(true);
      setImportSummary(summary);
      const uid = userIdRef.current;
      if (uid && isSupabaseConfigured) {
        (async () => {
          try {
            await supabase.from("vulnerabilities").delete().eq("user_id", uid);
            const rows = v.map((item) => toDbVulnerability(item, uid));
            if (rows.length > 0) {
              await supabase.from("vulnerabilities").insert(rows);
            }
            await supabase
              .from("workspaces")
              .update({
                loaded: true,
                import_summary: summary,
                updated_at: new Date().toISOString(),
              })
              .eq("user_id", uid);
          } catch (err) {
            console.error("Error persisting importData to Supabase:", err);
          }
        })();
      }
    },
    addVulnerability: (v) => {
      setRaw((prev) => [v, ...prev]);
      setLoaded(true);
      const nextSummary: ImportSummary = {
        total: (importSummary?.total ?? 0) + 1,
        valid: (importSummary?.valid ?? 0) + 1,
        warnings: importSummary?.warnings ?? 0,
      };
      setImportSummary(nextSummary);

      const uid = userIdRef.current;
      if (uid && isSupabaseConfigured) {
        (async () => {
          try {
            await supabase
              .from("vulnerabilities")
              .insert(toDbVulnerability(v, uid));
            await supabase
              .from("workspaces")
              .update({
                loaded: true,
                import_summary: nextSummary,
                updated_at: new Date().toISOString(),
              })
              .eq("user_id", uid);
          } catch (err) {
            console.error("Error adding vulnerability to Supabase:", err);
          }
        })();
      }
    },
    removeVulnerability: (id) => {
      setRaw((prev) => prev.filter((v) => v.id !== id));
      const uid = userIdRef.current;
      if (uid && isSupabaseConfigured) {
        supabase
          .from("vulnerabilities")
          .delete()
          .eq("user_id", uid)
          .eq("id", id)
          .then(() => {});
      }
    },
    clearData: () => {
      setRaw([]);
      setLoaded(false);
      setImportSummary(null);
      const uid = userIdRef.current;
      if (uid && isSupabaseConfigured) {
        (async () => {
          try {
            await supabase.from("vulnerabilities").delete().eq("user_id", uid);
            await supabase
              .from("workspaces")
              .update({
                loaded: false,
                import_summary: null,
                updated_at: new Date().toISOString(),
              })
              .eq("user_id", uid);
          } catch (err) {
            console.error("Error clearing data in Supabase:", err);
          }
        })();
      }
    },
    budget,
    setBudget,
    result,
    baseline,
    topDown,
    selectedCve,
    setSelectedCve,
    backendConnected,
    theme,
    setTheme,
    toggleTheme: () => setTheme(theme === "dark" ? "light" : "dark"),
    authedUser,
    knownUsers,
    lastDatabaseAction,
    login,
    register,
    logout,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error("useStore must be used within StoreProvider");
  return s;
}