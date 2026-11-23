import React, { useState, useEffect } from "react";
import "./styles.css";
import Navbar from "./Components/Navbar";
import Watchlist from "./Components/Watchlist";
import HomeTable from "./Components/HomeTable";
import Snapshot from "./Components/Snapshot";
import PriceChart from "./Components/PriceChart";

const STORAGE_KEY = "tickerboard_watchlist";

function App() {
  const [selectedTicker, setSelectedTicker] = useState(null);

  // Load saved watchlist from localStorage once, on first render
  const [watchlist, setWatchlist] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  // Persist whenever the watchlist changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(watchlist));
  }, [watchlist]);

  const handleAddToWatchlist = (symbol) => {
    if (!watchlist.includes(symbol)) {
      setWatchlist([...watchlist, symbol]);
    }
  };

  const handleGoHome = () => setSelectedTicker(null);

  return (
    <div className="app">
      <Navbar onSelectTicker={setSelectedTicker} onGoHome={handleGoHome} />

      <div className="app-layout">
        <Watchlist watchlist={watchlist} onSelectTicker={setSelectedTicker} />

        <main className="app-main">
          {!selectedTicker && <HomeTable onSelectTicker={setSelectedTicker} />}

          {selectedTicker && (
            <>
              <Snapshot
                symbol={selectedTicker}
                watchlist={watchlist}
                onAddToWatchlist={handleAddToWatchlist}
              />
              <PriceChart symbol={selectedTicker} />
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
