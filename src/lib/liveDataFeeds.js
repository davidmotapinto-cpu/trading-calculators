// Real, free, no-API-key data sources, used to anchor the simulated tick
// movement to something true instead of a static mock baseline that goes
// stale the moment the real market moves.
//
// Crypto -> Binance's public ticker endpoint. Genuinely live, CORS-open,
// no key required — polled every few seconds.
// Forex  -> the European Central Bank's daily reference rates via the
// Frankfurter API. Real, but refreshed once a day, not tick-by-tick.
// Metals/Indices/Commodities -> no free, no-key, browser-callable source
// was found for these; they remain simulated from the static baseline in
// instruments.js (clearly labeled as such in the UI).
const BINANCE_SYMBOLS = {
  BTCUSD: "BTCUSDT",
  ETHUSD: "ETHUSDT",
  XRPUSD: "XRPUSDT",
  SOLUSD: "SOLUSDT",
};

const FOREX_CCY = ["EUR", "GBP", "JPY", "CHF", "CAD", "AUD", "NZD"];

// symbol -> "live" (crypto, seconds-fresh) | "daily" (forex, ECB) | absent (simulated)
export const DATA_SOURCE = {};

export async function fetchCryptoAnchors() {
  const results = await Promise.all(
    Object.entries(BINANCE_SYMBOLS).map(async ([ourSymbol, binanceSymbol]) => {
      try {
        const res = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${binanceSymbol}`);
        if (!res.ok) return null;
        const data = await res.json();
        const price = parseFloat(data.price);
        return Number.isFinite(price) ? [ourSymbol, price] : null;
      } catch {
        return null; // offline/blocked — caller just keeps the simulated value
      }
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

export async function fetchForexAnchors() {
  try {
    const res = await fetch(`https://api.frankfurter.app/latest?from=USD&to=${FOREX_CCY.join(",")}`);
    if (!res.ok) return {};
    const data = await res.json();
    const r = data.rates;
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
  } catch {
    return {};
  }
}

export function getDataSource(symbol) {
  return DATA_SOURCE[symbol] || "simulated";
}
