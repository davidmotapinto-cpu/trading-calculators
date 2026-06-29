// Live pricing. A single interval drives a shared price store and notifies
// subscribers. Where a free, no-key, browser-callable real data source
// exists (crypto via Binance, forex via the ECB's daily rates), the random
// walk is periodically re-anchored to that real value instead of drifting
// indefinitely from a static mock baseline — see src/lib/liveDataFeeds.js.
// Metals/indices/commodities have no such source and stay simulated.
import { useEffect, useState } from "react";
import { INSTRUMENTS } from "../lib/instruments.js";
import { fetchCryptoAnchors, fetchForexAnchors } from "../lib/liveDataFeeds.js";

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

function applyAnchors(anchors) {
  Object.entries(anchors).forEach(([symbol, price]) => {
    if (Number.isFinite(price) && livePrices[symbol] != null) {
      livePrices[symbol] = price;
    }
  });
  listeners.forEach((fn) => fn());
}

let timer = null;
let cryptoTimer = null;
let forexTimer = null;

function ensureTimer() {
  if (!timer) timer = setInterval(tick, 1800);

  if (!cryptoTimer) {
    fetchCryptoAnchors().then(applyAnchors);
    cryptoTimer = setInterval(() => fetchCryptoAnchors().then(applyAnchors), 5000);
  }

  if (!forexTimer) {
    fetchForexAnchors().then(applyAnchors);
    forexTimer = setInterval(() => fetchForexAnchors().then(applyAnchors), 5 * 60 * 1000);
  }
}

export function getLivePrice(symbol) {
  return livePrices[symbol];
}

export function useLiveTicker(symbol) {
  ensureTimer();
  const [price, setPrice] = useState(() => livePrices[symbol]);
  const [trackedSymbol, setTrackedSymbol] = useState(symbol);

  // Adjust state during render when the symbol prop changes (React's
  // documented pattern for this) rather than in an effect. useState's lazy
  // initializer only runs on mount, so switching symbols left `price`
  // holding the *previous* instrument's value for one extra render — long
  // enough for a sibling effect (e.g. resetting open/close price on symbol
  // change) to read that stale value and seed a price field with it. Doing
  // the update here means it's correct by the time this render finishes,
  // not one render later.
  if (symbol !== trackedSymbol) {
    setTrackedSymbol(symbol);
    setPrice(livePrices[symbol]);
  }

  useEffect(() => {
    const listener = () => setPrice(livePrices[symbol]);
    listeners.add(listener);
    return () => listeners.delete(listener);
  }, [symbol]);

  return price;
}
