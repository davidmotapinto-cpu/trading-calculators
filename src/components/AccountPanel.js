import { html } from "../lib/html.js";
import { useAccount } from "../context/AccountContext.js";
import { CURRENCIES } from "../lib/fxRates.js";
import { ACCOUNT_TYPE_LIST, ACCOUNT_TYPES } from "../lib/accountTypes.js";
import { formatMoney } from "../lib/format.js";

export function AccountPanel() {
  const { account, updateAccount } = useAccount();
  const selectedType = ACCOUNT_TYPES[account.accountType] || ACCOUNT_TYPES.standard;
  const belowMinDeposit = !account.hasAccount && account.balance < selectedType.minDeposit;

  return html`
    <div class="account-panel">
      <div class="account-panel-title">
        Simulated Account <span class="badge">demo data — wire up to live account API later</span>
      </div>

      <div class="account-mode-toggle">
        <button class=${account.hasAccount ? "active" : ""} onClick=${() => updateAccount({ hasAccount: true })}>I have an account</button>
        <button class=${!account.hasAccount ? "active" : ""} onClick=${() => updateAccount({ hasAccount: false })}>New client — exploring</button>
      </div>

      <div class="account-type-grid">
        ${ACCOUNT_TYPE_LIST.map(
          (t) => html`
            <button
              type="button"
              class="account-type-card ${account.accountType === t.key ? "active" : ""}"
              onClick=${() => updateAccount({ accountType: t.key })}
            >
              <div class="account-type-card-head">
                <span class="account-type-name">${t.label}</span>
                ${account.accountType === t.key && html`<span class="account-type-check">✓</span>`}
              </div>
              <div class="account-type-spec">Min deposit <strong>${formatMoney(t.minDeposit, "USD")}</strong></div>
              <div class="account-type-spec">Spread <strong>${t.avgSpreadPips.toFixed(1)} pips</strong> · Commission <strong>${t.commissionPerLotPerSide > 0 ? `$${t.commissionPerLotPerSide}/lot/side` : "$0"}</strong></div>
              <div class="account-type-tagline">${t.tagline}</div>
            </button>
          `
        )}
      </div>

      <div class="row-4">
        <div class="field">
          <label>${account.hasAccount ? "Balance" : "Planned Deposit"}</label>
          <input type="number" min="0" step="100" value=${account.balance} onChange=${(e) => updateAccount({ balance: parseFloat(e.target.value) || 0 })} />
        </div>
        ${account.hasAccount &&
        html`
          <div class="field">
            <label>Used Margin</label>
            <input type="number" min="0" step="100" value=${account.usedMargin} onChange=${(e) => updateAccount({ usedMargin: parseFloat(e.target.value) || 0 })} />
          </div>
        `}
        <div class="field">
          <label>Leverage</label>
          <select value=${account.leverage} onChange=${(e) => updateAccount({ leverage: parseFloat(e.target.value) })}>
            ${[50, 100, 200, 500].map((l) => html`<option value=${l}>1:${l}</option>`)}
          </select>
        </div>
        <div class="field">
          <label>Currency</label>
          <select value=${account.currency} onChange=${(e) => updateAccount({ currency: e.target.value })}>
            ${CURRENCIES.map((c) => html`<option value=${c}>${c}</option>`)}
          </select>
        </div>
      </div>

      ${belowMinDeposit &&
      html`<div class="field-error">The ${selectedType.label} account needs a minimum deposit of ${formatMoney(selectedType.minDeposit, "USD")} — increase your planned deposit or switch account type.</div>`}
    </div>
  `;
}
