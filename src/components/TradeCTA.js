import { html } from "../lib/html.js";

// There is no real Equiti URL to deep-link to from this prototype, so rather
// than ship a fake href="#" link that looks clickable but goes nowhere, this
// renders as a clearly-disabled button with an explanatory caption. Swap
// `disabled` for a real `href`/`onClick` once this is wired into the portal
// (e.g. a deep link to the trading platform or account-opening flow).
export function TradeCTA({ label = "Go to Trading Platform" }) {
  return html`
    <div class="trade-cta-wrap">
      <button type="button" class="trade-cta" disabled>
        ${label}
        <span class="trade-cta-arrow">→</span>
      </button>
      <div class="trade-cta-caption">Connects to the Equiti trading platform once integrated</div>
    </div>
  `;
}
