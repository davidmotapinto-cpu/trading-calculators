import { useRef, useState } from "react";
import { html } from "../lib/html.js";
import { calculateProfit } from "../lib/calculations.js";
import { smoothPath, splitZones, areaPath } from "../lib/chartMath.js";
import { formatMoney, formatCompactMoney } from "../lib/format.js";

const WIDTH = 600;
const HEIGHT = 260;
const PAD = { top: 22, right: 54, bottom: 30, left: 58 };

export function ProfitChart({
  instrument,
  direction,
  lots,
  openPrice,
  currentPrice,
  accountCcy,
  rates,
  rangePct = 0.04,
  decimals = 5,
  fees = 0,
  swapTotal = 0,
  marginCallPrice = null,
  marginCallDistancePct = null,
  onReset = null,
}) {
  const svgRef = useRef(null);
  const [hoverX, setHoverX] = useState(null);
  const [zoom, setZoom] = useState(1); // 1 = default; reset via the button below

  if (openPrice == null) {
    return html`<div class="chart-empty">Set an open price to preview the profit curve.</div>`;
  }

  const plotW = WIDTH - PAD.left - PAD.right;
  const plotH = HEIGHT - PAD.top - PAD.bottom;
  const profitAt = (price) => calculateProfit({ instrument: { ...instrument, price }, direction, lots, openPrice, closePrice: price, accountCcy, rates, fees, swapTotal }).netAccount;

  // The window must always include both the open and close price — otherwise
  // moving the close price outside a fixed window makes the chart look like
  // it ignores that input entirely (it was just clipped off-screen).
  const anchorLo = Math.min(openPrice, currentPrice ?? openPrice);
  const anchorHi = Math.max(openPrice, currentPrice ?? openPrice);
  // Zoom must scale whichever pad term ends up dominant — applying it only to
  // the rangePct term (as a previous version did) meant zoom silently did
  // nothing once open/close diverged enough for the anchor-spread term to win.
  const basePad = Math.max(openPrice * rangePct, (anchorHi - anchorLo) * 0.6, instrument.tickSize * 10);
  const pad = basePad * zoom;
  const minPrice = anchorLo - pad;
  const maxPrice = anchorHi + pad;

  const samplesN = 90;
  const raw = Array.from({ length: samplesN + 1 }, (_, i) => {
    const price = minPrice + (maxPrice - minPrice) * (i / samplesN);
    return { price, profit: profitAt(price) };
  });

  const maxAbs = Math.max(1, ...raw.map((s) => Math.abs(s.profit)));
  const xFor = (price) => PAD.left + ((price - minPrice) / (maxPrice - minPrice)) * plotW;
  const yFor = (profit) => PAD.top + plotH / 2 - (profit / maxAbs) * (plotH / 2 - 6);
  const baselineY = yFor(0);

  const points = raw.map((s) => ({ x: xFor(s.price), y: yFor(s.profit), value: s.profit, price: s.price }));
  const zones = splitZones(points);
  const linePath = smoothPath(points);
  const breakevenX = xFor(openPrice);

  const currentProfit = currentPrice != null ? profitAt(currentPrice) : null;
  const currentX = currentPrice != null ? xFor(currentPrice) : null;
  const currentY = currentPrice != null ? yFor(currentProfit) : null;

  const marginCallInView = marginCallPrice != null && marginCallPrice >= minPrice && marginCallPrice <= maxPrice;
  const marginCallX = marginCallInView ? xFor(marginCallPrice) : null;

  let hoverPoint = null;
  if (hoverX != null) {
    const clampedX = Math.max(PAD.left, Math.min(WIDTH - PAD.right, hoverX));
    const price = minPrice + ((clampedX - PAD.left) / plotW) * (maxPrice - minPrice);
    const netAccount = profitAt(price);
    hoverPoint = { x: xFor(price), y: yFor(netAccount), price, profit: netAccount };
  }

  function handleMove(e) {
    const rect = svgRef.current.getBoundingClientRect();
    const scaleX = WIDTH / rect.width;
    setHoverX((e.clientX - rect.left) * scaleX);
  }

  const gridY = [maxAbs / 2, -maxAbs / 2];
  const gridX = [0.25, 0.5, 0.75].map((f) => PAD.left + plotW * f);
  const breakevenLabel = `Break-even ${openPrice.toFixed(decimals)}`;
  const breakevenLabelW = breakevenLabel.length * 5.4 + 14;
  const breakevenLabelX = Math.min(Math.max(breakevenX - breakevenLabelW / 2, PAD.left), WIDTH - PAD.right - breakevenLabelW);

  return html`
    <div class="profit-chart-wrap">
      <div class="chart-label-row">
        <div class="chart-label">Profit vs. Price Movement</div>
        <div class="chart-zoom-controls">
          <button type="button" onClick=${() => setZoom((z) => Math.max(0.4, z * 0.8))} aria-label="Zoom in">+</button>
          <button type="button" onClick=${() => { setZoom(1); onReset && onReset(); }} aria-label="Reset view">Reset</button>
          <button type="button" onClick=${() => setZoom((z) => Math.min(3, z * 1.25))} aria-label="Zoom out">−</button>
        </div>
      </div>
      <svg
        ref=${svgRef}
        class="profit-chart"
        viewBox="0 0 ${WIDTH} ${HEIGHT}"
        preserveAspectRatio="none"
        onMouseMove=${handleMove}
        onMouseLeave=${() => setHoverX(null)}
      >
        <defs>
          <linearGradient id="zoneGreen" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--profit)" stopOpacity="0.30" />
            <stop offset="100%" stopColor="var(--profit)" stopOpacity="0.02" />
          </linearGradient>
          <linearGradient id="zoneRed" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="var(--loss)" stopOpacity="0.30" />
            <stop offset="100%" stopColor="var(--loss)" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        ${gridY.map((g, i) => html`<line key=${`gy${i}`} x1=${PAD.left} y1=${yFor(g)} x2=${WIDTH - PAD.right} y2=${yFor(g)} class="chart-grid-line" />`)}
        ${gridX.map((gx, i) => html`<line key=${`gx${i}`} x1=${gx} y1=${PAD.top} x2=${gx} y2=${HEIGHT - PAD.bottom} class="chart-grid-line" />`)}
        <line x1=${PAD.left} y1=${PAD.top} x2=${PAD.left} y2=${HEIGHT - PAD.bottom} class="chart-axis-line" />
        <line x1=${PAD.left} y1=${baselineY} x2=${WIDTH - PAD.right} y2=${baselineY} class="chart-zero-line" />
        <line x1=${breakevenX} y1=${PAD.top} x2=${breakevenX} y2=${HEIGHT - PAD.bottom} class="chart-breakeven-line" />

        ${zones.map((z, i) => html`<path key=${i} d=${areaPath(z.points, baselineY)} fill=${z.sign >= 0 ? "url(#zoneGreen)" : "url(#zoneRed)"} stroke="none" />`)}

        <path d=${linePath} class="chart-line" fill="none" />

        ${marginCallX != null &&
        html`
          <g>
            <rect
              x=${marginCallPrice > openPrice ? marginCallX : PAD.left}
              y=${PAD.top}
              width=${marginCallPrice > openPrice ? WIDTH - PAD.right - marginCallX : marginCallX - PAD.left}
              height=${plotH}
              class="chart-margin-call-zone"
            />
            <line x1=${marginCallX} y1=${PAD.top} x2=${marginCallX} y2=${HEIGHT - PAD.bottom} class="chart-margin-call-line" />
            <text x=${marginCallX} y=${HEIGHT - PAD.bottom + 13} class="chart-axis-label margin-call" textAnchor="middle">Margin call</text>
          </g>
        `}

        ${currentX != null &&
        html`
          <g>
            <line x1=${currentX} y1=${PAD.top} x2=${currentX} y2=${HEIGHT - PAD.bottom} class="chart-current-line" />
            <circle cx=${currentX} cy=${currentY} r="4.5" class="chart-marker ${currentProfit >= 0 ? "positive" : "negative"}" />
          </g>
        `}

        ${hoverPoint &&
        html`
          <g>
            <line x1=${hoverPoint.x} y1=${PAD.top} x2=${hoverPoint.x} y2=${HEIGHT - PAD.bottom} class="chart-hover-line" />
            <circle cx=${hoverPoint.x} cy=${hoverPoint.y} r="5" class="chart-marker ${hoverPoint.profit >= 0 ? "positive" : "negative"}" />
          </g>
        `}

        <text x=${PAD.left - 10} y=${yFor(maxAbs) + 4} class="chart-axis-label" textAnchor="end">${formatCompactMoney(maxAbs, accountCcy)}</text>
        <text x=${PAD.left - 10} y=${yFor(gridY[0]) + 4} class="chart-axis-label" textAnchor="end">${formatCompactMoney(gridY[0], accountCcy)}</text>
        <text x=${PAD.left - 10} y=${baselineY + 4} class="chart-axis-label" textAnchor="end">0</text>
        <text x=${PAD.left - 10} y=${yFor(gridY[1]) + 4} class="chart-axis-label" textAnchor="end">−${formatCompactMoney(maxAbs / 2, accountCcy)}</text>
        <text x=${PAD.left - 10} y=${yFor(-maxAbs) + 4} class="chart-axis-label" textAnchor="end">−${formatCompactMoney(maxAbs, accountCcy)}</text>

        <text x=${PAD.left} y=${HEIGHT - 9} class="chart-axis-label">${minPrice.toFixed(decimals)}</text>
        <text x=${WIDTH - PAD.right} y=${HEIGHT - 9} class="chart-axis-label" textAnchor="end">${maxPrice.toFixed(decimals)}</text>

        <rect x=${breakevenLabelX} y=${PAD.top - 14} width=${breakevenLabelW} height="16" rx="4" class="chart-breakeven-pill" />
        <text x=${breakevenLabelX + breakevenLabelW / 2} y=${PAD.top - 3} class="chart-axis-label breakeven" textAnchor="middle">${breakevenLabel}</text>

        ${currentY != null &&
        html`
          <g>
            <rect x=${WIDTH - PAD.right + 4} y=${currentY - 9} width="48" height="18" rx="4" class="chart-current-tag ${currentProfit >= 0 ? "positive" : "negative"}" />
            <text x=${WIDTH - PAD.right + 28} y=${currentY + 4} class="chart-current-tag-label" textAnchor="middle">${currentProfit >= 0 ? "+" : ""}${formatCompactMoney(currentProfit, accountCcy)}</text>
          </g>
        `}
      </svg>

      ${marginCallPrice != null && !marginCallInView &&
      html`
        <div class="chart-margin-call-caption">
          ⚠ Estimated margin call ~${marginCallDistancePct?.toFixed(1)}% away — outside the zoom shown
        </div>
      `}

      ${hoverPoint &&
      html`
        <div class="chart-tooltip">
          <span>Price ${hoverPoint.price.toFixed(decimals)}</span>
          <strong class=${hoverPoint.profit >= 0 ? "positive" : "negative"}>${hoverPoint.profit >= 0 ? "+" : ""}${formatMoney(hoverPoint.profit, accountCcy)}</strong>
        </div>
      `}
    </div>
  `;
}
