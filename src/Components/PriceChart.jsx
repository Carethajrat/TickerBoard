import React, { useState, useEffect } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
} from "chart.js";
import { fetchFinnhub } from "../finnhubClient";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip);

// The free tier has no historical candles, so this chart builds its own
// mini history by polling /quote. The first response seeds two points
// (Prev Close -> Current) so the chart isn't empty while waiting for the poll.
const POLL_INTERVAL_MS = 15000;

function PriceChart({ symbol }) {
  const [points, setPoints] = useState([]);
  // "loading" | "ready" | "no-data": explicit status instead of guessing
  // from points.length, so an unsupported ticker doesn't load forever.
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    setPoints([]);
    setStatus("loading");
  }, [symbol]);

  useEffect(() => {
    const fetchPrice = (isFirstCall) => {
      // Skip polling while the tab isn't visible, to save the rate budget
      if (!isFirstCall && document.visibilityState !== "visible") return;

      fetchFinnhub(`/quote?symbol=${symbol}`)
        .then((data) => {
          if (!data.c || data.c === 0) {
            if (isFirstCall) setStatus("no-data");
            return;
          }
          if (isFirstCall && data.pc) {
            setPoints([
              { time: "Prev Close", price: data.pc },
              { time: new Date().toLocaleTimeString(), price: data.c },
            ]);
            setStatus("ready");
          } else {
            setPoints((prev) => [...prev, { time: new Date().toLocaleTimeString(), price: data.c }]);
          }
        })
        .catch(() => {
          if (isFirstCall) setStatus("no-data");
        });
    };

    fetchPrice(true);
    const interval = setInterval(() => fetchPrice(false), POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [symbol]);

  if (status === "no-data") {
    return (
      <p className="price-chart__status" role="status">
        No chart data available for this ticker.
      </p>
    );
  }

  if (status === "loading" || points.length < 2) {
    return <p className="price-chart__status" aria-live="polite">Loading chart...</p>;
  }

  const chartData = {
    labels: points.map((p) => p.time),
    datasets: [
      {
        label: `${symbol} price`,
        data: points.map((p) => p.price),
        borderColor: "#1e3a5f",
        backgroundColor: "rgba(30, 58, 95, 0.08)",
        tension: 0.2,
      },
    ],
  };

  // A canvas is invisible to screen readers, so add a text summary.
  const latest = points[points.length - 1].price;
  const first = points[0].price;
  const trendWord = latest >= first ? "up" : "down";

  return (
    <div className="price-chart">
      <p className="sr-only" role="status">
        {symbol} price chart, currently trending {trendWord}, latest price ${latest.toFixed(2)}.
      </p>
      <Line data={chartData} aria-label={`${symbol} live price chart`} role="img" />
    </div>
  );
}

export default PriceChart;
