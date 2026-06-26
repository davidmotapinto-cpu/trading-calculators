// Mock FX feed — replace with a live rates API. Expressed as "1 USD = X of currency".
export const RATES = {
  USD: 1,
  EUR: 0.9155,
  GBP: 0.7900,
  JPY: 157.30,
  AUD: 1.5200,
  NZD: 1.6400,
  CHF: 0.9100,
  CAD: 1.3700,
  AED: 3.6725, // pegged to USD
};

export const CURRENCIES = Object.keys(RATES);

export const WITHDRAWAL_METHODS = {
  bank: { label: "Bank Transfer", feePct: 0.008, minFee: 0 },
  card: { label: "Card", feePct: 0.015, minFee: 1 },
  wallet: { label: "E-Wallet", feePct: 0.005, minFee: 0 },
  crypto: { label: "Crypto", feePct: 0.010, minFee: 0 },
};
