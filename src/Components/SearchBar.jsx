import React, { useState, useEffect, useId } from "react";
import { fetchFinnhub } from "../finnhubClient";

function SearchBar({ onSelectTicker }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const inputId = useId();
  const listboxId = useId();

  // Debounce: wait 400ms after the user stops typing before calling the API
  useEffect(() => {
    if (query.trim() === "") {
      setResults([]);
      return;
    }
    setLoading(true);
    setError(null);
    const timer = setTimeout(() => {
      fetchFinnhub(`/search?q=${encodeURIComponent(query)}`)
        .then((data) => {
          setResults(data.result || []);
          setLoading(false);
        })
        .catch(() => {
          setError("Couldn't fetch results. Try again.");
          setLoading(false);
        });
    }, 400);
    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (symbol) => {
    onSelectTicker(symbol);
    setQuery("");
    setResults([]);
  };

  return (
    <div className="search">
      <label htmlFor={inputId} className="sr-only">Search ticker symbol</label>
      <input
        id={inputId}
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search ticker (e.g. AAPL)"
        className="search__input"
        role="combobox"
        aria-expanded={results.length > 0}
        aria-controls={listboxId}
        aria-autocomplete="list"
        autoComplete="off"
      />

      <div aria-live="polite">
        {loading && <p className="search__status">Searching...</p>}
        {error && <p className="search__error" role="alert">{error}</p>}
        {!loading && !error && query && results.length === 0 && (
          <p className="search__status">No matches found.</p>
        )}
      </div>

      {results.length > 0 && (
        <ul id={listboxId} role="listbox" aria-label="Ticker search results" className="search__dropdown">
          {results.slice(0, 8).map((item) => (
            <li
              key={item.symbol}
              role="option"
              aria-selected="false"
              tabIndex={0}
              onClick={() => handleSelect(item.symbol)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSelect(item.symbol); }}
              className="search__option"
            >
              <strong>{item.symbol}</strong> — {item.description}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default SearchBar;
