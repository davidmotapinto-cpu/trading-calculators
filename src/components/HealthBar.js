import { html } from "../lib/html.js";
import { marginLevelZone } from "../lib/calculations.js";

export function HealthBar({ level, markerLevel, caption }) {
  const zone = marginLevelZone(level);
  const pct = Math.max(0, Math.min(100, (level / 500) * 100));
  const markerPct = markerLevel != null ? Math.max(0, Math.min(100, (markerLevel / 500) * 100)) : null;
  return html`
    <div class="health-bar">
      <div class="health-label">Account Health After Withdrawal</div>
      <div class="health-bar-track">
        <div class="health-bar-fill" style=${{ width: `${pct}%`, background: zone.color }}></div>
        ${markerPct != null && html`<div class="health-marker" style=${{ left: `${markerPct}%` }}></div>`}
      </div>
      <div class="health-caption">
        ${caption || `Margin level: ${Number.isFinite(level) ? level.toFixed(0) + "%" : "∞"} — ${zone.label}`}
      </div>
    </div>
  `;
}
