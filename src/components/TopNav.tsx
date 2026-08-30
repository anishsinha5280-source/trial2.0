import { useState } from "react";
import { useStore, type PageId } from "../lib/store";
import { cn } from "../utils/cn";


const NAV: { id: PageId; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "findings", label: "Findings" },
  { id: "optimize", label: "Optimize" },
  { id: "plan", label: "Plan" },
  { id: "insights", label: "Insights" },
];

export function TopNav() {
  const {
    page,
    setPage,
    authedUser,
    logout,
    theme,
    toggleTheme,
    lastDatabaseAction,
  } = useStore();
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-canvas/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1240px] items-center gap-6 px-6">
        {/* brand */}
        <button
          onClick={() => setPage("overview")}
          className="flex items-center gap-3"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet text-white shadow-md shadow-violet/25">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path
                d="M4 14l5-6 4 4 7-8"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="20" cy="4" r="2" fill="currentColor" />
            </svg>
          </span>
          <span className="text-left leading-none">
            <span className="block font-display text-[15px] font-extrabold tracking-tight text-ink">
              CYBER-ROI
            </span>
            <span className="mt-0.5 block text-[10px] font-semibold uppercase tracking-[0.2em] text-mute">
              Risk Intelligence
            </span>
          </span>
        </button>

        {/* center nav */}
        <nav className="mx-auto hidden items-center gap-1 rounded-full border border-line bg-surface/70 p-1 md:flex">
          {NAV.map((n) => (
            <button
              key={n.id}
              onClick={() => setPage(n.id)}
              className={cn(
                "rounded-full px-4 py-1.5 text-sm font-semibold transition",
                page === n.id
                  ? "bg-ink text-canvas shadow-sm"
                  : "text-mute hover:text-ink"
              )}
            >
              {n.label}
            </button>
          ))}
        </nav>

        {/* right */}
        <div className="ml-auto flex items-center gap-3 md:ml-0">
          <button
            onClick={toggleTheme}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-surface text-mute transition hover:border-violet/50 hover:text-violet"
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          >
            {theme === "dark" ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2" />
                <path d="M12 2v2m0 16v2M4 12H2m20 0h-2M5 5l1.5 1.5M17.5 17.5L19 19M19 5l-1.5 1.5M6.5 17.5L5 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M20 15.5A8.5 8.5 0 018.5 4a8 8 0 1011.5 11.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>


          {/* user menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu((v) => !v)}
              className="flex h-9 items-center gap-2 rounded-full border border-line bg-surface pl-1 pr-3 text-sm font-semibold text-ink transition hover:border-ink/30"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-violet font-bold text-[11px] uppercase text-white">
                {authedUser ? authedUser.slice(0, 2) : "??"}
              </span>
              <span className="hidden sm:block">{authedUser}</span>
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                className={cn(
                  "text-mute transition-transform",
                  showUserMenu && "rotate-180"
                )}
              >
                <path
                  d="M6 9l6 6 6-6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            {showUserMenu && (
              <>
                {/* backdrop */}
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setShowUserMenu(false)}
                />
                {/* dropdown */}
                <div className="absolute right-0 top-full z-40 mt-2 w-56 overflow-hidden rounded-2xl border border-line bg-surface shadow-xl shadow-ink/[0.08]">
                  <div className="border-b border-line px-4 py-3">
                    <div className="text-xs font-semibold uppercase tracking-wider text-mute">
                      Signed in as
                    </div>
                    <div className="mt-0.5 font-semibold text-ink">
                      {authedUser}
                    </div>
                    <div className="mt-2 inline-flex rounded-full bg-canvas px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-mute">
                      Database {lastDatabaseAction ?? "loaded"}
                    </div>
                  </div>
                  <div className="p-1.5">
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        setPage("import");
                      }}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-ink transition hover:bg-canvas"
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                        <path d="M12 16V4m0 0L7 9m5-5l5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                      Import findings
                    </button>
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        logout();
                      }}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-crimson transition hover:bg-crimson/[0.06]"
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                        <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      Sign out
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* mobile nav */}
      <nav className="flex items-center gap-1 overflow-x-auto border-t border-line/70 px-4 py-2 md:hidden">
        {NAV.map((n) => (
          <button
            key={n.id}
            onClick={() => setPage(n.id)}
            className={cn(
              "whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-semibold transition",
              page === n.id ? "bg-ink text-canvas" : "text-mute"
            )}
          >
            {n.label}
          </button>
        ))}
      </nav>
    </header>
  );
}
