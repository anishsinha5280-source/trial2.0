import { StoreProvider, useStore } from "./lib/store";
import { TopNav } from "./components/TopNav";
import { Overview } from "./components/pages/Overview";
import { Findings } from "./components/pages/Findings";
import { Optimize } from "./components/pages/Optimize";
import { Plan } from "./components/pages/Plan";
import { Insights } from "./components/pages/Insights";
import { Import } from "./components/pages/Import";
import { Login } from "./components/pages/Login";

function Router() {
  const { page } = useStore();
  switch (page) {
    case "overview":
      return <Overview />;
    case "findings":
      return <Findings />;
    case "optimize":
      return <Optimize />;
    case "plan":
      return <Plan />;
    case "insights":
      return <Insights />;
    case "import":
      return <Import />;
    default:
      return <Overview />;
  }
}

function Shell() {
  const { authedUser, login, register, knownUsers, theme, toggleTheme } =
    useStore();

  if (!authedUser) {
    return (
      <Login
        login={login}
        register={register}
        knownUsers={knownUsers}
        theme={theme}
        toggleTheme={toggleTheme}
      />
    );
  }

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <TopNav />
      <main>
        <Router />
      </main>
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <Shell />
    </StoreProvider>
  );
}
