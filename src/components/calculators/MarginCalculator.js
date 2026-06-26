import { useMemo, useState } from "react";
import { html } from "../../lib/html.js";
import { InstrumentPicker } from "../InstrumentPicker.js";
import { SliderField } from "../SliderField.js";
import { InfoTooltip } from "../InfoTooltip.js";
import { FormulaExplainer } from "../FormulaExplainer.js";
import { TradeCTA } from "../TradeCTA.js";
import { SaveSimulationButton } from "../SaveSimulationButton.js";
import { useAccount } from "../../context/AccountContext.js";
import { useLiveTicker } from "../../hooks/useLiveTicker.js";
import { getInstrument, lotRangeFor, getQuote } from "../../lib/instruments.js";
import { priceDecimals } from "../../lib/priceFormat.js";
import { calculateMargin } from "../../lib/calculations.js";
import { RATES } from "../../lib/fxRates.js";
import { formatMoney } from "../../lib/format.js";

export function MarginCalculator() {
  const { account, updateAccount } = useAccount();
  const [symbol, setSymbol] = useState("EURUSD");
  const [lots, setLots] = useState(1);
  const leverage = account.leverage;

  const instrument = getInstrument(symbol);
  const livePrice = useLiveTicker(symbol);
  const priced = { ...instrument, price: livePrice };
  const range = lotRangeFor(instrument.category);
  const decimals = priceDecimals(instrument.tickSize);
  const quote = getQuote(instrument, livePrice);
  const lotsError = lots <= 0 ? "Lot size must be greater than zero." : null;

  const { marginAccount, notionalQuote } = useMemo(
    () => calculateMargin({ instrument: priced, lots, leverage, accountCcy: account.currency, rates: RATES }),
    [priced.price, lots, leverage, account.currency]
  );

  const marginPctOfEquity = account.balance > 0 ? (marginAccount / account.balance) * 100 : 0;

  return html`
    <div class="calc-card">
      <h2 class="calc-title">
        Margin Calculator
        <${InfoTooltip} title="What is margin?">
          Margin is the portion of your account equity set aside as collateral to open a leveraged position. It is not a fee — it is released back when the trade closes.
        </${InfoTooltip}>
      </h2>
      <${InstrumentPicker} value=${symbol} onChange=${setSymbol} />
      <div class="live-price">
        Mid price: <strong>${priced.price.toFixed(decimals)}</strong>
        <span class="live-dot" title="Simulated price feed — not connected to a live market data source"></span>
        <span class="sim-badge">Simulated</span>
        <span class="live-quote"><span class="bid">Bid ${quote.bid.toFixed(decimals)}</span><span class="ask">Ask ${quote.ask.toFixed(decimals)}</span></span>
      </div>
      <${SliderField} label="Lot Size" value=${lots} min=${range.min} max=${range.max} step=${range.step} onChange=${setLots} format=${(v) => v.toFixed(2)} />
      ${lotsError && html`<div class="field-error">${lotsError}</div>`}
      <${SliderField} label="Account Leverage" value=${leverage} min="1" max="500" step="1" onChange=${(v) => updateAccount({ leverage: v })} format=${(v) => `1:${v}`} />
      <div class="result-box">
        <div class="result-main">Required Margin: ${formatMoney(marginAccount, account.currency)}</div>
        <div class="result-sub">Notional exposure: ${formatMoney(notionalQuote, instrument.quote)} at 1:${leverage} leverage · ${marginPctOfEquity.toFixed(1)}% of equity</div>
      </div>
      <${FormulaExplainer}
        concept="margin"
        explanation="Margin is the collateral your broker holds while a leveraged position is open. It scales with the size of the trade and shrinks as leverage increases."
        formula="Required Margin = (Lots × Contract Size × Price) / Leverage"
        example=${`(${lots.toFixed(2)} × ${instrument.contractSize.toLocaleString()} × ${priced.price.toFixed(decimals)}) / ${leverage} = ${formatMoney(notionalQuote / leverage, instrument.quote)} → ${formatMoney(marginAccount, account.currency)}`}
      />
      <${TradeCTA} label="Go to Trading Platform" />
      <${SaveSimulationButton}
        calculator="Margin"
        instrument=${instrument.label}
        summary=${`Required Margin: ${formatMoney(marginAccount, account.currency)} at 1:${leverage}, ${lots.toFixed(2)} lots`}
        details=${{ "Lot size": lots.toFixed(2), "Leverage": `1:${leverage}`, "Price": priced.price.toFixed(decimals), "Account currency": account.currency }}
      />
    </div>
  `;
}
