import { useEffect } from "react";
import "./App.css";
import { Header } from "./components/Layout/Header";
import { Sidebar } from "./components/Layout/Sidebar";
import { PlayerSetup } from "./components/PlayerSetup/PlayerSetup";
import { MatchViewContainer } from "./components/MatchMatrix/MatchViewContainer";
import { SeasonManager } from "./components/Seasons/SeasonManager";
import { StatisticsView } from "./components/Statistics/StatisticsView";
import { useTournamentStore } from "./store/useTournamentStore";

function App() {
  const activeView = useTournamentStore((s) => s.activeView);
  const loadFromServer = useTournamentStore((s) => s.loadFromServer);

  useEffect(() => {
    loadFromServer();
  }, [loadFromServer]);

  return (
    <div className="app-shell">
      <Header />
      <div className="app-body">
        <main className="main-content">
          {activeView === "setup" && <PlayerSetup />}
          {activeView === "matches" && <MatchViewContainer />}
          {activeView === "seasons" && <SeasonManager />}
          {activeView === "statistics" && <StatisticsView />}
        </main>
        <Sidebar />
      </div>
    </div>
  );
}

export default App;
