import { useEffect, useMemo, useState } from "react";
import { html } from "../../lib/html.js";
import { InstrumentPicker } from "../InstrumentPicker.js";
import { SliderField } from "../SliderField.js";
import { PriceField } from "../PriceField.js";
import { InfoTooltip } from "../InfoTooltip.js";
import { ProfitChart } from "../ProfitChart.js";
import { RiskGauge } from "../RiskGauge.js";
import { AIInsight } from "../AIInsight.js";
import { FormulaExplainer } from "../FormulaExplainer.js";
import { TradeCTA } from "../TradeCTA.js";
import { SaveSimulationButton } from "../SaveSimulationButton.js";
import { AccountTypeCompare } from "../AccountTypeCompare.js";
import { useAccount } from "../../context/AccountContext.js";
import { useLiveTicker } from "../../hooks/useLiveTicker.js";
import { getInstrument, lotRangeFor, getQuote, priceSpanFor } from "../../lib/instruments.js";
import { priceDecimals } from "../../lib/priceFormat.js";
import { calculateMargin, calculateProfit, calculatePipValue, calculateSwap, calculateRisk, calculateWorstCase, calculateMarginCallPrice, calculateReturnOnMargin } from "../../lib/calculations.js";
import { estimateTradingCost } from "../../lib/accountTypes.js";
import { RATES } from "../../lib/fxRates.js";
import { formatMoney } from "../../lib/format.js";

export function ProfitCalculator() {
  const { account } = useAccount();
  const [symbol, setSymbol] = useState("EURUSD");
  const [direction, setDirection] = useState("buy");
  const [lots, setLots] = useState(1);
  const [openPrice, setOpenPrice] = useState(null);
  const [closePrice, setClosePrice] = useState(null);
  const [fees, setFees] = useState(0);
  const [nights, setNights] = useState(0);

  const instrument = getInstrument(symbol);
  const livePrice = useLiveTicker(symbol);
  const priced = { ...instrument, price: livePrice };
  const range = lotRangeFor(instrument.category);
  const decimals = priceDecimals(instrument.tickSize);
  const quote = getQuote(instrument, livePrice);
  const spanPct = priceSpanFor(instrument.category);

  useEffect(() => {
    setOpenPrice(livePrice);
    setClosePrice(livePrice);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbol]);

  const lotsError = lots <= 0 ? "Lot size must be greater than zero." : null;

  const { perUnitAccount: pipValuePerUnitAccount } = useMemo(
    () => calculatePipValue({ instrument: priced, lots, accountCcy: account.currency, rates: RATES }),
    [priced.price, lots, account.currency]
  );
  const tradingCost = estimateTradingCost({ accountType: account.accountType, lots, pipValuePerUnitAccount });
  const totalFees = fees + tradingCost.totalCost;

  const swap = useMemo(
    () => calculateSwap({ instrument: priced, direction, lots, nights, accountCcy: account.currency, rates: RATES }),
    [priced.price, direction, lots, nights, account.currency]
  );

  const { grossAccount, netAccount, pipsMoved } = useMemo(() => {
    if (openPrice == null || closePrice == null) return { grossAccount: 0, netAccount: 0, pipsMoved: 0 };
    return calculateProfit({ instrument: priced, direction, lots, openPrice, closePrice, accountCcy: account.currency, rates: RATES, fees: totalFees, swapTotal: swap.totalAccount });
  }, [priced.price, direction, lots, openPrice, closePrice, totalFees, swap.totalAccount, account.currency]);

  const { marginAccount } = useMemo(
    () => calculateMargin({ instrument: priced, lots, leverage: account.leverage, accountCcy: account.currency, rates: RATES }),
    [priced.price, lots, account.leverage, account.currency]
  );

  const worstCase = useMemo(() => {
    if (openPrice == null) return { worstLoss: 0 };
    return calculateWorstCase({ instrument: priced, direction, lots, openPrice, accountCcy: account.currency, rates: RATES, rangePct: spanPct, fees: totalFees, swapTotal: swap.totalAccount });
  }, [priced.price, direction, lots, openPrice, account.currency, spanPct, totalFees, swap.totalAccount]);

  const risk = calculateRisk({ accountEquity: account.balance, marginRequired: marginAccount, potentialLoss: worstCase.worstLoss });
  const returnOnMarginPct = calculateReturnOnMargin({ netAccount, marginAccount });

  const marginCushion = Math.max(0, account.balance - marginAccount);
  const marginCall = useMemo(() => {
    if (openPrice == null) return { price: null, distancePct: null };
    return calculateMarginCallPrice({ instrument: priced, direction, lots, openPrice, accountCcy: account.currency, rates: RATES, marginCushion, fees: totalFees, swapTotal: swap.totalAccount });
  }, [priced.price, direction, lots, openPrice, account.currency, marginCushion, totalFees, swap.totalAccount]);

  return html`
    <div class="calc-card">
      <h2 class="calc-title">
        Profit Calculator
        <${InfoTooltip} title="How is profit calculated?">
          Profit/loss is the price difference between your open and close price, multiplied by the contract size and lot size, then converted into your account currency.
        </${InfoTooltip}>
      </h2>
      <${InstrumentPicker} value=${symbol} onChange=${setSymbol} />
      <div class="live-price">
        Mid price: <strong>${livePrice.toFixed(decimals)}</strong>
        <span class="live-dot" title="Simulated price feed — not connected to a live market data source"></span>
        <span class="sim-badge">Simulated</span>
        <span class="live-quote"><span class="bid">Bid ${quote.bid.toFixed(decimals)}</span><span class="ask">Ask ${quote.ask.toFixed(decimals)}</span></span>
      </div>
      <div class="direction-toggle">
        <button class=${direction === "buy" ? "active buy" : "buy"} onClick=${() => setDirection("buy")}>Buy</button>
        <button class=${direction === "sell" ? "active sell" : "sell"} onClick=${() => setDirection("sell")}>Sell</button>
      </div>
      <${SliderField} label="Lot Size" value=${lots} min=${range.min} max=${range.max} step=${range.step} onChange=${setLots} format=${(v) => v.toFixed(2)} />
      ${lotsError && html`<div class="field-error">${lotsError}</div>`}
      ${openPrice != null &&
      html`
        <div class="row-2">
          <${PriceField} label="Open Price" value=${openPrice} step=${instrument.tickSize} decimals=${decimals} onChange=${setOpenPrice} spanPct=${spanPct} />
          <${PriceField} label="Close Price" value=${closePrice} step=${instrument.tickSize} decimals=${decimals} onChange=${setClosePrice} spanPct=${spanPct} />
        </div>
      `}
      <div class="row-2">
        <${SliderField} label="Fees" value=${fees} min="0" max="100" step="0.5" onChange=${setFees} format=${(v) => `$${v.toFixed(2)}`} />
        <${SliderField} label="Nights Held (swap)" value=${nights} min="0" max="30" step="1" onChange=${setNights} />
      </div>
      <div class="result-box">
        <div class="result-main ${netAccount >= 0 ? "positive" : "negative"}">Potential P/L: ${netAccount >= 0 ? "+" : ""}${formatMoney(netAccount, account.currency)}</div>
        <div class="result-sub">Gross: ${formatMoney(grossAccount, account.currency)} · Moved ${pipsMoved.toFixed(1)} ${instrument.unitLabel}s</div>
        <div class="result-sub">${account.accountType === "premier" ? "Commission" : "Spread cost"}: ${formatMoney(tradingCost.totalCost, account.currency)} (${account.accountType === "premier" ? "Premier" : "Standard"} account) ${fees > 0 ? `· Manual fees: ${formatMoney(fees, account.currency)}` : ""}</div>
        ${nights > 0 &&
        html`
          <div class="result-sub ${swap.totalAccount >= 0 ? "positive" : "negative"}">Swap (${nights} night${nights === 1 ? "" : "s"}): ${swap.totalAccount >= 0 ? "+" : ""}${formatMoney(swap.totalAccount, account.currency)}</div>
          ${swap.totalAccount > 0 && html`<div class="result-sub swap-note">A credit here reflects the interest-rate gap between the two currencies for this direction — it isn't free money and can flip if rates change.</div>`}
        `}
        ${returnOnMarginPct != null &&
        html`<div class="result-sub return-on-margin ${returnOnMarginPct >= 0 ? "positive" : "negative"}">Return on margin used: ${returnOnMarginPct >= 0 ? "+" : ""}${returnOnMarginPct.toFixed(1)}% (1:${account.leverage} leverage)</div>`}
      </div>
      <${ProfitChart}
        instrument=${instrument}
        direction=${direction}
        lots=${lots}
        openPrice=${openPrice}
        currentPrice=${closePrice}
        accountCcy=${account.currency}
        rates=${RATES}
        rangePct=${spanPct}
        decimals=${decimals}
        fees=${totalFees}
        swapTotal=${swap.totalAccount}
        marginCallPrice=${marginCall.price}
        marginCallDistancePct=${marginCall.distancePct}
        onReset=${() => {
          setOpenPrice(livePrice);
          setClosePrice(livePrice);
          setDirection("buy");
          setLots(1);
          setFees(0);
          setNights(0);
        }}
      />
      <${RiskGauge} marginUtilizationPct=${risk.marginUtilizationPct} lossPct=${risk.lossPct} level=${risk.level} />
      <${AccountTypeCompare} lots=${lots} pipValuePerUnitAccount=${pipValuePerUnitAccount} accountCcy=${account.currency} currentType=${account.accountType} />
      <${AIInsight} level=${risk.level} marginUtilizationPct=${risk.marginUtilizationPct} lossPct=${risk.lossPct} marginAccount=${marginAccount} lossAmount=${worstCase.worstLoss} accountCcy=${account.currency} lots=${lots} lotStep=${range.step} marginCallDistancePct=${marginCall.distancePct} leverage=${account.leverage} />
      <${FormulaExplainer}
        concept="profit/loss"
        explanation="Profit or loss is driven by how far price moves from your entry, multiplied by your position size. Direction matters: a Buy profits when price rises, a Sell profits when price falls."
        formula="P/L = (Close Price − Open Price) × Contract Size × Lots × Direction, converted to account currency"
        example=${`(${closePrice != null ? closePrice.toFixed(decimals) : "—"} − ${openPrice != null ? openPrice.toFixed(decimals) : "—"}) × ${instrument.contractSize.toLocaleString()} × ${lots.toFixed(2)} = ${formatMoney(grossAccount, account.currency)} gross → ${formatMoney(netAccount, account.currency)} net`}
      />
      <${TradeCTA} label="Go to Trading Platform" />
      <${SaveSimulationButton}
        calculator="Profit"
        instrument=${instrument.label}
        summary=${`${direction === "buy" ? "Buy" : "Sell"} ${lots.toFixed(2)} lots: ${netAccount >= 0 ? "+" : ""}${formatMoney(netAccount, account.currency)}`}
        details=${{ "Open": openPrice?.toFixed(decimals), "Close": closePrice?.toFixed(decimals), "Fees": formatMoney(fees, account.currency), "Swap": formatMoney(swap.totalAccount, account.currency), "Risk": risk.level }}
      />
    </div>
  `;
}
