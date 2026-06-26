import { useMemo, useState } from "react";
import { html } from "../../lib/html.js";
import { InstrumentPicker } from "../InstrumentPicker.js";
import { SliderField } from "../SliderField.js";
import { InfoTooltip } from "../InfoTooltip.js";
import { FormulaExplainer } from "../FormulaExplainer.js";
import { SaveSimulationButton } from "../SaveSimulationButton.js";
import { useAccount } from "../../context/AccountContext.js";
import { useLiveTicker } from "../../hooks/useLiveTicker.js";
import { getInstrument, lotRangeFor } from "../../lib/instruments.js";
import { calculateSwap } from "../../lib/calculations.js";
import { RATES } from "../../lib/fxRates.js";
import { formatMoney } from "../../lib/format.js";

export function SwapCalculator() {
  const { account } = useAccount();
  const [symbol, setSymbol] = useState("EURUSD");
  const [direction, setDirection] = useState("buy");
  const [lots, setLots] = useState(1);
  const [nights, setNights] = useState(3);
  const [manualOverride, setManualOverride] = useState(null);

  const instrument = getInstrument(symbol);
  const livePrice = useLiveTicker(symbol);
  const priced = { ...instrument, price: livePrice };
  const range = lotRangeFor(instrument.category);

  const effectiveInstrument = useMemo(() => {
    if (manualOverride == null) return priced;
    return { ...priced, swapLong: manualOverride, swapShort: manualOverride, swapType: "points" };
  }, [priced.price, manualOverride]);

  const { perNightAccount, totalAccount } = useMemo(
    () => calculateSwap({ instrument: effectiveInstrument, direction, lots, nights, accountCcy: account.currency, rates: RATES }),
    [effectiveInstrument, direction, lots, nights, account.currency]
  );

  return html`
    <div class="calc-card">
      <h2 class="calc-title">
        Swap Calculator
        <${InfoTooltip} title="How is swap calculated?">
          Swap (overnight financing) is charged or credited for positions held past the daily rollover. It is quoted per lot per night for most instruments, or as an annualized percentage of notional for indices and crypto.
        </${InfoTooltip}>
      </h2>
      <${InstrumentPicker} value=${symbol} onChange=${setSymbol} />
      <div class="direction-toggle">
        <button class=${direction === "buy" ? "active buy" : "buy"} onClick=${() => setDirection("buy")}>Long</button>
        <button class=${direction === "sell" ? "active sell" : "sell"} onClick=${() => setDirection("sell")}>Short</button>
      </div>
      <${SliderField} label="Lot Size" value=${lots} min=${range.min} max=${range.max} step=${range.step} onChange=${setLots} format=${(v) => v.toFixed(2)} />
      <${SliderField} label="Nights Held" value=${nights} min="0" max="30" step="1" onChange=${setNights} />
      <${SliderField}
        label="Manual Daily Swap Override (per lot, optional)"
        value=${manualOverride ?? 0}
        min="-50"
        max="50"
        step="0.1"
        onChange=${setManualOverride}
        format=${(v) => (manualOverride == null ? "using platform rate" : v.toFixed(1))}
      />
      <div class="result-box">
        <div class="result-main ${totalAccount >= 0 ? "positive" : "negative"}">Swap ${totalAccount >= 0 ? "Credit" : "Cost"}: ${formatMoney(totalAccount, account.currency)}</div>
        <div class="result-sub">${formatMoney(perNightAccount, account.currency)} per night over ${nights} night(s)</div>
      </div>
      <${FormulaExplainer}
        concept="swap"
        explanation="Swap is the overnight financing cost (or credit) for holding a leveraged position past the daily rollover, reflecting the interest-rate differential between the two currencies or the cost of carry for the instrument."
        formula=${effectiveInstrument.swapType === "percent" ? "Swap/Night = (Lots × Contract Size × Price) × (Annual Rate % / 100) / 365" : "Swap/Night = Rate (points/lot/night) × Tick Size × Contract Size × Lots"}
        example=${`${formatMoney(perNightAccount, account.currency)} per night × ${nights} night(s) = ${formatMoney(totalAccount, account.currency)}`}
      />
      <${SaveSimulationButton}
        calculator="Swap"
        instrument=${instrument.label}
        summary=${`Swap ${totalAccount >= 0 ? "Credit" : "Cost"}: ${formatMoney(totalAccount, account.currency)} over ${nights} night(s)`}
        details=${{ "Direction": direction === "buy" ? "Long" : "Short", "Lot size": lots.toFixed(2), "Nights": nights }}
      />
    </div>
  `;
}
