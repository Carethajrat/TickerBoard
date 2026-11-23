import React, { useState, useEffect } from "react";
import { fetchFinnhub } from "../finnhubClient";

// Snapshot block: shown above the chart once a ticker is selected.
// Fetches the quote and the company profile (for the name) in parallel.
function Snapshot({ symbol, watchlist, onAddToWatchlist }) {
  const [quote, setQuote] = useState(null);
  const [companyName, setCompanyName] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasData, setHasData] = useState(true);

  const alreadySaved = watchlist.includes(symbol);

  useEffect(() => {
    setLoading(true);
    setQuote(null);
    setCompanyName(null);

    Promise.all([
      fetchFinnhub(`/quote?symbol=${symbol}`),
      fetchFinnhub(`/stock/profile2?symbol=${symbol}`),
    ])
      .then(([quoteData, profileData]) => {
        // Finnhub returns all-zero quote fields for symbols we don't have
        // licensed data for, rather than a clean error, so treat that as N/A.
        const valid = quoteData.c && quoteData.c !== 0;
        setHasData(valid);
        setQuote(valid ? quoteData : null);
        setCompanyName(profileData.name || null);
        setLoading(false);
      })
      .catch(() => {
        setHasData(false);
        setLoading(false);
      });
  }, [symbol]);

  if (loading) return <p aria-live="polite">Loading snapshot...</p>;

  if (!hasData) {
    return (
      <section className="snapshot" aria-label={`${symbol} snapshot, data unavailable`}>
        <h2 className="snapshot__symbol">
          {symbol} {companyName ? `— ${companyName}` : ""}{" "}
          <span className="value-na">(N/A)</span>
        </h2>
        <p className="snapshot__note" role="status">
          No pricing data available for this ticker — likely not covered on the free plan.
        </p>
      </section>
    );
  }

  const isUp = quote.d >= 0;

  return (
    <section className="snapshot" aria-label={`${symbol} snapshot`}>
      <div className="snapshot__header">
        <h2 className="snapshot__symbol">
          {symbol} {companyName ? <span className="snapshot__company">— {companyName}</span> : null}
        </h2>
        <button
          onClick={() => onAddToWatchlist(symbol)}
          disabled={alreadySaved}
          className="snapshot__add-btn"
          aria-label={alreadySaved ? `${symbol} already in watchlist` : `Add ${symbol} to watchlist`}
        >
          {alreadySaved ? "In Watchlist" : "+ Add to Watchlist"}
        </button>
      </div>

      <div className="snapshot__price-row" aria-live="polite">
        <p className="snapshot__price">${quote.c.toFixed(2)}</p>
        <span className={`badge ${isUp ? "badge--up" : "badge--down"}`}>
          {isUp ? "+" : ""}{quote.d.toFixed(2)} ({quote.dp.toFixed(2)}%)
        </span>
      </div>

      <dl className="snapshot__stats">
        <div><dt className="sr-only">Open</dt><dd>Open ${quote.o.toFixed(2)}</dd></div>
        <div><dt className="sr-only">Previous close</dt><dd>Prev Close ${quote.pc.toFixed(2)}</dd></div>
        <div><dt className="sr-only">High</dt><dd>High ${quote.h.toFixed(2)}</dd></div>
        <div><dt className="sr-only">Low</dt><dd>Low ${quote.l.toFixed(2)}</dd></div>
      </dl>
    </section>
  );
}

export default Snapshot;
