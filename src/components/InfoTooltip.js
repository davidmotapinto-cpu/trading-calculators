import { useState } from "react";
import { html } from "../lib/html.js";

export function InfoTooltip({ title, children }) {
  const [open, setOpen] = useState(false);
  return html`
    <span class="info-tooltip">
      <button type="button" class="info-icon" onClick=${() => setOpen((o) => !o)} aria-label="More info">?</button>
      ${open &&
      html`
        <div class="info-popover">
          <strong>${title}</strong>
          <p>${children}</p>
        </div>
      `}
    </span>
  `;
}
