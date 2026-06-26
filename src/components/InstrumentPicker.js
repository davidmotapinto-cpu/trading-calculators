import { html } from "../lib/html.js";
import { INSTRUMENTS_BY_CATEGORY } from "../lib/instruments.js";

export function InstrumentPicker({ value, onChange }) {
  return html`
    <div class="field">
      <label>Instrument</label>
      <select value=${value} onChange=${(e) => onChange(e.target.value)}>
        ${Object.entries(INSTRUMENTS_BY_CATEGORY).map(
          ([category, list]) => html`
            <optgroup label=${category}>
              ${list.map((i) => html`<option value=${i.symbol}>${i.label}</option>`)}
            </optgroup>
          `
        )}
      </select>
    </div>
  `;
}
