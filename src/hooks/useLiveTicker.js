// Simulated live pricing. A single interval drives a shared price store and
// notifies subscribers — this is the seam to swap for a WebSocket/SSE feed:
// keep `getLivePrice`/`useLiveTicker`'s signatures the same and replace the
// `tick()` body with incoming server messages.
import { useEffect, useState } from "react";
import { INSTRUMENTS } from "../lib/instruments.js";

const listeners = new Set();
const livePrices = {};
Object.values(INSTRUMENTS).forEach((i) => {
  livePrices[i.symbol] = i.price;
});

function tick() {
  Object.values(INSTRUMENTS).forEach((i) => {
    const last = livePrices[i.symbol];
    const drift = (Math.random() - 0.5) * last * 0.0006; // ~6 bps random walk per tick
    livePrices[i.symbol] = Math.max(i.tickSize, last + drift);
  });
  listeners.forEach((fn) => fn());
}

let timer = null;
function ensureTimer() {
  if (!timer) timer = setInterval(tick, 1800);
}

export function getLivePrice(symbol) {
  return livePrices[symbol];
}

export function useLiveTicker(symbol) {
  ensureTimer();
  const [price, setPrice] = useState(livePrices[symbol]);

  useEffect(() => {
    setPrice(livePrices[symbol]);
    const listener = () => setPrice(livePrices[symbol]);
    listeners.add(listener);
    return () => listeners.delete(listener);
  }, [symbol]);

  return price;
}
