import { useState } from "react";
import { html } from "../lib/html.js";
import { saveSimulation } from "../lib/historyStore.js";

// Saving is explicit (a button), not automatic on every keystroke — "all the
// simulations I do" reads as "let me bookmark scenarios to come back to,"
// not a noisy log of every slider tick.
export function SaveSimulationButton({ calculator, instrument, summary, details }) {
  const [saved, setSaved] = useState(false);

  function handleSave() {
    saveSimulation({ calculator, instrument, summary, details });
    setSaved(true);
    setTimeout(() => setSaved(false), 1600);
  }

  return html`
    <button type="button" class="save-sim-button ${saved ? "saved" : ""}" onClick=${handleSave}>
      ${saved ? "✓ Saved to History" : "Save this simulation"}
    </button>
  `;
}
