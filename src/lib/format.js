export function formatMoney(amount, currency) {
  if (!Number.isFinite(amount)) return "—";
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 2 }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}

export function formatNumber(n, decimals = 2) {
  if (!Number.isFinite(n)) return "—";
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: decimals }).format(n);
}

// Short form for tight spaces (chart axis labels) — "$3.3K" instead of "$3,254.32".
export function formatCompactMoney(amount, currency) {
  if (!Number.isFinite(amount)) return "—";
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency, notation: "compact", maximumFractionDigits: 1 }).format(amount);
  } catch {
    return formatMoney(amount, currency);
  }
}
