import { useEffect, useState } from "react";
import { html } from "../lib/html.js";

// Paired with a small editable number box so fine-grained values (e.g. 1.35
// lots, 1:240 leverage) don't depend on pixel-perfect dragging across a wide
// range — type it directly, or drag for quick adjustments.
export function SliderField({ label, value, min, max, step, onChange, format }) {
  const [draft, setDraft] = useState(String(value));

  useEffect(() => {
    setDraft(String(value));
  }, [value]);

  function commit(raw) {
    const v = parseFloat(raw);
    if (Number.isFinite(v)) {
      onChange(Math.min(max, Math.max(min, v)));
    }
  }

  return html`
    <div class="field slider-field">
      <div class="slider-field-head">
        <label>${label}</label>
        <input
          type="number"
          class="slider-number-input"
          value=${draft}
          min=${min}
          max=${max}
          step=${step}
          onChange=${(e) => setDraft(e.target.value)}
          onBlur=${(e) => commit(e.target.value)}
          onKeyDown=${(e) => {
            if (e.key === "Enter") commit(e.target.value);
          }}
        />
      </div>
      <input
        type="range"
        min=${min}
        max=${max}
        step=${step}
        value=${value}
        onInput=${(e) => onChange(parseFloat(e.target.value))}
      />
      ${format && html`<div class="slider-field-caption">${format(value)}</div>`}
    </div>
  `;
}
