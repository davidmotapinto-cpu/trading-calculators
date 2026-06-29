// Pure, framework-agnostic calculation engine — no React, no DOM.
// Every formula resolves money in the instrument's quote currency first,
// then converts once to the target account currency, so results are
// correct regardless of which account currency the client has selected
// (including cross-currency pairs like EUR/GBP or GER40 quoted in EUR).

export function convertCurrency(amount, fromCcy, toCcy, rates) {
  if (fromCcy === toCcy) return amount;
  const fromPerUsd = rates[fromCcy];
  const toPerUsd = rates[toCcy];
  if (!fromPerUsd || !toPerUsd) throw new Error(`Missing FX rate for ${fromCcy} or ${toCcy}`);
  const usd = amount / fromPerUsd;
  return usd * toPerUsd;
}

export function calculateMargin({ instrument, lots, leverage, accountCcy, rates }) {
  const notionalQuote = lots * instrument.contractSize * instrument.price;
  const marginQuote = notionalQuote / leverage;
  const marginAccount = convertCurrency(marginQuote, instrument.quote, accountCcy, rates);
  return { notionalQuote, marginQuote, marginAccount };
}

export function calculatePipValue({ instrument, lots, accountCcy, rates }) {
  const perUnitQuote = instrument.tickSize * instrument.contractSize * lots;
  const perUnitAccount = convertCurrency(perUnitQuote, instrument.quote, accountCcy, rates);
  return { perUnitQuote, perUnitAccount };
}

export function calculateProfit({ instrument, direction, lots, openPrice, closePrice, accountCcy, rates, fees = 0, swapTotal = 0 }) {
  const diff = direction === "sell" ? openPrice - closePrice : closePrice - openPrice;
  const grossQuote = diff * instrument.contractSize * lots;
  const grossAccount = convertCurrency(grossQuote, instrument.quote, accountCcy, rates);
  const netAccount = grossAccount + swapTotal - fees;
  const pipsMoved = diff / instrument.tickSize;
  return { grossAccount, netAccount, pipsMoved };
}

export function calculateSwap({ instrument, direction, lots, nights, accountCcy, rates }) {
  const ratePerLot = direction === "sell" ? instrument.swapShort : instrument.swapLong;
  let perNightQuote;
  if (instrument.swapType === "percent") {
    // Overnight financing as an annualized % of notional, applied daily.
    const notionalQuote = lots * instrument.contractSize * instrument.price;
    perNightQuote = (notionalQuote * (ratePerLot / 100)) / 365;
  } else {
    // Points-based swap. Brokers quote FX swap in MT5-style "points," where
    // for a 4/5-decimal Forex pair 1 pip = 10 points — i.e. the swap unit is
    // a tenth of the pip used everywhere else in this file. Metals/oil don't
    // subdivide their quoted price that way, so their swap rate is already
    // in the same units as tickSize. Using tickSize directly for Forex here
    // previously inflated every FX pair's swap cost by 10x (e.g. EURUSD
    // showed -$62/night/lot against a real-world figure of roughly -$6).
    const swapUnitSize = instrument.category === "Forex" ? instrument.tickSize / 10 : instrument.tickSize;
    perNightQuote = ratePerLot * swapUnitSize * instrument.contractSize * lots;
  }
  const perNightAccount = convertCurrency(perNightQuote, instrument.quote, accountCcy, rates);
  return { perNightAccount, totalAccount: perNightAccount * nights };
}

// Profit/loss in $ terms is leverage-independent for a fixed lot size — real
// brokers compute it the same way (MT5's OrderCalcProfit doesn't even take
// leverage as an input). What leverage actually changes is how much of that
// trade's required margin came out of your pocket — so the *percentage*
// return on the capital you tied up scales with leverage even though the
// dollar profit doesn't. This is "leverage amplifies gains and losses,"
// expressed correctly: via the capital you committed, not the raw P/L formula.
export function calculateReturnOnMargin({ netAccount, marginAccount }) {
  if (marginAccount <= 0) return null;
  return (netAccount / marginAccount) * 100;
}

export function calculateRisk({ accountEquity, marginRequired, potentialLoss }) {
  const marginUtilizationPct = accountEquity > 0 ? (marginRequired / accountEquity) * 100 : 0;
  const lossPct = accountEquity > 0 ? (Math.abs(potentialLoss) / accountEquity) * 100 : 0;
  let level = "low";
  if (lossPct >= 10 || marginUtilizationPct >= 50) level = "high";
  else if (lossPct >= 5 || marginUtilizationPct >= 25) level = "medium";
  return { marginUtilizationPct, lossPct, level };
}

// Worst-case P/L across a price window around the open price — the basis for
// a "what's the most this trade could lose right now" summary, rather than
// just the single current price/close scenario.
export function calculateWorstCase({ instrument, direction, lots, openPrice, accountCcy, rates, rangePct = 0.04, samples = 20, fees = 0, swapTotal = 0 }) {
  let min = Infinity;
  let max = -Infinity;
  for (let i = 0; i <= samples; i++) {
    const price = openPrice * (1 - rangePct) + openPrice * 2 * rangePct * (i / samples);
    const { netAccount } = calculateProfit({ instrument: { ...instrument, price }, direction, lots, openPrice, closePrice: price, accountCcy, rates, fees, swapTotal });
    if (netAccount < min) min = netAccount;
    if (netAccount > max) max = netAccount;
  }
  return { worstLoss: min, bestGain: max };
}

// How far price would need to move against an open position before losses
// eat through the equity cushion above required margin (a simplified
// stop-out estimate — real brokers also factor in other open positions and
// a stop-out level below 100%, not just 0). P/L is linear in price for spot
// FX/CFDs, so this solves directly rather than scanning samples.
export function calculateMarginCallPrice({ instrument, direction, lots, openPrice, accountCcy, rates, marginCushion, swapTotal = 0, fees = 0 }) {
  const rateFactor = convertCurrency(1, instrument.quote, accountCcy, rates);
  const slope = (direction === "sell" ? -1 : 1) * instrument.contractSize * lots * rateFactor;
  if (slope === 0 || marginCushion <= 0) return { price: null, distancePct: null };
  const price = openPrice + (-marginCushion - (swapTotal - fees)) / slope;
  if (price <= 0) return { price: null, distancePct: null };
  const distancePct = (Math.abs(price - openPrice) / openPrice) * 100;
  return { price, distancePct };
}

export function marginLevel(equity, usedMargin) {
  return usedMargin > 0 ? (equity / usedMargin) * 100 : Infinity;
}

export function marginLevelZone(level) {
  if (level >= 200) return { color: "var(--green)", label: "Healthy" };
  if (level >= 100) return { color: "var(--yellow)", label: "Caution" };
  return { color: "var(--red)", label: "At Risk" };
}

export function calculateWithdrawal({ equity, usedMargin, amount, method }) {
  const fee = Math.max(amount * method.feePct, method.minFee);
  const finalReceived = Math.max(0, amount - fee);
  const maxSafeWithdrawal = Math.max(0, equity - usedMargin * 2); // floor: keep margin level >= 200%
  const newEquity = equity - amount;
  const newMarginLevel = marginLevel(newEquity, usedMargin);
  const exceedsSafe = amount > maxSafeWithdrawal;
  return { fee, finalReceived, maxSafeWithdrawal, newMarginLevel, newEquity, exceedsSafe };
}
