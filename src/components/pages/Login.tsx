import { useState } from "react";
import type { AuthResult, ThemeMode } from "../../lib/store";
import { cn } from "../../utils/cn";

interface Props {
  login: (username: string, password: string) => Promise<AuthResult> | AuthResult;
  register: (username: string, password: string) => Promise<AuthResult> | AuthResult;
  knownUsers: string[];
  theme: ThemeMode;
  toggleTheme: () => void;
}

type Mode = "signin" | "create";

export function Login({
  login,
  register,
  knownUsers,
  theme,
  toggleTheme,
}: Props) {
  const [mode, setMode] = useState<Mode>("signin");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);

  const savedUsers = knownUsers.filter(Boolean).slice(0, 6);

  function fail(message: string) {
    setLoading(false);
    setError(message);
    setShake(true);
    setTimeout(() => setShake(false), 600);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (mode === "create" && password !== confirmPassword) {
      fail("Passwords do not match.");
      return;
    }

    setLoading(true);

    // Keep a short auth round-trip so the interface feels operational.
    setTimeout(async () => {
      const result =
        await (mode === "signin"
          ? login(username, password)
          : register(username, password));

      if (!result.ok) {
        fail(result.message ?? "Unable to authenticate.");
      }
    }, 600);
  }

  function fillDemo(user: "admin" | "analyst") {
    setMode("signin");
    setUsername(user);
    setPassword(user === "admin" ? "cyber-roi-2026" : "risk-intel");
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-canvas px-4 py-10 text-ink">
      <button
        onClick={toggleTheme}
        className="absolute right-5 top-5 inline-flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-2 text-sm font-semibold text-ink transition hover:border-violet/50"
      >
        <ThemeIcon theme={theme} />
        {theme === "dark" ? "Light mode" : "Dark mode"}
      </button>

      <div
        aria-hidden
        className="pointer-events-none fixed left-1/2 top-0 -z-10 h-[520px] w-[820px] -translate-x-1/2 -translate-y-1/3 rounded-full opacity-[0.10]"
        style={{
          background:
            "radial-gradient(ellipse at center, #5B3DF5 0%, transparent 70%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none fixed bottom-0 right-0 -z-10 h-[400px] w-[500px] translate-x-1/4 translate-y-1/4 rounded-full opacity-[0.08]"
        style={{
          background:
            "radial-gradient(ellipse at center, #2563EB 0%, transparent 70%)",
        }}
      />

      <div
        className={cn(
          "w-full max-w-[460px] rounded-3xl border border-line bg-surface shadow-2xl shadow-ink/[0.07] transition-all",
          shake && "animate-[shake_0.5s_ease]"
        )}
      >
        <div className="flex flex-col items-center rounded-t-3xl border-b border-line px-8 py-8">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet shadow-lg shadow-violet/30">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
              <path
                d="M4 14l5-6 4 4 7-8"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="20" cy="4" r="2" fill="white" />
            </svg>
          </div>
          <div className="mt-4 text-center">
            <div className="font-display text-xl font-extrabold tracking-tight text-ink">
              CYBER-ROI
            </div>
            <div className="mt-0.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-mute">
              Risk Intelligence
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="px-8 py-8">
          <div className="mb-6 grid grid-cols-2 rounded-full border border-line bg-canvas p-1">
            <button
              type="button"
              onClick={() => {
                setMode("signin");
                setError(null);
              }}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-bold transition",
                mode === "signin" ? "bg-ink text-canvas" : "text-mute"
              )}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("create");
                setError(null);
              }}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-bold transition",
                mode === "create" ? "bg-violet text-white" : "text-mute"
              )}
            >
              Create user
            </button>
          </div>

          <h1 className="font-display text-2xl font-bold tracking-tight text-ink">
            {mode === "signin" ? "Admin sign-in" : "Create saved login"}
          </h1>
          <p className="mt-1 text-sm text-mute">
            {mode === "signin"
              ? "Returning users load their saved workspace automatically."
              : "New users get a separate local database for findings and plans."}
          </p>

          {mode === "signin" && savedUsers.length > 0 && (
            <div className="mt-5">
              <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-mute">
                Saved logins on this device
              </div>
              <div className="flex flex-wrap gap-2">
                {savedUsers.map((user) => (
                  <button
                    key={user}
                    type="button"
                    onClick={() => setUsername(user)}
                    className="rounded-full border border-line bg-canvas px-3 py-1.5 text-xs font-semibold text-ink transition hover:border-violet/50 hover:text-violet"
                  >
                    {user}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-7 space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-mute">
                Username
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-mute">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.8" />
                    <path
                      d="M5 20c1.2-3.4 4-5 7-5s5.8 1.6 7 5"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
                <input
                  type="text"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={mode === "signin" ? "admin" : "new.user"}
                  required
                  className="w-full rounded-xl border border-line bg-canvas py-3 pl-10 pr-4 text-sm text-ink placeholder:text-mute/60 transition focus:border-violet focus:outline-none focus:ring-2 focus:ring-violet/15"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-mute">
                Password
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-mute">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.8" />
                    <path d="M8 11V7a4 4 0 118 0v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    <circle cx="12" cy="16" r="1.2" fill="currentColor" />
                  </svg>
                </span>
                <input
                  type={showPw ? "text" : "password"}
                  autoComplete={mode === "signin" ? "current-password" : "new-password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="************"
                  required
                  className="w-full rounded-xl border border-line bg-canvas py-3 pl-10 pr-12 text-sm text-ink placeholder:text-mute/60 transition focus:border-violet focus:outline-none focus:ring-2 focus:ring-violet/15"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-mute transition hover:text-ink"
                  tabIndex={-1}
                >
                  <EyeIcon hidden={showPw} />
                </button>
              </div>
            </div>

            {mode === "create" && (
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-mute">
                  Confirm password
                </label>
                <input
                  type={showPw ? "text" : "password"}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat password"
                  required
                  className="w-full rounded-xl border border-line bg-canvas px-4 py-3 text-sm text-ink placeholder:text-mute/60 transition focus:border-violet focus:outline-none focus:ring-2 focus:ring-violet/15"
                />
              </div>
            )}
          </div>

          {error && (
            <div className="mt-4 flex items-center gap-2.5 rounded-xl border border-crimson/25 bg-crimson/[0.06] px-4 py-3">
              <svg className="flex-none text-crimson" width="15" height="15" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
                <path d="M12 8v4m0 4h.01" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
              </svg>
              <span className="text-sm font-medium text-crimson">{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={cn(
              "mt-6 flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold text-white transition",
              loading
                ? "cursor-not-allowed bg-violet/60"
                : "bg-violet shadow-md shadow-violet/30 hover:bg-violet/90"
            )}
          >
            {loading ? (
              <>
                <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="9" stroke="white" strokeWidth="2.5" strokeDasharray="40 20" />
                </svg>
                {mode === "signin" ? "Loading workspace..." : "Creating database..."}
              </>
            ) : mode === "signin" ? (
              "Sign in to Risk Intelligence"
            ) : (
              "Create user database"
            )}
          </button>

          <p className="mt-5 text-center text-[11px] text-mute">
            Demo credentials -{" "}
            <button
              type="button"
              onClick={() => fillDemo("admin")}
              className="font-semibold text-violet underline underline-offset-2 hover:no-underline"
            >
              fill admin
            </button>{" "}
            /{" "}
            <button
              type="button"
              onClick={() => fillDemo("analyst")}
              className="font-semibold text-violet underline underline-offset-2 hover:no-underline"
            >
              fill analyst
            </button>
          </p>
        </form>
      </div>

      <p className="mt-8 max-w-md text-center text-xs leading-relaxed text-mute">
        User accounts and each user database are stored locally in this browser
        for the demo. Production deployments should connect this flow to your
        backend auth and database layer.
      </p>
    </div>
  );
}

function ThemeIcon({ theme }: { theme: ThemeMode }) {
  if (theme === "dark") {
    return (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2" />
        <path d="M12 2v2m0 16v2M4 12H2m20 0h-2M5 5l1.5 1.5M17.5 17.5L19 19M19 5l-1.5 1.5M6.5 17.5L5 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
      <path
        d="M20 15.5A8.5 8.5 0 018.5 4a8 8 0 1011.5 11.5z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function EyeIcon({ hidden }: { hidden: boolean }) {
  if (hidden) {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path
          d="M3 3l18 18M10.5 10.7A3 3 0 0013.3 13.5M6.3 6.4C4.5 7.7 3 9.7 3 12c0 0 3 6 9 6a9.3 9.3 0 005.7-2M9 4.8A9 9 0 0121 12s-.6 1.5-1.7 3"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path
        d="M3 12s3-6 9-6 9 6 9 6-3 6-9 6-9-6-9-6z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}