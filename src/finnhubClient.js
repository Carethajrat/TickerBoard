// Central client for ALL Finnhub calls. Every component goes through this
// instead of calling fetch() directly, so we can:
//  1) Cap total requests to stay under the 60/min free-tier limit
//  2) Cache repeat requests for the same URL for a few seconds
//  3) Queue and retry automatically if we do get rate-limited (429),
//     instead of the request just failing outright
import { API_KEY } from "./config";

const MAX_CALLS_PER_MINUTE = 50; // headroom below Finnhub's 60/min cap
const WINDOW_MS = 60000;
const CACHE_TTL_MS = 10000; // reuse a response for the same URL within 10s

let callTimestamps = [];
let queue = [];
let processing = false;
const cache = new Map();

function canMakeCall() {
  const now = Date.now();
  callTimestamps = callTimestamps.filter((t) => now - t < WINDOW_MS);
  return callTimestamps.length < MAX_CALLS_PER_MINUTE;
}

function processQueue() {
  if (processing) return;
  processing = true;

  const tick = () => {
    if (queue.length === 0) {
      processing = false;
      return;
    }
    if (!canMakeCall()) {
      setTimeout(tick, 1000); // wait for room to open up in the rate window
      return;
    }

    const { url, resolve, reject } = queue.shift();
    callTimestamps.push(Date.now());

    fetch(url)
      .then((res) => {
        if (res.status === 429) {
          // Rate-limited anyway: put it back in line and back off
          queue.push({ url, resolve, reject });
          setTimeout(tick, 3000);
          return;
        }
        return res.json().then((data) => {
          cache.set(url, { data, expiresAt: Date.now() + CACHE_TTL_MS });
          resolve(data);
          setTimeout(tick, 50);
        });
      })
      .catch((err) => {
        reject(err);
        setTimeout(tick, 50);
      });
  };

  tick();
}

// path example: "/quote?symbol=AAPL"
export function fetchFinnhub(path) {
  const url = `https://finnhub.io/api/v1${path}${path.includes("?") ? "&" : "?"}token=${API_KEY}`;

  const cached = cache.get(url);
  if (cached && cached.expiresAt > Date.now()) {
    return Promise.resolve(cached.data);
  }

  return new Promise((resolve, reject) => {
    queue.push({ url, resolve, reject });
    processQueue();
  });
}
