import { html } from "../lib/html.js";

const COLORS = { low: "var(--green)", medium: "var(--yellow)", high: "var(--red)" };

export function RiskGauge({ marginUtilizationPct, lossPct, level }) {
  return html`
    <div class="risk-gauge">
      <div class="risk-gauge-head">
        <span>Risk Exposure</span>
        <span class="risk-badge risk-${level}">${level.toUpperCase()} RISK</span>
      </div>
      <div class="risk-row">
        <span>Margin used (% of equity)</span>
        <strong>${marginUtilizationPct.toFixed(1)}%</strong>
      </div>
      <div class="risk-track"><div class="risk-fill" style=${{ width: `${Math.min(100, marginUtilizationPct)}%`, background: COLORS[level] }}></div></div>
      <div class="risk-row">
        <span>Potential loss (% of equity)</span>
        <strong>${lossPct.toFixed(1)}%</strong>
      </div>
      <div class="risk-track"><div class="risk-fill" style=${{ width: `${Math.min(100, lossPct)}%`, background: COLORS[level] }}></div></div>
    </div>
  `;
}
