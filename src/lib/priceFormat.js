// Decimal precision for price display/step, derived from an instrument's tick size
// rather than hardcoded per asset class — works for any future instrument added
// to the catalog without touching UI code.
export function priceDecimals(tickSize) {
  if (tickSize >= 1) return 1;
  if (tickSize >= 0.1) return 2;
  if (tickSize >= 0.01) return 3;
  if (tickSize >= 0.001) return 4;
  return 5;
}
