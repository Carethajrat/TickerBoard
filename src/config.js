// Key comes from .env (VITE_FINNHUB_API_KEY) so it is never committed to GitHub.
export const API_KEY = import.meta.env.VITE_FINNHUB_API_KEY;

// Default tickers on the Home page. Names are hardcoded (no extra API call)
// since this is a fixed, known list.
export const DEFAULT_TICKERS = [
  { symbol: "AAPL", name: "Apple Inc." },
  { symbol: "MSFT", name: "Microsoft Corp." },
  { symbol: "GOOGL", name: "Alphabet Inc." },
  { symbol: "AMZN", name: "Amazon.com Inc." },
  { symbol: "TSLA", name: "Tesla Inc." },
];
