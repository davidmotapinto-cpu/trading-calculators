import { useState } from "react";
import { html } from "../lib/html.js";

// Education/transparency block, collapsed by default to keep the calculator
// clean: explains the concept in plain English, shows the actual formula,
// then shows that formula applied to the user's current live inputs.
export function FormulaExplainer({ concept, explanation, formula, example }) {
  const [open, setOpen] = useState(false);

  return html`
    <div class="formula-explainer">
      <button type="button" class="formula-toggle" onClick=${() => setOpen((o) => !o)} aria-expanded=${open}>
        <span class="formula-toggle-caret">${open ? "▾" : "▸"}</span>
        How is this calculated?
      </button>
      ${open &&
      html`
        <div class="formula-body">
          <div class="formula-section">
            <div class="formula-section-label">What is ${concept}?</div>
            <p class="formula-text">${explanation}</p>
          </div>
          <div class="formula-section">
            <div class="formula-section-label">Formula</div>
            <code class="formula-expression">${formula}</code>
          </div>
          <div class="formula-section">
            <div class="formula-section-label">Applied to your inputs</div>
            <code class="formula-expression formula-applied">${example}</code>
          </div>
        </div>
      `}
    </div>
  `;
}
