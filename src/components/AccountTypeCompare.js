import { html } from "../lib/html.js";
import { ACCOUNT_TYPE_LIST, estimateTradingCost } from "../lib/accountTypes.js";
import { formatMoney } from "../lib/format.js";

// Makes "Standard vs Premier" concrete for a prospective client: same lot
// size, same instrument, what does crossing the spread/paying commission
// actually cost on each tier — rather than leaving them to compare a pips
// number against a dollar number in their head.
export function AccountTypeCompare({ lots, pipValuePerUnitAccount, accountCcy, currentType }) {
  const costs = ACCOUNT_TYPE_LIST.map((t) => ({
    ...t,
    cost: estimateTradingCost({ accountType: t.key, lots, pipValuePerUnitAccount }).totalCost,
  }));
  const cheapest = costs.reduce((a, b) => (b.cost < a.cost ? b : a));

  return html`
    <div class="account-compare">
      <div class="account-compare-title">Standard vs Premier — cost for this trade</div>
      <div class="account-compare-grid">
        ${costs.map(
          (c) => html`
            <div class="account-compare-card ${c.key === currentType ? "current" : ""} ${c.key === cheapest.key ? "cheapest" : ""}">
              <div class="account-compare-label">${c.label}${c.key === currentType ? " (selected)" : ""}</div>
              <div class="account-compare-value">${formatMoney(c.cost, accountCcy)}</div>
              ${c.key === cheapest.key && html`<div class="account-compare-tag">Cheaper for this trade</div>`}
            </div>
          `
        )}
      </div>
      <div class="account-compare-note">
        Round-trip spread + commission cost for ${lots.toFixed(2)} lot(s), based on each tier's published average spread and commission.
      </div>
    </div>
  `;
}
