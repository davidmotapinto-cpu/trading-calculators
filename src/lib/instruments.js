// Mock instrument catalog — pip/contract conventions are illustrative.
// `price` is a simulated current-market baseline (manually refreshed here);
// replace with a live feed and validate contractSize/tickSize/swap values
// against the real trading platform spec before going to production
// (see SPEC.md, "Open Items").
//
// swapType: 'points' -> swapLong/swapShort are points per lot per night.
//           'percent' -> swapLong/swapShort are annualized % of notional, applied daily.
export const INSTRUMENTS = {
  EURUSD: { symbol: "EURUSD", label: "EUR/USD", category: "Forex", base: "EUR", quote: "USD", tickSize: 0.0001, unitLabel: "pip", contractSize: 100000, price: 1.0850, swapType: "points", swapLong: -6.2, swapShort: 1.4 },
  GBPUSD: { symbol: "GBPUSD", label: "GBP/USD", category: "Forex", base: "GBP", quote: "USD", tickSize: 0.0001, unitLabel: "pip", contractSize: 100000, price: 1.2700, swapType: "points", swapLong: -5.8, swapShort: 0.9 },
  USDJPY: { symbol: "USDJPY", label: "USD/JPY", category: "Forex", base: "USD", quote: "JPY", tickSize: 0.01, unitLabel: "pip", contractSize: 100000, price: 158.50, swapType: "points", swapLong: 4.1, swapShort: -8.5 },
  USDCHF: { symbol: "USDCHF", label: "USD/CHF", category: "Forex", base: "USD", quote: "CHF", tickSize: 0.0001, unitLabel: "pip", contractSize: 100000, price: 0.8950, swapType: "points", swapLong: 1.8, swapShort: -4.2 },
  USDCAD: { symbol: "USDCAD", label: "USD/CAD", category: "Forex", base: "USD", quote: "CAD", tickSize: 0.0001, unitLabel: "pip", contractSize: 100000, price: 1.3750, swapType: "points", swapLong: -1.1, swapShort: -1.6 },
  AUDUSD: { symbol: "AUDUSD", label: "AUD/USD", category: "Forex", base: "AUD", quote: "USD", tickSize: 0.0001, unitLabel: "pip", contractSize: 100000, price: 0.6550, swapType: "points", swapLong: -2.4, swapShort: 0.6 },
  NZDUSD: { symbol: "NZDUSD", label: "NZD/USD", category: "Forex", base: "NZD", quote: "USD", tickSize: 0.0001, unitLabel: "pip", contractSize: 100000, price: 0.6050, swapType: "points", swapLong: -2.0, swapShort: 0.3 },
  EURGBP: { symbol: "EURGBP", label: "EUR/GBP", category: "Forex", base: "EUR", quote: "GBP", tickSize: 0.0001, unitLabel: "pip", contractSize: 100000, price: 0.8550, swapType: "points", swapLong: -1.6, swapShort: -0.8 },
  EURJPY: { symbol: "EURJPY", label: "EUR/JPY", category: "Forex", base: "EUR", quote: "JPY", tickSize: 0.01, unitLabel: "pip", contractSize: 100000, price: 172.00, swapType: "points", swapLong: -3.0, swapShort: -2.1 },
  GBPJPY: { symbol: "GBPJPY", label: "GBP/JPY", category: "Forex", base: "GBP", quote: "JPY", tickSize: 0.01, unitLabel: "pip", contractSize: 100000, price: 201.50, swapType: "points", swapLong: -3.4, swapShort: -1.8 },

  XAUUSD: { symbol: "XAUUSD", label: "Gold (XAU/USD)", category: "Metals", base: "XAU", quote: "USD", tickSize: 0.01, unitLabel: "pip", contractSize: 100, price: 3950.00, swapType: "points", swapLong: -8.5, swapShort: -3.2 },
  XAGUSD: { symbol: "XAGUSD", label: "Silver (XAG/USD)", category: "Metals", base: "XAG", quote: "USD", tickSize: 0.001, unitLabel: "pip", contractSize: 5000, price: 46.50, swapType: "points", swapLong: -6.0, swapShort: -2.5 },

  US30: { symbol: "US30", label: "US30 (Wall Street)", category: "Indices", base: "US30", quote: "USD", tickSize: 1, unitLabel: "point", contractSize: 1, price: 44500, swapType: "percent", swapLong: -4.5, swapShort: -6.5 },
  US500: { symbol: "US500", label: "US500 (S&P 500)", category: "Indices", base: "US500", quote: "USD", tickSize: 0.1, unitLabel: "point", contractSize: 1, price: 6100, swapType: "percent", swapLong: -4.5, swapShort: -6.5 },
  NAS100: { symbol: "NAS100", label: "NAS100 (Nasdaq)", category: "Indices", base: "NAS100", quote: "USD", tickSize: 0.1, unitLabel: "point", contractSize: 1, price: 21800, swapType: "percent", swapLong: -4.5, swapShort: -6.5 },
  GER40: { symbol: "GER40", label: "GER40 (DAX)", category: "Indices", base: "GER40", quote: "EUR", tickSize: 0.1, unitLabel: "point", contractSize: 1, price: 19800, swapType: "percent", swapLong: -4.0, swapShort: -6.0 },
  UK100: { symbol: "UK100", label: "UK100 (FTSE)", category: "Indices", base: "UK100", quote: "GBP", tickSize: 0.1, unitLabel: "point", contractSize: 1, price: 8650, swapType: "percent", swapLong: -4.0, swapShort: -6.0 },

  USOIL: { symbol: "USOIL", label: "WTI Crude Oil", category: "Commodities", base: "USOIL", quote: "USD", tickSize: 0.01, unitLabel: "point", contractSize: 1000, price: 72.50, swapType: "points", swapLong: -5.0, swapShort: -3.0 },
  UKOIL: { symbol: "UKOIL", label: "Brent Crude Oil", category: "Commodities", base: "UKOIL", quote: "USD", tickSize: 0.01, unitLabel: "point", contractSize: 1000, price: 76.20, swapType: "points", swapLong: -5.0, swapShort: -3.0 },
  NATGAS: { symbol: "NATGAS", label: "Natural Gas", category: "Commodities", base: "NATGAS", quote: "USD", tickSize: 0.001, unitLabel: "point", contractSize: 10000, price: 3.45, swapType: "points", swapLong: -4.0, swapShort: -2.0 },

  BTCUSD: { symbol: "BTCUSD", label: "Bitcoin", category: "Crypto", base: "BTC", quote: "USD", tickSize: 1, unitLabel: "point", contractSize: 1, price: 105000, swapType: "percent", swapLong: -10.5, swapShort: -10.5 },
  ETHUSD: { symbol: "ETHUSD", label: "Ethereum", category: "Crypto", base: "ETH", quote: "USD", tickSize: 0.1, unitLabel: "point", contractSize: 1, price: 3800, swapType: "percent", swapLong: -10.5, swapShort: -10.5 },
  XRPUSD: { symbol: "XRPUSD", label: "Ripple", category: "Crypto", base: "XRP", quote: "USD", tickSize: 0.0001, unitLabel: "point", contractSize: 1000, price: 2.20, swapType: "percent", swapLong: -10.5, swapShort: -10.5 },
  SOLUSD: { symbol: "SOLUSD", label: "Solana", category: "Crypto", base: "SOL", quote: "USD", tickSize: 0.01, unitLabel: "point", contractSize: 1, price: 210.00, swapType: "percent", swapLong: -10.5, swapShort: -10.5 },
};

export const INSTRUMENTS_BY_CATEGORY = Object.values(INSTRUMENTS).reduce((acc, i) => {
  (acc[i.category] ||= []).push(i);
  return acc;
}, {});

export function getInstrument(symbol) {
  const inst = INSTRUMENTS[symbol];
  if (!inst) throw new Error(`Unknown instrument: ${symbol}`);
  return inst;
}

const LOT_RANGES = {
  Forex: { min: 0.01, max: 50, step: 0.01 },
  Metals: { min: 0.01, max: 20, step: 0.01 },
  Indices: { min: 0.1, max: 50, step: 0.1 },
  Commodities: { min: 0.1, max: 50, step: 0.1 },
  Crypto: { min: 0.01, max: 10, step: 0.01 },
};

export function lotRangeFor(category) {
  return LOT_RANGES[category] || { min: 0.01, max: 10, step: 0.01 };
}

// How far price sliders/charts should span around the current price, as a
// fraction of price — wider for volatile asset classes (crypto, metals),
// tighter for Forex majors where a 4% move is already large.
const PRICE_SPAN_PCT = {
  Forex: 0.015,
  Metals: 0.03,
  Indices: 0.025,
  Commodities: 0.035,
  Crypto: 0.05,
};

export function priceSpanFor(category) {
  return PRICE_SPAN_PCT[category] || 0.05;
}

// Illustrative spread widths in ticks/points per category — replace with a
// real bid/ask feed. Used to show a live bid/ask quote instead of a single
// mid price, which is the bare minimum for "realistic market behavior."
const SPREAD_TICKS = {
  Forex: 1.2,
  Metals: 3,
  Indices: 2,
  Commodities: 4,
  Crypto: 15,
};

export function getQuote(instrument, midPrice) {
  const spread = (SPREAD_TICKS[instrument.category] || 2) * instrument.tickSize;
  return { bid: midPrice - spread / 2, ask: midPrice + spread / 2, mid: midPrice, spread };
}
