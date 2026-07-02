# MT5 Trading Calculator Panel

An on-chart calculator panel for MetaTrader 5 — margin, value-per-point, profit/loss, and swap for the current symbol, using **real** account and broker data instead of the web app's simulated prices. It is built as an **Indicator** (not an Expert Advisor) because it never calls `OrderSend` / `OrderModify` / `OrderClose` — it only displays numbers. If you later want it to place trades from the panel, that requires rebuilding it as an EA (different `#property`, different permissions, real trading risk).

This is a separate codebase from the web prototype — MQL5 shares no code, libraries, or runtime with the JavaScript/React app. The two are independent implementations of the same calculator math.

## Why the numbers should be more accurate than the web prototype

Instead of reimplementing margin/profit/swap formulas (which requires guessing each instrument's contract size, pip convention, and currency conversion), this panel delegates to the terminal's own broker-aware functions:

- **Margin** → `OrderCalcMargin()` — reflects this broker's actual margin rules (including tiered margin, if your broker uses it).
- **Profit/Loss** → `OrderCalcProfit()` — reflects the real contract size and any currency conversion for this account.
- **Value per point** and **swap** → read directly from `SymbolInfoDouble`/`SymbolInfoInteger` (`SYMBOL_TRADE_TICK_VALUE`, `SYMBOL_SWAP_LONG/SHORT`, `SYMBOL_SWAP_MODE`, etc.) for the selected symbol.

The one area to double check against your broker's contract specification: swap symbols using `SYMBOL_SWAP_MODE_CURRENCY_SYMBOL/MARGIN/DEPOSIT` (rather than `SYMBOL_SWAP_MODE_POINTS`) are assumed to be money-per-lot-per-day in account currency directly — verify this matches your broker's documentation for any symbol where that mode applies.

## Install

1. Open MetaTrader 5 → **File → Open Data Folder**.
2. Copy `TradingCalculatorPanel.mq5` into `MQL5\Indicators\`.
3. Open **MetaEditor** (F4 from MT5), open the file, press **F7** to compile.
4. Back in MT5, refresh the **Navigator** panel, find it under Indicators, and drag it onto any chart.
5. The panel appears at the configured `InpPanelX`/`InpPanelY` offset. Edit symbol/lots/open/close/nights, click **Calculate** (or **Use Market Price** to pull the current bid/ask first).

## Honest caveats

- **I have no MetaEditor/MT5 in this environment, so this has not been compiled or run.** The Controls-library usage (`CAppDialog`, `CButton`, `CEdit`, `CLabel`, `EVENT_MAP_BEGIN/END`) follows MetaQuotes' standard documented pattern, but if MetaEditor reports compiler errors, paste them back and they can be fixed directly — that's a normal part of getting a first MQL5 build working, not a sign the approach is wrong.
- It reads `_Symbol` from the chart it's attached to by default, but you can type any symbol name available in your Market Watch.
- Swap-mode handling for points-based swap multiplies points by tick value — standard for most FX/CFD symbols, but always cross-check against your broker's per-symbol contract specification before relying on it for real decisions.
- This panel does not auto-refresh on every tick (to avoid unnecessary load) — click **Calculate** after changing inputs or when you want fresh bid/ask via **Use Market Price**.
