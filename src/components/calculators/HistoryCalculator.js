import { html } from "../../lib/html.js";
import { useHistory } from "../../hooks/useHistory.js";
import { deleteSimulation, clearHistory } from "../../lib/historyStore.js";

function formatTimestamp(ts) {
  return new Date(ts).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function HistoryCalculator() {
  const entries = useHistory();

  return html`
    <div class="calc-card">
      <div class="history-head">
        <h2 class="calc-title">Saved Simulations</h2>
        ${entries.length > 0 && html`<button type="button" class="history-clear" onClick=${() => clearHistory()}>Clear all</button>`}
      </div>
      <p class="calc-subtitle">Snapshots you've saved from any calculator below, kept in this browser so you can come back to them. Nothing here leaves your device.</p>

      ${entries.length === 0
        ? html`<div class="history-empty">No saved simulations yet. Use the "Save this simulation" button on any calculator to bookmark a scenario here.</div>`
        : html`
            <div class="history-list">
              ${entries.map(
                (e) => html`
                  <div class="history-item" key=${e.id}>
                    <div class="history-item-head">
                      <span class="history-badge">${e.calculator}</span>
                      <span class="history-instrument">${e.instrument}</span>
                      <span class="history-time">${formatTimestamp(e.timestamp)}</span>
                      <button type="button" class="history-delete" onClick=${() => deleteSimulation(e.id)} aria-label="Delete">×</button>
                    </div>
                    <div class="history-summary">${e.summary}</div>
                    ${e.details &&
                    html`
                      <div class="history-details">
                        ${Object.entries(e.details).map(([k, v]) => html`<span key=${k}><strong>${k}:</strong> ${v}</span>`)}
                      </div>
                    `}
                  </div>
                `
              )}
            </div>
          `}
    </div>
  `;
}
