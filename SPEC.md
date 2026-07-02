# Trading Calculators — Technical Spec & Formulas

Companion to the PRD. Covers the calculation logic, data contracts, and architecture of the v2 prototype, and what's left to do for production.

## Architecture

This is a real React app (hooks, context, component composition) with **no build step**, because Node/npm isn't installed in this environment. It runs via:

- An **import map** in `index.html` resolving `react`, `react-dom/client`, and `htm` to esm.sh CDN builds.
- **`htm`** (`src/lib/html.js`) — a JSX-like tagged-template syntax (`` html`<div>...</div>` ``) that needs no compiler. It binds to a small wrapper around `React.createElement` that translates `class`/`for` → `className`/`htmlFor`, since htm normally pairs with Preact (which accepts the raw HTML names) rather than React.
- `serve.ps1` — a minimal PowerShell static file server. ES module `import` statements need `http://`, not `file://`, so this is required for local preview only.

**Migration path once Node is available:** swap the import map for real `npm install react react-dom`, run every `` html`...` `` template through htm's babel/codemod (or hand-convert — the syntax is nearly identical to JSX), and drop `src/lib/html.js`. No calculation logic changes.

### Module layout
```
src/
  lib/
    calculations.js   — pure financial functions (no React, fully unit-testable)
    instruments.js     — instrument catalog (Forex/Metals/Indices/Commodities/Crypto)
    fxRates.js          — mock FX rate table + withdrawal fee schedule
    format.js           — money/number formatting
    html.js              — htm binding (delete when bundled)
  hooks/
    useLiveTicker.js   — simulated live pricing (single interval + pub/sub)
  context/
    AccountContext.js — simulated account state (balance, leverage, currency, used margin)
  components/
    SliderField, InfoTooltip, InstrumentPicker, HealthBar, RiskGauge, ProfitChart, AccountPanel
    calculators/
      MarginCalculator, PipValueCalculator, ProfitCalculator, SwapCalculator,
      CurrencyCalculator, WithdrawalCalculator, AllInOneCalculator
  App.js, main.js
```

### Data layer — replace these three seams for production
| Module | Mocked as | Production source |
|---|---|---|
| `src/lib/instruments.js` (`INSTRUMENTS`) | static object, manually refreshed baseline prices | `GET /instruments` from Trading Platform (MT4/MT5/bridge) |
| `src/hooks/useLiveTicker.js` (`tick()`) | `setInterval` random walk off the baseline price | WebSocket/SSE price feed — keep `useLiveTicker(symbol)`'s return signature identical |
| `src/context/AccountContext.js` (`fetchAccount`) | static default object | CRM / Trading Platform account API, scoped to the logged-in client |

All monetary math resolves in the instrument's **quote currency** first, then converts once to the account/display currency (`src/lib/calculations.js: convertCurrency`) — this is what makes cross-currency instruments (EUR/GBP, GER40 quoted in EUR, UK100 quoted in GBP) work correctly regardless of account currency, and is also what made adding **AED** as an account currency a one-line change (`src/lib/fxRates.js: RATES.AED = 3.6725`, pegged to USD) — every calculator (margin, pip value, P/L, conversion, withdrawal) picks it up automatically since they all read the account currency list from `CURRENCIES = Object.keys(RATES)` rather than hardcoding options.

**On "real-time" pricing**: there is no live market data source wired up. `INSTRUMENTS[symbol].price` is a manually-set baseline that needs periodic manual review until a real feed replaces it (see Open Items #4). `useLiveTicker` only adds a small random walk on top of that baseline for the "live updating" feel — it does not correct a stale baseline.

## Formulas (`src/lib/calculations.js`)

### 1. Margin
```
notionalValue (quote ccy) = lots × contractSize × price
requiredMargin (quote ccy) = notionalValue / leverage
requiredMargin (account ccy) = convert(requiredMargin, quoteCcy, accountCcy)
```
Leverage is a free slider (1–1000) rather than fixed tiers, simulating "variable leverage." If per-account tiered margin is available from the trading platform, substitute the tier-specific rate for `leverage`.

### 2. Pip/Point Value
```
perUnit (quote ccy) = tickSize × contractSize × lots
perUnit (account ccy) = convert(perUnit, quoteCcy, accountCcy)
```
`tickSize` and `unitLabel` ("pip" vs "point") are per-instrument so the UI/label is correct across Forex, metals, indices, commodities, and crypto.

### 3. Profit / Loss
```
priceDiff = (closePrice - openPrice)               if direction = Buy
priceDiff = (openPrice - closePrice)               if direction = Sell
grossProfit (quote ccy) = priceDiff × contractSize × lots
grossProfit (account ccy) = convert(grossProfit, quoteCcy, accountCcy)
netProfit = grossProfit (account ccy) + swapTotal - fees
pipsMoved = priceDiff / tickSize
```
Same formula powers the Profit Calculator's live P/L line and the Profit Chart's full price-range curve (just sampled at many `closePrice` points instead of one).

### 4. Swap
Two modes, selected per instrument via `swapType`:
```
"points"  → perNight (quote ccy) = ratePerLot × tickSize × contractSize × lots
"percent" → perNight (quote ccy) = (lots × contractSize × price) × (ratePerLot / 100) / 365
swapTotal = perNight (account ccy) × nightsHeld
```
Forex/metals/commodities use points-based swap (quoted per lot per night); indices/crypto use an annualized-percent-of-notional convention, which is closer to how those instruments' overnight financing is typically quoted. The Swap Calculator also accepts a manual per-lot override, per PRD requirement.

### 5. Currency Conversion
```
baseRate = convert(1, fromCcy, toCcy)
effectiveRate = baseRate × (1 - markupPct / 100)
result = amount × effectiveRate
```

### 6. Risk Exposure
```
marginUtilizationPct = marginRequired / accountEquity × 100
lossPct = |potentialLoss| / accountEquity × 100
level = "high" if lossPct ≥ 10 or marginUtilizationPct ≥ 50
        "medium" if lossPct ≥ 5 or marginUtilizationPct ≥ 25
        else "low"
```
This is a simplified proxy (current scenario P/L vs. equity), not a true stop-loss-distance risk model — flagged as an open item below since the PRD's "tell the user if the trade is safe or risky" idea implies something more deliberate (e.g., factoring in a stop-loss input).

### 7. Withdrawable Amount & Account Health
```
marginLevel(equity, usedMargin) = (equity / usedMargin) × 100      [Infinity if usedMargin = 0]
maxSafeWithdrawal = max(0, equity - usedMargin × 2)   // floor: keep margin level >= 200%
fee = max(withdrawalAmount × method.feePct, method.minFee)
finalReceived = withdrawalAmount - fee
newMarginLevel = marginLevel(equity - withdrawalAmount, usedMargin)
```
**Health bar thresholds** (must match the portal's existing component): ≥200% green/Healthy, 100–200% yellow/Caution, <100% red/At Risk. Bar fill % is `min(level, 500) / 500 × 100`; a marker shows the pre-withdrawal level for before/after comparison on one bar.

**Withdrawal fee schedule** (`src/lib/fxRates.js: WITHDRAWAL_METHODS` — placeholder, confirm with Finance/Compliance): Bank Transfer 0.8%, Card 1.5% (min $1), E-Wallet 0.5%, Crypto 1.0%.

## Instrument Catalog (`src/lib/instruments.js`)

24 instruments across 5 categories (Forex majors/minors/cross, Metals, Indices, Commodities, Crypto), each carrying `tickSize`, `contractSize`, `quote` currency, mock `price`, and swap rates. **All contract specs and prices are illustrative** — validate against the real trading platform spec sheet and a live price source before launch (point value conventions for indices and crypto especially vary by provider). Adding an instrument is a one-line addition to the `INSTRUMENTS` object; nothing else needs to change.

Two category-keyed helpers drive UI scaling so sliders/charts feel right for both a 1.08 Forex pair and a 105,000 crypto price: `lotRangeFor(category)` (lot-size slider bounds) and `priceSpanFor(category)` (how wide, as a %, the price slider and profit chart window should be — tighter for Forex, wider for Crypto/Commodities).

## Formula Transparency (`src/components/FormulaExplainer.js`)

Every calculator has a collapsed "How is this calculated?" section showing, in order: a plain-English explanation of the concept, the actual formula, and that formula applied to the user's current live inputs (numbers, not placeholders). This is rule-based string formatting, not a model call — same for `src/components/AIInsight.js`'s "AI-style" commentary, which is a lookup table of headline copy keyed by the existing risk `level` plus a suggested-lot-size calculation when worst-case loss exceeds 5% of equity. Neither component calls an LLM; "AI" here describes the tone/usefulness of rule-based copy, not the implementation. If genuine LLM-generated commentary is wanted later, this is the seam to swap.

## Open Items for Validation (Trading/Compliance/Tech)

1. Confirm whether `maxSafeWithdrawal`'s 200%-margin-level floor is the right threshold (placeholder pending Trading sign-off).
2. Confirm real withdrawal fee schedule per method/currency/region (Compliance + Finance).
3. Confirm whether margin calculator should use per-account tiered margin from the trading platform instead of the flat-leverage formula.
4. Confirm tick size / contract size / swap convention for the full instrument universe, and replace the manually-set baseline `price` values with a real feed — especially indices and crypto financing/pricing, which move fast and vary by provider.
5. The risk indicator is a simplified P/L-vs-equity proxy. Decide whether the "is this trade safe?" framing should instead use a stop-loss-distance model, which needs a stop-loss input added to the Profit/All-in-One calculators.
6. Decide on a real-time data transport (WebSocket vs. polling) to replace `useLiveTicker`'s simulated random walk, and confirm acceptable price-update latency.
7. Confirm AED display formatting conventions (decimal places, symbol placement) match what Equiti's portal uses elsewhere — `Intl.NumberFormat` is used as-is today.
