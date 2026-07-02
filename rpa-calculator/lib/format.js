export function fmtUSD(value, dp = 2) {
  if (!isFinite(value)) return "$0.00";
  const s = Math.abs(value).toFixed(dp).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return (value < 0 ? "-$" : "$") + s;
}

export function fmtCompactUSD(value) {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return (value < 0 ? "-$" : "$") + (abs / 1_000_000).toFixed(2) + "M";
  if (abs >= 1_000) return (value < 0 ? "-$" : "$") + (abs / 1_000).toFixed(1) + "K";
  return fmtUSD(value);
}

export function fmtNum(value, dp = 2) {
  if (!isFinite(value)) return "0";
  return value.toFixed(dp).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export function fmtPct(value, dp = 1) {
  return value.toFixed(dp) + "%";
}
