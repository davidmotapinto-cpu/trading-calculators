import { useMemo, useState } from "react";
import { html } from "../../lib/html.js";
import { InstrumentPicker } from "../InstrumentPicker.js";
import { SliderField } from "../SliderField.js";
import { InfoTooltip } from "../InfoTooltip.js";
import { FormulaExplainer } from "../FormulaExplainer.js";
import { SaveSimulationButton } from "../SaveSimulationButton.js";
import { DataSourceBadge } from "../DataSourceBadge.js";
import { useAccount } from "../../context/AccountContext.js";
import { useLiveTicker } from "../../hooks/useLiveTicker.js";
import { getInstrument, lotRangeFor, getQuote } from "../../lib/instruments.js";
import { priceDecimals } from "../../lib/priceFormat.js";
import { calculatePipValue } from "../../lib/calculations.js";
import { RATES } from "../../lib/fxRates.js";
import { formatMoney } from "../../lib/format.js";

export function PipValueCalculator() {
  const { account } = useAccount();
  const [symbol, setSymbol] = useState("EURUSD");
  const [lots, setLots] = useState(1);
  const [units, setUnits] = useState(1);

  const instrument = getInstrument(symbol);
  const livePrice = useLiveTicker(symbol);
  const priced = { ...instrument, price: livePrice };
  const range = lotRangeFor(instrument.category);
  const decimals = priceDecimals(instrument.tickSize);
  const quote = getQuote(instrument, livePrice);

  const { perUnitAccount } = useMemo(
    () => calculatePipValue({ instrument: priced, lots, accountCcy: account.currency, rates: RATES }),
    [priced.price, lots, account.currency]
  );

  return html`
    <div class="calc-card">
      <h2 class="calc-title">
        Pip Value Calculator
        <${InfoTooltip} title="What is a pip?">
          A pip (or point, for indices/crypto) is the smallest standard price increment for an instrument. Pip value tells you how much your account currency moves per pip of price change.
        </${InfoTooltip}>
      </h2>
      <${InstrumentPicker} value=${symbol} onChange=${setSymbol} />
      <div class="live-price">
        Mid price: <strong>${livePrice.toFixed(decimals)}</strong>
        <span class="live-dot"></span>
        <${DataSourceBadge} symbol=${symbol} />
        <span class="live-quote"><span class="bid">Bid ${quote.bid.toFixed(decimals)}</span><span class="ask">Ask ${quote.ask.toFixed(decimals)}</span></span>
      </div>
      <${SliderField} label="Lot Size" value=${lots} min=${range.min} max=${range.max} step=${range.step} onChange=${setLots} format=${(v) => v.toFixed(2)} />
      <${SliderField} label=${`Number of ${instrument.unitLabel}s`} value=${units} min="1" max="500" step="1" onChange=${setUnits} />
      <div class="result-box">
        <div class="result-main">${instrument.unitLabel[0].toUpperCase()}${instrument.unitLabel.slice(1)} Value: ${formatMoney(perUnitAccount, account.currency)} per ${instrument.unitLabel}</div>
        <div class="result-sub">Total for ${units} ${instrument.unitLabel}${units === 1 ? "" : "s"}: ${formatMoney(perUnitAccount * units, account.currency)}</div>
      </div>
      <${FormulaExplainer}
        concept=${`${instrument.unitLabel} value`}
        explanation=${`A ${instrument.unitLabel} is the smallest standard price increment for this instrument. Its value scales directly with lot size — bigger positions move more money per ${instrument.unitLabel}.`}
        formula=${`${instrument.unitLabel[0].toUpperCase()}${instrument.unitLabel.slice(1)} Value = Tick Size × Contract Size × Lots`}
        example=${`${instrument.tickSize} × ${instrument.contractSize.toLocaleString()} × ${lots.toFixed(2)} = ${formatMoney(perUnitAccount, account.currency)} per ${instrument.unitLabel}`}
      />
      <${SaveSimulationButton}
        calculator="Pip Value"
        instrument=${instrument.label}
        summary=${`${formatMoney(perUnitAccount, account.currency)} per ${instrument.unitLabel}, ${lots.toFixed(2)} lots`}
        details=${{ "Lot size": lots.toFixed(2), [`Number of ${instrument.unitLabel}s`]: units, "Price": livePrice.toFixed(decimals) }}
      />
    </div>
  `;
}
