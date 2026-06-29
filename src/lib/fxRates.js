// FX baseline used by every currency conversion in the app (Currency
// Calculator, account-currency conversion, cross-currency margin/profit
// math). RATES is mutated in place by refreshRatesFromECB() rather than
// reassigned, so every importer sees the update automatically — they all
// hold a reference to this same object. AED has no entry to refresh from
// the ECB because it isn't a floating currency: it's been a fixed
// government peg to USD (3.6725) since 1997, so the static value here
// already reflects reality and never needs refreshing.
export const RATES = {
  USD: 1,
  EUR: 0.9155,
  GBP: 0.7900,
  JPY: 157.30,
  AUD: 1.5200,
  NZD: 1.6400,
  CHF: 0.9100,
  CAD: 1.3700,
  AED: 3.6725, // pegged to USD, not floating — not refreshed from ECB
};

export const CURRENCIES = Object.keys(RATES);

export const WITHDRAWAL_METHODS = {
  bank: { label: "Bank Transfer", feePct: 0.008, minFee: 0 },
  card: { label: "Card", feePct: 0.015, minFee: 1 },
  wallet: { label: "E-Wallet", feePct: 0.005, minFee: 0 },
  crypto: { label: "Crypto", feePct: 0.010, minFee: 0 },
};

const FLOATING_CCY = ["EUR", "GBP", "JPY", "AUD", "NZD", "CHF", "CAD"];
const listeners = new Set();

export function subscribeRates(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

// Real ECB daily reference rates via Frankfurter — same free, no-key,
// CORS-open source already used for the Forex instrument prices. Returns
// the raw rates object too, so callers that also need to derive FX pair
// prices (e.g. EURUSD) from the same payload don't need a second fetch.
export async function refreshRatesFromECB() {
  try {
    const res = await fetch(`https://api.frankfurter.app/latest?from=USD&to=${FLOATING_CCY.join(",")}`);
    if (!res.ok) return null;
    const data = await res.json();
    const r = data.rates;
    if (!r) return null;
    FLOATING_CCY.forEach((ccy) => {
      if (Number.isFinite(r[ccy])) RATES[ccy] = r[ccy];
    });
    listeners.forEach((fn) => fn());
    return r;
  } catch {
    return null;
  }
}
