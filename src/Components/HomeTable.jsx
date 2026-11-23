import React, { useState, useEffect } from "react";
import { DEFAULT_TICKERS } from "../config";
import { fetchFinnhub } from "../finnhubClient";

// Home page: never empty. Fetches quotes for a fixed list of tickers.
function HomeTable({ onSelectTicker }) {
  const [quotes, setQuotes] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all(
      DEFAULT_TICKERS.map(({ symbol }) =>
        fetchFinnhub(`/quote?symbol=${symbol}`).then((data) => ({ symbol, data }))
      )
    )
      .then((results) => {
        const map = {};
        results.forEach(({ symbol, data }) => { map[symbol] = data; });
        setQuotes(map);
        setLoading(false);
      })
      .catch(() => {
        setError("Couldn't load market data.");
        setLoading(false);
      });
  }, []);

  if (loading) return <p aria-live="polite">Loading market data...</p>;
  if (error) return <p role="alert" className="search__error">{error}</p>;

  return (
    <section className="home" aria-label="Market overview">
      <table className="home__table" aria-label="Top tickers, price and change">
        <thead>
          <tr>
            <th scope="col" className="home__th">Symbol</th>
            <th scope="col" className="home__th">Price</th>
            <th scope="col" className="home__th">Change</th>
          </tr>
        </thead>
        <tbody>
          {DEFAULT_TICKERS.map(({ symbol, name }) => {
            const q = quotes[symbol] || {};
            const hasData = q.c && q.c !== 0;
            const isUp = q.d >= 0;
            return (
              <tr key={symbol} className="home__row">
                <th scope="row" className="home__td">
                  <button
                    onClick={() => onSelectTicker(symbol)}
                    aria-label={`View ${symbol}, ${name}`}
                    className="home__symbol-btn"
                  >
                    <strong>{symbol}</strong>
                    <div className="home__name">{name}</div>
                  </button>
                </th>
                <td className="home__td num">
                  {hasData ? `$${q.c.toFixed(2)}` : <span className="value-na">N/A</span>}
                </td>
                <td className="home__td">
                  {hasData ? (
                    <span className={`badge ${isUp ? "badge--up" : "badge--down"}`}>
                      {isUp ? "+" : ""}{q.d.toFixed(2)} ({q.dp.toFixed(2)}%)
                    </span>
                  ) : (
                    <span className="badge badge--na">N/A</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="home__side" aria-label="Day range by ticker">
        <h4 className="home__side-heading">Day Range</h4>
        {DEFAULT_TICKERS.map(({ symbol }) => {
          const q = quotes[symbol] || {};
          const hasData = q.h && q.l;
          return (
            <p key={symbol} className="home__side-row">
              <strong>{symbol}</strong>
              <span className="num">
                {hasData ? `$${q.l.toFixed(2)} – $${q.h.toFixed(2)}` : <span className="value-na">N/A</span>}
              </span>
            </p>
          );
        })}
      </div>
    </section>
  );
}

export default HomeTable;
