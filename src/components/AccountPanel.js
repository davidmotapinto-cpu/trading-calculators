import { html } from "../lib/html.js";
import { useAccount } from "../context/AccountContext.js";
import { CURRENCIES } from "../lib/fxRates.js";

export function AccountPanel() {
  const { account, updateAccount } = useAccount();

  return html`
    <div class="account-panel">
      <div class="account-panel-title">
        Simulated Account <span class="badge">demo data — wire up to live account API later</span>
      </div>
      <div class="row-4">
        <div class="field">
          <label>Balance</label>
          <input type="number" min="0" step="100" value=${account.balance} onChange=${(e) => updateAccount({ balance: parseFloat(e.target.value) || 0 })} />
        </div>
        <div class="field">
          <label>Used Margin</label>
          <input type="number" min="0" step="100" value=${account.usedMargin} onChange=${(e) => updateAccount({ usedMargin: parseFloat(e.target.value) || 0 })} />
        </div>
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
    </div>
  `;
}
