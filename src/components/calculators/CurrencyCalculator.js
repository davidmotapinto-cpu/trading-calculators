import { useState } from "react";
import { html } from "../../lib/html.js";
import { SliderField } from "../SliderField.js";
import { InfoTooltip } from "../InfoTooltip.js";
import { FormulaExplainer } from "../FormulaExplainer.js";
import { SaveSimulationButton } from "../SaveSimulationButton.js";
import { CURRENCIES, RATES } from "../../lib/fxRates.js";
import { convertCurrency } from "../../lib/calculations.js";
import { formatMoney } from "../../lib/format.js";

export function CurrencyCalculator() {
  const [from, setFrom] = useState("USD");
  const [to, setTo] = useState("EUR");
  const [amount, setAmount] = useState(1000);
  const [markup, setMarkup] = useState(0);

  const baseRate = convertCurrency(1, from, to, RATES);
  const effectiveRate = baseRate * (1 - markup / 100);
  const result = amount * effectiveRate;

  return html`
    <div class="calc-card">
      <h2 class="calc-title">
        Currency Calculator
        <${InfoTooltip} title="What is the markup for?">
          Some brokers apply a small spread/fee on currency conversions. Set it to 0 to see the raw market rate.
        </${InfoTooltip}>
      </h2>
      <div class="row-2">
        <div class="field">
          <label>From</label>
          <select value=${from} onChange=${(e) => setFrom(e.target.value)}>
            ${CURRENCIES.map((c) => html`<option value=${c}>${c}</option>`)}
          </select>
        </div>
        <div class="field">
          <label>To</label>
          <select value=${to} onChange=${(e) => setTo(e.target.value)}>
            ${CURRENCIES.map((c) => html`<option value=${c}>${c}</option>`)}
          </select>
        </div>
      </div>
      <${SliderField} label="Amount" value=${amount} min="0" max="100000" step="10" onChange=${setAmount} format=${(v) => formatMoney(v, from)} />
      <${SliderField} label="Markup / Fee" value=${markup} min="0" max="5" step="0.1" onChange=${setMarkup} format=${(v) => `${v.toFixed(1)}%`} />
      <div class="result-box">
        <div class="result-main">Converted Amount: ${formatMoney(result, to)}</div>
        <div class="result-sub">Rate: 1 ${from} = ${effectiveRate.toFixed(4)} ${to} ${markup > 0 ? `(includes ${markup.toFixed(1)}% markup)` : ""}</div>
      </div>
      <${FormulaExplainer}
        concept="currency conversion"
        explanation="Conversions use the live market rate between the two currencies, then apply an optional markup/fee — common on broker withdrawal and deposit conversions."
        formula="Converted Amount = Amount × Market Rate × (1 − Markup % / 100)"
        example=${`${amount.toLocaleString()} ${from} × ${baseRate.toFixed(4)} × (1 − ${markup.toFixed(1)}%) = ${formatMoney(result, to)}`}
      />
      <${SaveSimulationButton}
        calculator="Currency"
        instrument=${`${from} → ${to}`}
        summary=${`${formatMoney(amount, from)} → ${formatMoney(result, to)}`}
        details=${{ "Rate": effectiveRate.toFixed(4), "Markup": `${markup.toFixed(1)}%` }}
      />
    </div>
  `;
}
