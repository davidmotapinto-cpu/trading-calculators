import { useMemo, useState } from "react";
import { html } from "../../lib/html.js";
import { SliderField } from "../SliderField.js";
import { HealthBar } from "../HealthBar.js";
import { InfoTooltip } from "../InfoTooltip.js";
import { FormulaExplainer } from "../FormulaExplainer.js";
import { SaveSimulationButton } from "../SaveSimulationButton.js";
import { useAccount } from "../../context/AccountContext.js";
import { WITHDRAWAL_METHODS } from "../../lib/fxRates.js";
import { calculateWithdrawal, marginLevel } from "../../lib/calculations.js";
import { formatMoney } from "../../lib/format.js";

export function WithdrawalCalculator() {
  const { account } = useAccount();
  const [amount, setAmount] = useState(1000);
  const [methodKey, setMethodKey] = useState("bank");

  const method = WITHDRAWAL_METHODS[methodKey];
  const equity = account.balance;
  const currentLevel = marginLevel(equity, account.usedMargin);

  const { fee, finalReceived, maxSafeWithdrawal, newMarginLevel, exceedsSafe } = useMemo(
    () => calculateWithdrawal({ equity, usedMargin: account.usedMargin, amount, method }),
    [equity, account.usedMargin, amount, method]
  );

  return html`
    <div class="calc-card">
      <h2 class="calc-title">
        Withdrawal Calculator
        <${InfoTooltip} title="What is margin level?">
          Margin level is equity divided by used margin. Withdrawing too much can push it from the healthy (green) zone into caution (yellow) or risk (red).
        </${InfoTooltip}>
      </h2>
      <${SliderField} label="Withdrawal Amount" value=${amount} min="0" max=${Math.max(equity, 100)} step="10" onChange=${setAmount} format=${(v) => formatMoney(v, account.currency)} />
      <div class="field">
        <label>Withdrawal Method</label>
        <select value=${methodKey} onChange=${(e) => setMethodKey(e.target.value)}>
          ${Object.entries(WITHDRAWAL_METHODS).map(([key, m]) => html`<option value=${key}>${m.label}</option>`)}
        </select>
      </div>

      <${HealthBar}
        level=${Math.max(0, newMarginLevel)}
        markerLevel=${currentLevel}
        caption=${`After withdrawal, your margin level will be ${Number.isFinite(newMarginLevel) ? newMarginLevel.toFixed(0) + "%" : "∞"}.`}
      />

      ${exceedsSafe && html`<div class="warning-banner">This exceeds the recommended safe withdrawal limit and may push your account into the caution/risk zone.</div>`}

      <div class="result-box">
        <div class="result-main">You can safely withdraw ${formatMoney(maxSafeWithdrawal, account.currency)}.</div>
        <div class="result-sub">Fee: ${formatMoney(fee, account.currency)} (${(method.feePct * 100).toFixed(1)}%) · You'll receive ${formatMoney(finalReceived, account.currency)}</div>
      </div>
      <${FormulaExplainer}
        concept="withdrawable amount"
        explanation="The safe withdrawal limit keeps your margin level at or above 200% after the withdrawal, so open positions stay comfortably away from a margin call."
        formula="Max Safe Withdrawal = Equity − (Used Margin × 2)"
        example=${`${formatMoney(equity, account.currency)} − (${formatMoney(account.usedMargin, account.currency)} × 2) = ${formatMoney(maxSafeWithdrawal, account.currency)}`}
      />
      <${SaveSimulationButton}
        calculator="Withdrawal"
        instrument=${method.label}
        summary=${`Withdraw ${formatMoney(amount, account.currency)} → receive ${formatMoney(finalReceived, account.currency)}`}
        details=${{ "Fee": formatMoney(fee, account.currency), "Margin level after": Number.isFinite(newMarginLevel) ? `${newMarginLevel.toFixed(0)}%` : "∞" }}
      />
    </div>
  `;
}
