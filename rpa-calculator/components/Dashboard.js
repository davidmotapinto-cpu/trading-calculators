import { html } from "../lib/html.js";
import { fmtUSD } from "../lib/format.js";

const ALL_TIERS = [
  { name: "Entry",        min: 1,  max: 10,       multiplier: 1.00, color: "#C3CEDA" },
  { name: "Growth",       min: 11, max: 25,        multiplier: 1.15, color: "#7DA6FF" },
  { name: "Professional", min: 26, max: 50,        multiplier: 1.30, color: "#C4A8FF" },
  { name: "Elite",        min: 51, max: Infinity,  multiplier: 1.50, color: "#F0C355" },
];

const TIER_CSS = {
  Entry: "tier-entry", Growth: "tier-growth",
  Professional: "tier-professional", Elite: "tier-elite",
};

const TEAL = "#14C9B4";
const BLUE = "#2F6FED";

function fmtVol(v) {
  if (v >= 1e9) return "$" + (v / 1e9).toFixed(2) + "B";
  if (v >= 1e6) return "$" + (v / 1e6).toFixed(1) + "M";
  if (v >= 1e3) return "$" + (v / 1e3).toFixed(0) + "K";
  return "$" + Math.round(v);
}

// ── Donut chart ──────────────────────────────────────────────────────────────
function DonutChart({ breakdown, finalReward, tier }) {
  const cx = 90, cy = 90, r = 70, sw = 23;
  const circ = 2 * Math.PI * r;
  const GAP = 2;
  const active = breakdown.filter(b => b.reward > 0);
  const totalBase = active.reduce((s, b) => s + b.reward, 0);

  let cum = 0;
  const segs = active.map(b => {
    const frac = totalBase > 0 ? b.reward / totalBase : 0;
    const full  = frac * circ;
    const dash  = active.length > 1 ? Math.max(0, full - GAP) : full;
    const seg   = { ...b, dash, offset: cum };
    cum += full;
    return seg;
  });

  return html`
    <div style=${{ display: "flex", flexDirection: "column", height: "100%", justifyContent: "center", gap: "16px" }}>
      <svg viewBox="0 0 180 180" style=${{ width: "180px", height: "180px", margin: "0 auto", display: "block" }}>
        <circle cx=${cx} cy=${cy} r=${r} fill="none"
          stroke="rgba(255,255,255,0.06)" strokeWidth=${sw} />
        ${segs.map((seg, i) => html`
          <circle key=${i} cx=${cx} cy=${cy} r=${r}
            fill="none" stroke=${seg.color} strokeWidth=${sw}
            strokeDasharray=${seg.dash + " " + circ}
            strokeDashoffset=${-seg.offset}
            transform=${"rotate(-90 " + cx + " " + cy + ")"}
            style=${{ transition: "stroke-dasharray 0.4s ease" }}
          />
        `)}
        <text x=${cx} y=${cy - 9} textAnchor="middle"
          fill="#FFFFFF" fontSize="16" fontWeight="800"
          fontFamily='"JetBrains Mono", monospace'>
          ${fmtUSD(finalReward)}
        </text>
        <text x=${cx} y=${cy + 12} textAnchor="middle" fill="#7C93AB" fontSize="11">
          /month
        </text>
      </svg>

      <div style=${{ display: "flex", flexDirection: "column", gap: "9px" }}>
        ${active.length === 0
          ? html`<span style=${{ fontSize: "12px", color: "#7C93AB" }}>Add instruments to see breakdown</span>`
          : active.map((b, i) => {
              const earnPct = Math.round(b.reward / totalBase * 100);
              return html`
                <div key=${i} style=${{ display: "flex", alignItems: "center", gap: "9px" }}>
                  <div style=${{ width: "9px", height: "9px", borderRadius: "3px", background: b.color, flexShrink: 0 }}></div>
                  <span style=${{ fontSize: "12px", color: "#C7D4E3", flex: "1" }}>${b.label}</span>
                  <span style=${{ fontSize: "10px", color: "#7C93AB", fontFamily: '"JetBrains Mono", monospace' }}>${b.lots}L</span>
                  <span style=${{ fontSize: "10px", color: "#9BB0C6", minWidth: "30px", textAlign: "right" }}>${earnPct}%</span>
                  <span style=${{ fontFamily: '"JetBrains Mono", monospace', fontSize: "13px", fontWeight: "700", color: b.color, minWidth: "76px", textAlign: "right" }}>${fmtUSD(b.reward * tier.multiplier)}</span>
                </div>
              `;
            })
        }
      </div>
    </div>
  `;
}

// ── Growth curve ─────────────────────────────────────────────────────────────
function GrowthCurve({ points, currentClients }) {
  if (!points || points.length === 0) return null;

  const W = 100, H = 46;
  // Normalized 0-100 coordinate space so the SVG can safely stretch to fill
  // whatever box the flex layout gives it (preserveAspectRatio="none") without
  // ever letterboxing. Only strokes live inside that stretched space (protected
  // via vector-effect); the dot marker, value label, and axis text are plain
  // HTML positioned by the same percentages, so they never get squashed into
  // ellipses/stretched glyphs the way SVG circles/text would under a non-uniform
  // scale.
  const pL = 9, pR = 2, pT = 10, pB = 16;
  const iW = 100 - pL - pR, iH = 100 - pT - pB;
  const n = points.length;
  const maxVal = Math.max(...points, 1);
  const axisMax = maxVal * 1.15;

  function xOf(i) { return pL + (i / (n - 1)) * iW; }
  function yOf(v) { return pT + iH - (v / axisMax) * iH; }

  const linePts  = points.map((v, i) => xOf(i) + "," + yOf(v)).join(" L ");
  const linePath = "M " + linePts;
  const areaPath = linePath + " L " + xOf(n - 1) + ",100 L " + xOf(0) + ",100 Z";

  const curIdx = Math.min(currentClients - 1, n - 1);
  const curX   = xOf(curIdx);
  const curY   = yOf(points[curIdx] || 0);
  const curVal = points[curIdx] || 0;

  const tierLines = [
    { idx: 9.5,  color: "#7DA6FF", label: "Growth" },
    { idx: 24.5, color: "#C4A8FF", label: "Pro"     },
    { idx: 49.5, color: "#F0C355", label: "Elite"   },
  ];

  const yTicks = [0.33, 0.66, 1.0].map(f => ({
    y: yOf(axisMax * f),
    t: axisMax * f >= 1_000_000 ? "$" + (axisMax * f / 1_000_000).toFixed(1) + "M"
      : axisMax * f >= 1000 ? "$" + (axisMax * f / 1000).toFixed(0) + "K"
      : "$" + Math.round(axisMax * f),
  }));

  const labelRight = curX > pL + iW * 0.62;

  return html`
    <div style=${{ position: "relative", width: "100%", height: "100%" }}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" style=${{ position: "absolute", inset: "0", width: "100%", height: "100%", display: "block" }}>
        <defs>
          <linearGradient id="gcurve" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor=${TEAL} stopOpacity="0.30" />
            <stop offset="100%" stopColor=${TEAL} stopOpacity="0" />
          </linearGradient>
          <linearGradient id="gline" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor=${TEAL} />
            <stop offset="100%" stopColor=${BLUE} />
          </linearGradient>
          <clipPath id="gcl">
            <rect x=${pL} y="0" width=${iW} height="100" />
          </clipPath>
        </defs>

        ${yTicks.map((t, i) => html`
          <line key=${i} x1=${pL} y1=${t.y} x2=${100 - pR} y2=${t.y}
            stroke="rgba(255,255,255,0.08)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
        `)}

        ${tierLines.map((b, i) => html`
          <line key=${i} x1=${xOf(b.idx)} y1=${pT} x2=${xOf(b.idx)} y2=${pT + iH}
            stroke=${b.color} strokeWidth="1" strokeDasharray="2 3" opacity="0.5" vectorEffect="non-scaling-stroke" />
        `)}

        <path d=${areaPath} fill="url(#gcurve)" clipPath="url(#gcl)" />
        <path d=${linePath} fill="none" stroke="url(#gline)" strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round" clipPath="url(#gcl)" vectorEffect="non-scaling-stroke" />

        <line x1=${pL} y1=${pT + iH} x2=${100 - pR} y2=${pT + iH}
          stroke="rgba(255,255,255,0.12)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
        <line x1=${curX} y1=${pT} x2=${curX} y2=${pT + iH}
          stroke="rgba(20,201,180,0.4)" strokeWidth="1" strokeDasharray="2 2" vectorEffect="non-scaling-stroke" />
      </svg>

      ${tierLines.map((b, i) => html`
        <span key=${i} style=${{ position: "absolute", left: xOf(b.idx) + "%", top: (pT - 2) + "%", transform: "translate(4px, 0)", fontSize: "9px", fontWeight: "600", color: b.color, opacity: "0.9" }}>${b.label}</span>
      `)}

      ${yTicks.map((t, i) => html`
        <span key=${i} style=${{ position: "absolute", left: "0", top: t.y + "%", transform: "translateY(-50%)", width: (pL - 1) + "%", textAlign: "right", fontSize: "9px", color: "#7C93AB", fontFamily: '"JetBrains Mono", monospace' }}>${t.t}</span>
      `)}

      <span style=${{ position: "absolute", left: pL + "%", bottom: "0", fontSize: "9px", color: "#7C93AB" }}>1</span>
      <span style=${{ position: "absolute", right: pR + "%", bottom: "0", fontSize: "9px", color: "#7C93AB" }}>${n} clients</span>

      <div style=${{ position: "absolute", left: curX + "%", top: curY + "%", width: "9px", height: "9px", borderRadius: "50%", background: "rgba(20,201,180,0.18)", transform: "translate(-50%,-50%)" }}></div>
      <div style=${{ position: "absolute", left: curX + "%", top: curY + "%", width: "5px", height: "5px", borderRadius: "50%", background: TEAL, transform: "translate(-50%,-50%)", boxShadow: "0 0 6px " + TEAL }}></div>
      <div style=${{
        position: "absolute", left: curX + "%", top: curY + "%",
        transform: (labelRight ? "translate(-100%,-135%)" : "translate(0,-135%)"),
        fontFamily: '"JetBrains Mono", monospace', fontSize: "11px", fontWeight: "700", color: TEAL, whiteSpace: "nowrap",
      }}>${fmtUSD(curVal)}</div>
    </div>
  `;
}

// ── Main Dashboard ───────────────────────────────────────────────────────────
export function Dashboard({ result, clients }) {
  const {
    finalReward, perClient, totalLots, totalDolVol,
    breakdown, tier, nextTier,
    earningsAtNext, growthPoints,
  } = result;

  const tierCss       = TIER_CSS[tier.name] || "tier-entry";
  const clientsToNext = nextTier ? nextTier.min - clients : 0;
  const tierProgress  = tier.max === Infinity ? 1
    : (clients - tier.min) / (tier.max - tier.min + 1);
  const progressPct   = (Math.max(0, Math.min(1, tierProgress)) * 100).toFixed(1) + "%";

  const bigNum = finalReward >= 1_000_000
    ? "$" + (finalReward / 1_000_000).toFixed(2) + "M"
    : "$" + Math.round(finalReward).toLocaleString();

  return html`
    <main style=${{ flex: "1", overflowY: "auto", padding: "22px 28px", display: "flex", flexDirection: "column", gap: "16px" }}>

      <!-- ── HERO ── -->
      <div class="card-glow" style=${{ padding: "26px 30px" }}>
        <div class="lbl" style=${{ marginBottom: "9px", letterSpacing: "0.16em" }}>ESTIMATED MONTHLY EARNINGS</div>

        <div style=${{ display: "flex", flexWrap: "wrap", gap: "12px", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div class="earnings-num">${bigNum}</div>
            <div style=${{ fontSize: "11px", color: "#9BB0C6", marginTop: "7px", fontFamily: '"JetBrains Mono", monospace' }}>per month · 30-day rolling window</div>
          </div>
          <div style=${{ textAlign: "right", paddingTop: "4px" }}>
            <span class=${"tier-badge " + tierCss}>${tier.name.toUpperCase()}</span>
            <div style=${{ fontFamily: '"JetBrains Mono", monospace', fontSize: "18px", fontWeight: "700", color: tier.color, marginTop: "8px", letterSpacing: "-0.3px" }}>
              ×${tier.multiplier.toFixed(2)} tier boost
            </div>
          </div>
        </div>

        <div style=${{ display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "18px" }}>
          <div class="metric-pill" style=${{ minWidth: "120px" }}>
            <div class="lbl" style=${{ marginBottom: "5px" }}>Per Client</div>
            <div style=${{ fontFamily: '"JetBrains Mono", monospace', fontSize: "18px", fontWeight: "700", color: "#FFFFFF" }}>${fmtUSD(perClient)}</div>
          </div>
          <div class="metric-pill" style=${{ minWidth: "120px" }}>
            <div class="lbl" style=${{ marginBottom: "5px" }}>Total Lots Traded</div>
            <div style=${{ fontFamily: '"JetBrains Mono", monospace', fontSize: "18px", fontWeight: "700", color: "#FFFFFF" }}>${totalLots.toLocaleString()}</div>
          </div>
          <div class="metric-pill" style=${{ minWidth: "120px" }}>
            <div class="lbl" style=${{ marginBottom: "5px" }}>Total Volume</div>
            <div style=${{ fontFamily: '"JetBrains Mono", monospace', fontSize: "18px", fontWeight: "700", color: "#FFFFFF" }}>${fmtVol(totalDolVol)}</div>
          </div>
        </div>

        <div style=${{ fontSize: "10px", color: "#5E7A93", marginTop: "14px", lineHeight: "1.5" }}>
          Estimate based on historical account performance — not a guarantee of future payouts. Actual RPA rewards depend on final reconciled trading activity.
        </div>
      </div>

      <!-- ── Tier Progress ── -->
      <div class="card" style=${{ padding: "16px 20px" }}>
        <div class="lbl" style=${{ marginBottom: "12px" }}>PARTNER TIER PROGRESS</div>
        <div style=${{ display: "flex", alignItems: "center", marginBottom: "10px" }}>
          ${ALL_TIERS.map((t, i) => {
            const tIdx = ALL_TIERS.findIndex(x => x.name === tier.name);
            const isActive = t.name === tier.name;
            const isPast   = i < tIdx;
            const col      = (isActive || isPast) ? t.color : "rgba(255,255,255,0.10)";
            return html`
              <div key=${t.name} style=${{ display: "flex", alignItems: "center", flex: i < 3 ? "1" : "none" }}>
                <div style=${{ display: "flex", flexDirection: "column", alignItems: "center", gap: "5px" }}>
                  <span style=${{ fontSize: "10px", fontWeight: isActive ? "700" : "500", color: isActive ? t.color : isPast ? t.color : "#5E7A93", letterSpacing: "0.03em" }}>${t.name}</span>
                  <div style=${{ width: "10px", height: "10px", borderRadius: "50%", background: col, boxShadow: isActive ? "0 0 12px " + t.color + "90" : "none", transition: "all 0.3s" }}></div>
                  <span style=${{ fontSize: "10px", color: isActive ? t.color : "#5E7A93", fontFamily: '"JetBrains Mono", monospace' }}>×${t.multiplier.toFixed(2)}</span>
                </div>
                ${i < 3 ? html`<div style=${{ flex: "1", height: "2px", background: isPast ? t.color : "rgba(255,255,255,0.08)", margin: "0 6px", borderRadius: "2px" }}></div>` : null}
              </div>
            `;
          })}
        </div>
        <div class="tier-track">
          <div style=${{ height: "100%", borderRadius: "99px", background: tier.color, width: progressPct, transition: "width 0.4s ease" }}></div>
        </div>
        <div style=${{ marginTop: "8px", fontSize: "11px" }}>
          ${tier.max === Infinity
            ? html`<span style=${{ color: "#F0C355", fontWeight: "600" }}>Elite tier — maximum ×1.50 multiplier active on all volume</span>`
            : html`
                <span style=${{ color: "#9BB0C6" }}>${clients} of ${tier.max} clients in ${tier.name} tier · </span>
                <span style=${{ color: tier.color, fontWeight: "700" }}>${clientsToNext} more clients → ${nextTier ? nextTier.name : ""}</span>
              `
          }
        </div>
      </div>

      <!-- ── Insight Cards ── -->
      <div style=${{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
        <div class="insight-card" style=${{ minWidth: "220px" }}>
          <div style=${{ fontSize: "10px", fontWeight: "750", color: nextTier ? nextTier.color : "#F0C355", letterSpacing: "0.09em", marginBottom: "8px" }}>
            ${nextTier ? "CLIENT GOAL" : "ELITE TIER ACTIVE"}
          </div>
          ${finalReward <= 0
            ? html`
                <div style=${{ fontSize: "12px", color: "#C7D4E3", lineHeight: "1.6" }}>
                  Add an instrument to see how many more clients you'd need to reach ${nextTier ? nextTier.name : "the next tier"}.
                </div>
              `
            : nextTier
            ? html`
                <div style=${{ fontSize: "12px", color: "#C7D4E3", lineHeight: "1.6", marginBottom: "10px" }}>
                  Bring <strong style=${{ color: "#FFFFFF", fontSize: "15px" }}>${clientsToNext}</strong> more clients to unlock <span style=${{ color: nextTier.color, fontWeight: "700" }}>${nextTier.name}</span>
                </div>
                <div style=${{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                  <span style=${{ fontFamily: '"JetBrains Mono", monospace', fontSize: "12px", color: "#8DA3BA" }}>${fmtUSD(finalReward)}</span>
                  <span style=${{ color: nextTier.color, fontSize: "15px" }}>→</span>
                  <span style=${{ fontFamily: '"JetBrains Mono", monospace', fontSize: "15px", fontWeight: "700", color: nextTier.color }}>${fmtUSD(earningsAtNext)}</span>
                </div>
                <div style=${{ fontSize: "10px", color: "#7C93AB" }}>
                  +${((earningsAtNext / finalReward - 1) * 100).toFixed(0)}% earnings at same trading volume
                </div>
              `
            : html`
                <div style=${{ fontSize: "12px", color: "#C7D4E3", lineHeight: "1.6" }}>
                  Maximum tier. Every new client earns at the highest ×1.50 multiplier.
                </div>
              `
          }
        </div>

        <div class="insight-card insight-card-blue" style=${{ minWidth: "220px" }}>
          <div style=${{ fontSize: "10px", fontWeight: "750", color: "#7DA6FF", letterSpacing: "0.09em", marginBottom: "8px" }}>VOLUME GOAL</div>
          ${finalReward <= 0
            ? html`
                <div style=${{ fontSize: "12px", color: "#C7D4E3", lineHeight: "1.6" }}>
                  Add an instrument to see how trading volume affects your earnings.
                </div>
              `
            : html`
                <div style=${{ fontSize: "12px", color: "#C7D4E3", lineHeight: "1.6", marginBottom: "10px" }}>
                  If clients trade <strong style=${{ color: "#FFFFFF", fontSize: "15px" }}>+50%</strong> more lots per instrument
                </div>
                <div style=${{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                  <span style=${{ fontFamily: '"JetBrains Mono", monospace', fontSize: "12px", color: "#8DA3BA" }}>${fmtUSD(finalReward)}</span>
                  <span style=${{ color: "#7DA6FF", fontSize: "15px" }}>→</span>
                  <span style=${{ fontFamily: '"JetBrains Mono", monospace', fontSize: "15px", fontWeight: "700", color: "#7DA6FF" }}>${fmtUSD(finalReward * 1.5)}</span>
                </div>
                <div style=${{ fontSize: "10px", color: "#7C93AB" }}>
                  +${fmtUSD(finalReward * 0.5)} additional per month
                </div>
              `
          }
        </div>
      </div>

      <!-- ── Charts Row ── -->
      <div style=${{ display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "stretch" }}>

        <div class="card" style=${{ flex: "1 1 260px", minWidth: "240px", padding: "15px 17px" }}>
          <div class="lbl" style=${{ marginBottom: "10px" }}>EARNINGS BREAKDOWN</div>
          <${DonutChart} breakdown=${breakdown} finalReward=${finalReward} tier=${tier} />
        </div>

        <div class="card" style=${{ flex: "1 1 260px", minWidth: "240px", padding: "15px 17px", display: "flex", flexDirection: "column" }}>
          <div style=${{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "8px" }}>
            <span class="lbl">EARNINGS PROJECTION</span>
            <span style=${{ fontSize: "10px", color: "#5E7A93" }}>same lots/client · 1 to ${growthPoints.length} clients</span>
          </div>
          <div style=${{ flex: "1", minHeight: "160px" }}>
            ${finalReward > 0
              ? html`<${GrowthCurve} points=${growthPoints} currentClients=${clients} />`
              : html`<div style=${{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", color: "#7C93AB" }}>Add an instrument to see your growth path</div>`
            }
          </div>
        </div>

      </div>

    </main>
  `;
}
