import { useEffect, useMemo, useState } from "react";
import { html } from "../../lib/html.js";
import { InstrumentPicker } from "../InstrumentPicker.js";
import { SliderField } from "../SliderField.js";
import { PriceField } from "../PriceField.js";
import { ProfitChart } from "../ProfitChart.js";
import { RiskGauge } from "../RiskGauge.js";
import { AIInsight } from "../AIInsight.js";
import { TradeCTA } from "../TradeCTA.js";
import { SaveSimulationButton } from "../SaveSimulationButton.js";
import { AccountTypeCompare } from "../AccountTypeCompare.js";
import { DataSourceBadge } from "../DataSourceBadge.js";
import { useAccount } from "../../context/AccountContext.js";
import { useLiveTicker } from "../../hooks/useLiveTicker.js";
import { getInstrument, lotRangeFor, getQuote, priceSpanFor } from "../../lib/instruments.js";
import { priceDecimals } from "../../lib/priceFormat.js";
import { calculateMargin, calculatePipValue, calculateProfit, calculateSwap, calculateRisk, calculateWorstCase, calculateMarginCallPrice, calculateReturnOnMargin } from "../../lib/calculations.js";
import { estimateTradingCost } from "../../lib/accountTypes.js";
import { RATES } from "../../lib/fxRates.js";
import { formatMoney } from "../../lib/format.js";

export function AllInOneCalculator() {
  const { account, updateAccount } = useAccount();
  const [symbol, setSymbol] = useState("EURUSD");
  const [direction, setDirection] = useState("buy");
  const [lots, setLots] = useState(1);
  const leverage = account.leverage;
  const [openPrice, setOpenPrice] = useState(null);
  const [closePrice, setClosePrice] = useState(null);
  const [nights, setNights] = useState(1);

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

  const margin = useMemo(
    () => calculateMargin({ instrument: priced, lots, leverage, accountCcy: account.currency, rates: RATES }),
    [priced.price, lots, leverage, account.currency]
  );
  const pip = useMemo(
    () => calculatePipValue({ instrument: priced, lots, accountCcy: account.currency, rates: RATES }),
    [priced.price, lots, account.currency]
  );
  const tradingCost = estimateTradingCost({ accountType: account.accountType, lots, pipValuePerUnitAccount: pip.perUnitAccount });

  const swap = useMemo(
    () => calculateSwap({ instrument: priced, direction, lots, nights, accountCcy: account.currency, rates: RATES }),
    [priced.price, direction, lots, nights, account.currency]
  );

  const profit = useMemo(() => {
    if (openPrice == null || closePrice == null) return { netAccount: 0, grossAccount: 0, pipsMoved: 0 };
    return calculateProfit({ instrument: priced, direction, lots, openPrice, closePrice, accountCcy: account.currency, rates: RATES, fees: tradingCost.totalCost, swapTotal: swap.totalAccount });
  }, [priced.price, direction, lots, openPrice, closePrice, account.currency, tradingCost.totalCost, swap.totalAccount]);
  const worstCase = useMemo(() => {
    if (openPrice == null) return { worstLoss: 0 };
    return calculateWorstCase({ instrument: priced, direction, lots, openPrice, accountCcy: account.currency, rates: RATES, rangePct: spanPct, swapTotal: swap.totalAccount, fees: tradingCost.totalCost });
  }, [priced.price, direction, lots, openPrice, account.currency, spanPct, swap.totalAccount, tradingCost.totalCost]);

  const risk = calculateRisk({
    accountEquity: account.balance,
    marginRequired: margin.marginAccount,
    potentialLoss: worstCase.worstLoss,
  });

  const returnOnMarginPct = calculateReturnOnMargin({ netAccount: profit.netAccount, marginAccount: margin.marginAccount });

  const marginCushion = Math.max(0, account.balance - margin.marginAccount);
  const marginCall = useMemo(() => {
    if (openPrice == null) return { price: null, distancePct: null };
    return calculateMarginCallPrice({ instrument: priced, direction, lots, openPrice, accountCcy: account.currency, rates: RATES, marginCushion, swapTotal: swap.totalAccount, fees: tradingCost.totalCost });
  }, [priced.price, direction, lots, openPrice, account.currency, marginCushion, swap.totalAccount, tradingCost.totalCost]);

  return html`
    <div class="calc-card all-in-one">
      <h2 class="calc-title">All-in-One Trade Calculator</h2>
      <p class="calc-subtitle">Model a full trade — margin, value per ${instrument.unitLabel}, profit/loss, swap, and risk — before you execute.</p>

      <${InstrumentPicker} value=${symbol} onChange=${setSymbol} />
      <div class="live-price">
        Mid price: <strong>${livePrice.toFixed(decimals)}</strong>
        <span class="live-dot"></span>
        <${DataSourceBadge} symbol=${symbol} />
        <span class="live-quote"><span class="bid">Bid ${quote.bid.toFixed(decimals)}</span><span class="ask">Ask ${quote.ask.toFixed(decimals)}</span></span>
      </div>
      <div class="direction-toggle">
        <button class=${direction === "buy" ? "active buy" : "buy"} onClick=${() => setDirection("buy")}>Buy</button>
        <button class=${direction === "sell" ? "active sell" : "sell"} onClick=${() => setDirection("sell")}>Sell</button>
      </div>
      <div class="row-2">
        <${SliderField} label="Lot Size" value=${lots} min=${range.min} max=${range.max} step=${range.step} onChange=${setLots} format=${(v) => v.toFixed(2)} />
        <${SliderField} label="Account Leverage" value=${leverage} min="1" max="500" step="1" onChange=${(v) => updateAccount({ leverage: v })} format=${(v) => `1:${v}`} />
      </div>
      ${openPrice != null &&
      html`
        <div class="row-2">
          <${PriceField} label="Open Price" value=${openPrice} step=${instrument.tickSize} decimals=${decimals} onChange=${setOpenPrice} spanPct=${spanPct} />
          <${PriceField} label="Current/Close Price" value=${closePrice} step=${instrument.tickSize} decimals=${decimals} onChange=${setClosePrice} spanPct=${spanPct} />
        </div>
      `}
      <${SliderField} label="Nights Held (swap)" value=${nights} min="0" max="30" step="1" onChange=${setNights} />

      <div class="output-grid">
        <div class="output-card">
          <div class="output-label">Required Margin</div>
          <div class="output-value">${formatMoney(margin.marginAccount, account.currency)}</div>
        </div>
        <div class="output-card">
          <div class="output-label">${instrument.unitLabel[0].toUpperCase()}${instrument.unitLabel.slice(1)} Value</div>
          <div class="output-value">${formatMoney(pip.perUnitAccount, account.currency)}</div>
        </div>
        <div class="output-card">
          <div class="output-label">Net Profit / Loss</div>
          <div class="output-value ${profit.netAccount >= 0 ? "positive" : "negative"}">${profit.netAccount >= 0 ? "+" : ""}${formatMoney(profit.netAccount, account.currency)}</div>
        </div>
        <div class="output-card">
          <div class="output-label">Swap (${nights}n)</div>
          <div class="output-value ${swap.totalAccount >= 0 ? "positive" : "negative"}">${formatMoney(swap.totalAccount, account.currency)}</div>
        </div>
        <div class="output-card">
          <div class="output-label">${account.accountType === "premier" ? "Commission" : "Spread Cost"} (${account.accountType === "premier" ? "Premier" : "Standard"})</div>
          <div class="output-value">${formatMoney(tradingCost.totalCost, account.currency)}</div>
        </div>
        ${returnOnMarginPct != null &&
        html`
          <div class="output-card">
            <div class="output-label">Return on Margin (1:${leverage})</div>
            <div class="output-value ${returnOnMarginPct >= 0 ? "positive" : "negative"}">${returnOnMarginPct >= 0 ? "+" : ""}${returnOnMarginPct.toFixed(1)}%</div>
          </div>
        `}
      </div>
      ${swap.totalAccount > 0 && html`<div class="swap-note">A swap credit reflects the interest-rate gap between the two currencies for this direction — it isn't free money and can flip if rates change.</div>`}

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
        fees=${tradingCost.totalCost}
        swapTotal=${swap.totalAccount}
        marginCallPrice=${marginCall.price}
        marginCallDistancePct=${marginCall.distancePct}
        onReset=${() => {
          setOpenPrice(livePrice);
          setClosePrice(livePrice);
          setDirection("buy");
          setLots(1);
          setNights(1);
        }}
      />
      <${RiskGauge} marginUtilizationPct=${risk.marginUtilizationPct} lossPct=${risk.lossPct} level=${risk.level} />
      <${AccountTypeCompare} lots=${lots} pipValuePerUnitAccount=${pip.perUnitAccount} accountCcy=${account.currency} currentType=${account.accountType} />
      <${AIInsight} level=${risk.level} marginUtilizationPct=${risk.marginUtilizationPct} lossPct=${risk.lossPct} marginAccount=${margin.marginAccount} lossAmount=${worstCase.worstLoss} accountCcy=${account.currency} lots=${lots} lotStep=${range.step} marginCallDistancePct=${marginCall.distancePct} leverage=${leverage} />
      <${TradeCTA} label="Start Trading" />
      <${SaveSimulationButton}
        calculator="All-in-One"
        instrument=${instrument.label}
        summary=${`${direction === "buy" ? "Buy" : "Sell"} ${lots.toFixed(2)} lots at 1:${leverage}: ${profit.netAccount >= 0 ? "+" : ""}${formatMoney(profit.netAccount, account.currency)}`}
        details=${{
          "Margin": formatMoney(margin.marginAccount, account.currency),
          "Open": openPrice?.toFixed(decimals),
          "Close": closePrice?.toFixed(decimals),
          "Swap": formatMoney(swap.totalAccount, account.currency),
          "Risk": risk.level,
        }}
      />
    </div>
  `;
}
