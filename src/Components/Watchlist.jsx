import React from "react";

function Watchlist({ watchlist, onSelectTicker }) {
  return (
    <aside className="watchlist" aria-label="Your watchlist">
      <h3 className="watchlist__heading">Watchlist</h3>

      {watchlist.length === 0 && (
        <p className="watchlist__empty">No tickers saved yet.</p>
      )}

      <ul className="watchlist__list">
        {watchlist.map((symbol) => (
          <li key={symbol}>
            <button
              onClick={() => onSelectTicker(symbol)}
              className="watchlist__item"
              aria-label={`View ${symbol}`}
            >
              {symbol}
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}

export default Watchlist;
