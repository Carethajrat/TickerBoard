import React from "react";
import SearchBar from "./SearchBar";

function Navbar({ onSelectTicker, onGoHome }) {
  return (
    <nav className="navbar" aria-label="Main navigation">
      <button className="navbar__logo" onClick={onGoHome} aria-label="TickerBoard, go to home">
        TickerBoard
      </button>

      <button onClick={onGoHome} className="navbar__link">
        Home
      </button>

      <div className="navbar__search">
        <SearchBar onSelectTicker={onSelectTicker} />
      </div>
    </nav>
  );
}

export default Navbar;
