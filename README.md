# TickerBoard — Technical Documentation

## 1. Overview

TickerBoard is a single-page, client-side stock market dashboard built with React. It lets a user browse a default watchlist of top tickers, search for any symbol, view a live price snapshot, track a personal watchlist (persisted locally), and see a live-updating price chart for a selected stock. All data is sourced from the Finnhub stock API.

**Tech stack:** React 18 (UMD build, no bundler), Babel Standalone (in-browser JSX transpilation), Chart.js 4 for charting, IBM Plex font family, vanilla CSS. The entire app ships as a single HTML file with inline JSX, requiring no build step.

## 2. Core Features

| Feature | Description |
|---|---|
| Market overview (Home) | Table of default tickers (AAPL, MSFT, GOOGL, AMZN, TSLA) with live price, change, and day range |
| Ticker search | Debounced symbol/company search with keyboard and screen-reader support |
| Snapshot view | Detailed quote for a selected ticker: price, change, open, previous close, high/low |
| Watchlist | User-curated list of tickers, persisted in `localStorage`, accessible from any screen |
| Live price chart | Polls for new prices every 15 seconds and plots them with Chart.js while the tab is visible |
| Graceful "no data" states | Tickers unsupported on the free API plan are shown as N/A rather than breaking the UI |

## 3. Architecture

### 3.1 Component tree

```
App
├── Navbar
│   └── SearchBar
├── Watchlist
└── main
    ├── HomeTable        (shown when no ticker is selected)
    └── Snapshot + PriceChart   (shown when a ticker is selected)
```

State lives at the top of the tree and flows down as props; there is no external state-management library — `useState` and `useEffect` are sufficient for the app's scope.

| State | Owner | Persistence |
|---|---|---|
| `selectedTicker` | `App` | In-memory only (resets on reload) |
| `watchlist` | `App` | `localStorage` (`tickerboard_watchlist` key) |
| `quotes`, `query`, `points`, etc. | Local to each component | In-memory only |

### 3.2 Navigation model

The app uses a single view state (`selectedTicker`) rather than a router: `null` shows the home table, and any symbol shows the snapshot + chart view. This keeps the app simple but means there are no shareable/bookmarkable URLs for individual tickers.

## 4. API Integration (Finnhub)

### 4.1 Endpoints used

- `GET /search?q=` — symbol/company search
- `GET /quote?symbol=` — real-time quote (current price, change, open, high, low, previous close)
- `GET /stock/profile2?symbol=` — company profile (name)

### 4.2 Shared client: throttling and caching

All requests go through a single `fetchFinnhub()` helper backed by a shared queue rather than firing directly, because Finnhub's free tier is rate-limited:

- **Rate limiting:** a sliding 60-second window caps outgoing calls at 50/minute (`MAX_CALLS_PER_MINUTE`). Calls beyond the limit wait in a FIFO queue (`fhQueue`) and are released once the window has room.
- **429 handling:** if Finnhub returns HTTP 429, the request is re-queued and retried after a 3-second backoff.
- **Response caching:** successful responses are cached in memory for 10 seconds (`CACHE_TTL_MS`), keyed by full request URL, so repeated identical requests (e.g., multiple components requesting the same quote) don't count against the rate limit.
- **Pacing:** the queue processes one call roughly every 50ms once capacity is available, smoothing out bursts (e.g., the five simultaneous quote requests on the home screen).

This design centralizes network concerns so individual components (`HomeTable`, `Snapshot`, `PriceChart`, `SearchBar`) can call `fetchFinnhub(path)` without needing to know about limits or caching.

### 4.3 Live chart polling

`PriceChart` polls `/quote` every 15 seconds (`POLL_INTERVAL_MS`) for the selected symbol and appends each new price to a running series, which Chart.js re-renders as a line chart. Polling is paused when the browser tab isn't visible (`document.visibilityState !== "visible"`) to avoid wasted calls, and resumes seamlessly since the interval keeps running — only the *fetch* is skipped, not the timer.

## 5. Component Reference

- **`Navbar`** — top bar with logo/home button and the embedded `SearchBar`.
- **`SearchBar`** — debounces input by 400ms before querying `/search`; renders results as an accessible `listbox` (`role="combobox"`/`role="listbox"`/`role="option"`), supports mouse and `Enter`-key selection, and surfaces loading/error/empty states via `aria-live`.
- **`Watchlist`** — sidebar list of saved symbols; renders an empty-state message when nothing is saved yet.
- **`HomeTable`** — fetches quotes for all `DEFAULT_TICKERS` in parallel (`Promise.all`) on mount; renders a price/change table plus a day-range side panel; shows `N/A` per-ticker if no valid quote (`c` is falsy or zero).
- **`Snapshot`** — fetches quote + company profile for the selected symbol; shows a dedicated "data unavailable" state for unsupported tickers; includes an "Add to Watchlist" button that disables once the symbol is already saved.
- **`PriceChart`** — manages the live-updating series and Chart.js instance via `useRef`, tearing down and recreating the chart when the point series or symbol changes.

## 6. Accessibility

The app makes deliberate accessibility choices throughout rather than treating it as an afterthought:

- Visually hidden but screen-reader-accessible labels (`sr-only`) on form inputs and table headers.
- `aria-live="polite"` regions for search status, loading states, and price updates, so changes are announced without stealing focus.
- Proper semantic table markup (`scope="col"`/`scope="row"`) in `HomeTable`.
- The chart canvas has `role="img"` with a descriptive `aria-label`, plus a hidden text summary of the trend and latest price, so the chart's information is available even without JS-driven canvas rendering.
- Keyboard support for selecting a search result (`Enter` key), not just click.

## 7. State Persistence

The watchlist is the only piece of state persisted across sessions, stored as JSON in `localStorage` under `tickerboard_watchlist` and rehydrated on load. All other state (selected ticker, search query, chart data) is session-only and resets on refresh.

## 8. Known Limitations

- **No routing:** ticker views aren't reflected in the URL, so they can't be linked or bookmarked, and browser back/forward doesn't navigate between tickers.
- **No build tooling:** Babel Standalone transpiles JSX in the browser on every load, which is fine for a demo but adds parse overhead and isn't suited for production-scale traffic.
- **API key exposure:** the Finnhub API key is embedded directly in the client-side script, which means it's visible to anyone who views the page source. A production deployment should proxy requests through a backend to keep the key private.
- **Free-tier data gaps:** some symbols return no data on Finnhub's free plan; the app handles this gracefully with "N/A"/"data unavailable" states rather than erroring.
- **In-memory chart history:** the price chart only accumulates points from the moment a ticker is opened — there's no historical/intraday data fetched on load, so the chart starts with just the previous close and builds forward in real time.

## 9. Possible Future Enhancements

- Client-side routing (e.g., `#/ticker/AAPL`) for shareable, bookmarkable views.
- Historical/intraday candle data on chart load instead of starting from a single point.
- Backend proxy to protect the API key and enable server-side caching across users.
- Removing tickers from the watchlist (currently add-only).
- A production build step (bundling/minification) once the app grows beyond a single-file prototype.
-
## 10. Demonstrating our modules as shown below,
## Pages include - Home page | Search Ticker | Snapshot data,chart - AAPL | Watchlist,Amazon share price chart etc

- <img width="1336" height="713" alt="Watchlist,Amazon share price chart etc" src="https://github.com/user-attachments/assets/02015fb7-c65a-4967-868a-019673cd8502" />
<img width="1356" height="710" alt="Snapshot data,chart - AAPL" src="https://github.com/user-attachments/assets/de891a76-3bc6-4517-ab37-8cdb339b9d5b" />
<img width="415" height="296" alt="Search Ticker" src="https://github.com/user-attachments/assets/9ed7c86f-e7ce-42c4-bb54-38a3143cdf8c" />
<img width="1356" height="716" alt="Home page" src="https://github.com/user-attachments/assets/7358c518-f609-4d7c-ad61-50c7793b9075" />

