import { useEffect, useState } from "react";
import { html } from "../lib/html.js";

// A price input with no artificial ceiling: the number field accepts any
// realistic value the user types, and the slider underneath pans to follow
// continued dragging instead of clamping the user at a hard edge.
//
// Earlier versions either rescaled the whole window every drag event
// (visually snapping), rescaled only on release (hard stop mid-drag), or grew
// only the approached edge (the window became lopsided over a sustained
// drag — the far side never moved, so the window kept ballooning in one
// direction and most of the track stopped corresponding to useful values).
// This version instead translates a FIXED-WIDTH window — both edges shift by
// the same amount — so the pixel-to-value ratio never changes during a drag.
// That's what makes it feel uniformly precise no matter how far you've
// dragged. `spanPct` is asset-class aware (see priceSpanFor).
function computeWindow(value, step, spanPct) {
  const span = Math.max(value * spanPct, step * 20);
  return { min: Math.max(step, value - span), max: value + span };
}

export function PriceField({ label, value, step, decimals, onChange, error, spanPct = 0.08 }) {
  const [windowRange, setWindowRange] = useState(() => computeWindow(value, step, spanPct));
  const [draft, setDraft] = useState(value.toFixed(decimals));

  useEffect(() => {
    setDraft(value.toFixed(decimals));
    if (value < windowRange.min || value > windowRange.max) {
      setWindowRange(computeWindow(value, step, spanPct));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, spanPct]);

  function commitNumber(raw) {
    const v = parseFloat(raw);
    if (Number.isFinite(v) && v > 0) {
      onChange(v);
    }
  }

  function handleSliderInput(e) {
    const v = parseFloat(e.target.value);
    onChange(v);
    setWindowRange((prev) => {
      const range = prev.max - prev.min;
      const edgeZone = range * 0.15;
      const pan = range * 0.06;
      if (prev.max - v < edgeZone) {
        return { min: prev.min + pan, max: prev.max + pan };
      }
      if (v - prev.min < edgeZone && prev.min > step) {
        const shift = Math.min(pan, prev.min - step);
        return { min: prev.min - shift, max: prev.max - shift };
      }
      return prev;
    });
  }

  return html`
    <div class="field price-field">
      <div class="price-field-head">
        <label>${label}</label>
        <input
          type="number"
          class="price-number-input ${error ? "invalid" : ""}"
          value=${draft}
          step=${step}
          onChange=${(e) => setDraft(e.target.value)}
          onBlur=${(e) => commitNumber(e.target.value)}
          onKeyDown=${(e) => {
            if (e.key === "Enter") commitNumber(e.target.value);
          }}
        />
      </div>
      <input
        type="range"
        min=${windowRange.min}
        max=${windowRange.max}
        step=${step}
        value=${value}
        onInput=${handleSliderInput}
      />
      <div class="price-field-range">
        <span>${windowRange.min.toFixed(decimals)}</span>
        <span>${windowRange.max.toFixed(decimals)}</span>
      </div>
      ${error && html`<div class="field-error">${error}</div>`}
    </div>
  `;
}
