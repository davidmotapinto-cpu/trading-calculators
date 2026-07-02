// RPA Coefficient Table — Appendix B, PRD v1.0 (July 2026)
// Source: Equiti RPA Coefficient Model workbook.
// Coefficients are pre-calculated from historical Equiti net revenue data
// and benchmarked against Standard | XAUUSD ($39.20/1M). Never compute live.

export const BENCHMARK = { accountType: "Standard", instrument: "XAUUSD", revPerM: 39.20 };

export const COEFFICIENT_TABLE = [
  { accountType: "Standard",         instrument: "XAUUSD",    asset: "Gold",    revPerM:  39.20, coeff: 1.0000, eligible: true  },
  { accountType: "B2BDirect",        instrument: "XAUUSD",    asset: "Gold",    revPerM:  33.29, coeff: 0.8492, eligible: true  },
  { accountType: "B2BMT4Direct",     instrument: "XAUUSD",    asset: "Gold",    revPerM:  30.98, coeff: 0.7903, eligible: true  },
  { accountType: "Premier",          instrument: "EURUSD",    asset: "FX",      revPerM:  30.65, coeff: 0.7820, eligible: true  },
  { accountType: "Classic",          instrument: "XAUUSD",    asset: "Gold",    revPerM:  20.48, coeff: 0.5224, eligible: true  },
  { accountType: "Premier",          instrument: "XAUUSD",    asset: "Gold",    revPerM:  17.83, coeff: 0.4550, eligible: true  },
  { accountType: "Premier",          instrument: "GCM",       asset: "Equities",revPerM:  17.69, coeff: 0.4512, eligible: true  },
  { accountType: "StandardProvider", instrument: "XAUUSD",    asset: "Gold",    revPerM:  16.77, coeff: 0.4278, eligible: true  },
  { accountType: "B2BAPI",           instrument: "XAUUSD",    asset: "Gold",    revPerM:  16.30, coeff: 0.4157, eligible: true  },
  { accountType: "B2BAPI",           instrument: "EURUSD",    asset: "FX",      revPerM:  16.21, coeff: 0.4135, eligible: true  },
  { accountType: "Premier",          instrument: "US30M",     asset: "Indices", revPerM:  14.86, coeff: 0.3790, eligible: true  },
  { accountType: "StandardFollower", instrument: "XAUUSD",    asset: "Gold",    revPerM:  13.81, coeff: 0.3523, eligible: true  },
  { accountType: "B2BDirect",        instrument: "UT100M",    asset: "Indices", revPerM:  12.86, coeff: 0.3280, eligible: true  },
  { accountType: "Standard",         instrument: "UT100M",    asset: "Indices", revPerM:  12.36, coeff: 0.3153, eligible: true  },
  { accountType: "Standard",         instrument: "WTI",       asset: "Oil",     revPerM:  52.07, coeff: 1.3283, eligible: true  },
  { accountType: "Premier",          instrument: "WTI",       asset: "Oil",     revPerM:  45.00, coeff: 1.1479, eligible: true  },
  { accountType: "PremierProvider",  instrument: "XAUUSD",    asset: "Gold",    revPerM:   8.91, coeff: 0.2273, eligible: true  },
  { accountType: "Premier",          instrument: "US30ROLL",  asset: "Indices", revPerM:   7.41, coeff: 0.1889, eligible: true  },
  { accountType: "Standard",         instrument: "UT100ROLL", asset: "Indices", revPerM:   2.90, coeff: 0.1000, eligible: true  },
  { accountType: "Premier",          instrument: "UT100ROLL", asset: "Indices", revPerM:   3.26, coeff: 0.1000, eligible: true  },
  { accountType: "Standard",         instrument: "XAUJPY",    asset: "FX",      revPerM:   0.12, coeff: 0.1000, eligible: true  },
  { accountType: "Premier",          instrument: "DE40M",     asset: "Indices", revPerM:  -3.07, coeff: null,   eligible: false }, // Negative rev — ineligible
];

// Contract sizes and default spot prices per instrument.
// spotPrice is a static reference price — replace with live feed in production.
export const INSTRUMENT_META = {
  XAUUSD:    { label: "Gold (XAU/USD)",          contractSize: 100,     defaultPrice: 3350,   priceDp: 2 },
  EURUSD:    { label: "EUR/USD",                 contractSize: 100_000, defaultPrice: 1.08,   priceDp: 5 },
  WTI:       { label: "WTI Crude Oil",           contractSize: 1_000,   defaultPrice: 80.00,  priceDp: 2 },
  US30M:     { label: "US30M (Wall St Mini)",    contractSize: 1,       defaultPrice: 44_500, priceDp: 0 },
  US30ROLL:  { label: "US30 Roll",               contractSize: 1,       defaultPrice: 44_500, priceDp: 0 },
  UT100M:    { label: "UT100M (Nasdaq Mini)",    contractSize: 1,       defaultPrice: 21_800, priceDp: 0 },
  UT100ROLL: { label: "UT100 Roll",              contractSize: 1,       defaultPrice: 21_800, priceDp: 0 },
  DE40M:     { label: "DE40M (DAX Mini)",        contractSize: 1,       defaultPrice: 19_800, priceDp: 0 },
  GCM:       { label: "GCM (Equities)",          contractSize: 1,       defaultPrice: 100,    priceDp: 2 },
  XAUJPY:    { label: "Gold (XAU/JPY)",          contractSize: 100,     defaultPrice: 612_000,priceDp: 0 },
};

// Fast lookup: "AccountType|Instrument" → coefficient row
const _map = {};
for (const row of COEFFICIENT_TABLE) _map[`${row.accountType}|${row.instrument}`] = row;
export function getCoeffEntry(accountType, instrument) { return _map[`${accountType}|${instrument}`] ?? null; }

// All eligible instruments (deduplicated, preserving table order)
export const ELIGIBLE_INSTRUMENTS = [...new Set(
  COEFFICIENT_TABLE.filter(r => r.eligible).map(r => r.instrument)
)];

// All eligible account types for a given instrument
export function accountTypesFor(instrument) {
  return COEFFICIENT_TABLE.filter(r => r.instrument === instrument && r.eligible).map(r => r.accountType);
}
