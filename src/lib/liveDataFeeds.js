// Real, free, no-API-key data sources, used to anchor the simulated tick
// movement to something true instead of a static mock baseline that goes
// stale the moment the real market moves.
//
// Crypto -> Binance's public ticker endpoint. Genuinely live, CORS-open,
// no key required — polled every few seconds.
// Forex  -> the European Central Bank's daily reference rates via the
// Frankfurter API. Real, but refreshed once a day, not tick-by-tick.
// Gold   -> also via Binance, using PAXGUSDT (PAX Gold, a token backed
// 1:1 by physical gold). It's a proxy, not literal interbank XAU/USD spot —
// usually within a small margin of spot but can drift slightly, so it's
// labeled distinctly in the UI rather than claimed as exact spot.
// Silver/Indices/Commodities -> no free, no-key, browser-callable source
// was found (checked Stooq's free CSV endpoint specifically; it 404s for
// every symbol format tried). These remain simulated, clearly labeled.
import { refreshRatesFromECB } from "./fxRates.js";

const BINANCE_SYMBOLS = {
  BTCUSD: "BTCUSDT",
  ETHUSD: "ETHUSDT",
  XRPUSD: "XRPUSDT",
  SOLUSD: "SOLUSDT",
};

const BINANCE_PROXY_SYMBOLS = {
  XAUUSD: "PAXGUSDT",
};

// symbol -> "live" (crypto, seconds-fresh) | "proxy" (tokenized-asset proxy) | "daily" (forex, ECB) | absent (simulated)
export const DATA_SOURCE = {};

async function fetchBinancePrice(binanceSymbol) {
  try {
    const res = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${binanceSymbol}`);
    if (!res.ok) return null;
    const data = await res.json();
    const price = parseFloat(data.price);
    return Number.isFinite(price) ? price : null;
  } catch {
    return null; // offline/blocked — caller just keeps the simulated value
  }
}

export async function fetchCryptoAnchors() {
  const results = await Promise.all(
    Object.entries(BINANCE_SYMBOLS).map(async ([ourSymbol, binanceSymbol]) => {
      const price = await fetchBinancePrice(binanceSymbol);
      return price != null ? [ourSymbol, price] : null;
    })
  );
  const anchors = {};
  for (const entry of results) {
    if (entry) {
      anchors[entry[0]] = entry[1];
      DATA_SOURCE[entry[0]] = "live";
    }
  }
  return anchors;
}

export async function fetchMetalProxyAnchors() {
  const results = await Promise.all(
    Object.entries(BINANCE_PROXY_SYMBOLS).map(async ([ourSymbol, binanceSymbol]) => {
      const price = await fetchBinancePrice(binanceSymbol);
      return price != null ? [ourSymbol, price] : null;
    })
  );
  const anchors = {};
  for (const entry of results) {
    if (entry) {
      anchors[entry[0]] = entry[1];
      DATA_SOURCE[entry[0]] = "proxy";
    }
  }
  return anchors;
}

export async function fetchForexAnchors() {
  // Reuses fxRates.js's fetch (and updates the SAME RATES table the
  // Currency Calculator and every cross-currency conversion read) instead
  // of hitting Frankfurter a second time with its own separate, never-
  // synced copy — that duplication was the bug that left currency
  // conversion silently using a months-old static table.
  const r = await refreshRatesFromECB();
  if (!r) return {};
  const anchors = {
    EURUSD: 1 / r.EUR,
    GBPUSD: 1 / r.GBP,
    USDJPY: r.JPY,
    USDCHF: r.CHF,
    USDCAD: r.CAD,
    AUDUSD: 1 / r.AUD,
    NZDUSD: 1 / r.NZD,
    EURGBP: r.GBP / r.EUR,
    EURJPY: r.JPY / r.EUR,
    GBPJPY: r.JPY / r.GBP,
  };
  Object.keys(anchors).forEach((sym) => {
    DATA_SOURCE[sym] = "daily";
  });
  return anchors;
}

export function getDataSource(symbol) {
  return DATA_SOURCE[symbol] || "simulated";
}
