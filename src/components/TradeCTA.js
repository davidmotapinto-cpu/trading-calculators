import { html } from "../lib/html.js";

// Links to Equiti's real, verified account-types/"Apply Now" page — fetched
// and confirmed directly during this project (it's also where the Standard
// /Premier account figures used elsewhere in this app came from). Opens in
// a new tab so clicking it doesn't lose the trade setup someone's mid-way
// through modeling here.
const ACCOUNT_URL = "https://www.equiti.com/uae-en/accounts/";

export function TradeCTA({ label = "Open an Account" }) {
  return html`
    <a class="trade-cta" href=${ACCOUNT_URL} target="_blank" rel="noopener noreferrer">
      ${label}
      <span class="trade-cta-arrow">→</span>
    </a>
  `;
}
