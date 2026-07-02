import { html } from "../lib/html.js";
import { fmtUSD } from "../lib/format.js";

const ALL_TIERS = [
  { name: "Entry",        min: 1,  max: 10,       multiplier: 1.00, color: "#C3CEDA" },
  { name: "Growth",       min: 11, max: 25,        multiplier: 1.15, color: "#7DB4FF" },
  { name: "Professional", min: 26, max: 50,        multiplier: 1.30, color: "#C4A8FF" },
  { name: "Elite",        min: 51, max: Infinity,  multiplier: 1.50, color: "#F0C355" },
];

const TIER_CSS = {
  Entry: "tier-entry", Growth: "tier-growth",
  Professional: "tier-professional", Elite: "tier-elite",
};

function fmtVol(v) {
  if (v >= 1e9) return "$" + (v / 1e9).toFixed(2) + "B";
  if (v >= 1e6) return "$" + (v / 1e6).toFixed(1) + "M";
  if (v >= 1e3) return "$" + (v / 1e3).toFixed(0) + "K";
  return "$" + Math.round(v);
}

// ── Donut chart ──────────────────────────────────────────────────────────────
function DonutChart({ breakdown, finalReward, tier }) {
  const cx = 100, cy = 100, r = 78, sw = 26;
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
    <div style=${{ display: "flex", flexDirection: "column", height: "100%", justifyContent: "center", gap: "18px" }}>
      <svg viewBox="0 0 200 200" style=${{ width: "200px", height: "200px", margin: "0 auto", display: "block" }}>
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
        <text x=${cx} y=${cy - 10} textAnchor="middle"
          fill="#FFFFFF" fontSize="18" fontWeight="800"
          fontFamily='"JetBrains Mono", monospace'>
          ${fmtUSD(finalReward)}
        </text>
        <text x=${cx} y=${cy + 13} textAnchor="middle" fill="#7C93AB" fontSize="12">
          /month
        </text>
      </svg>

      <div style=${{ display: "flex", flexDirection: "column", gap: "10px" }}>
        ${active.length === 0
          ? html`<span style=${{ fontSize: "13px", color: "#7C93AB" }}>Add instruments to see breakdown</span>`
          : active.map((b, i) => {
              const earnPct = Math.round(b.reward / totalBase * 100);
              return html`
                <div key=${i} style=${{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style=${{ width: "10px", height: "10px", borderRadius: "3px", background: b.color, flexShrink: 0 }}></div>
                  <span style=${{ fontSize: "13px", color: "#C7D4E3", flex: "1" }}>${b.label}</span>
                  <span style=${{ fontSize: "11px", color: "#7C93AB", fontFamily: '"JetBrains Mono", monospace' }}>${b.lots}L</span>
                  <span style=${{ fontSize: "11px", color: "#9BB0C6", minWidth: "34px", textAlign: "right" }}>${earnPct}%</span>
                  <span style=${{ fontFamily: '"JetBrains Mono", monospace', fontSize: "14px", fontWeight: "700", color: b.color, minWidth: "84px", textAlign: "right" }}>${fmtUSD(b.reward * tier.multiplier)}</span>
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

  const W = 480, H = 190;
  const pL = 56, pR = 16, pT = 14, pB = 26;
  const iW = W - pL - pR, iH = H - pT - pB;
  const n = points.length;
  const maxVal = Math.max(...points, 1);
  const axisMax = maxVal * 1.15;

  function xOf(i) { return pL + (i / (n - 1)) * iW; }
  function yOf(v) { return pT + iH - (v / axisMax) * iH; }

  const linePts  = points.map((v, i) => xOf(i) + "," + yOf(v)).join(" L ");
  const linePath = "M " + linePts;
  const areaPath = linePath + " L " + xOf(n - 1) + "," + (pT + iH) + " L " + xOf(0) + "," + (pT + iH) + " Z";

  const curIdx = Math.min(currentClients - 1, n - 1);
  const curX   = xOf(curIdx);
  const curY   = yOf(points[curIdx] || 0);
  const curVal = points[curIdx] || 0;

  const tierLines = [
    { idx: 9.5,  color: "#7DB4FF", label: "Growth" },
    { idx: 24.5, color: "#C4A8FF", label: "Pro"     },
    { idx: 49.5, color: "#F0C355", label: "Elite"   },
  ];

  const yTicks = [0.25, 0.5, 0.75, 1.0].map(f => ({
    y: yOf(axisMax * f),
    t: axisMax * f >= 1_000_000 ? "$" + (axisMax * f / 1_000_000).toFixed(1) + "M"
      : axisMax * f >= 1000 ? "$" + (axisMax * f / 1000).toFixed(0) + "K"
      : "$" + Math.round(axisMax * f),
  }));

  const labelX = Math.min(curX + 8, W - pR - 56);
  const labelY = Math.max(curY - 12, pT + 12);

  return html`
    <svg viewBox=${"0 0 " + W + " " + H} style=${{ width: "100%", height: "100%", display: "block" }}>
      <defs>
        <linearGradient id="gcurve" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#00E5AC" stopOpacity="0.30" />
          <stop offset="100%" stopColor="#00E5AC" stopOpacity="0" />
        </linearGradient>
        <clipPath id="gcl">
          <rect x=${pL} y=${pT} width=${iW} height=${iH} />
        </clipPath>
      </defs>

      ${yTicks.map((t, i) => html`
        <line key=${i} x1=${pL} y1=${t.y} x2=${W - pR} y2=${t.y}
          stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
      `)}

      ${tierLines.flatMap((b, i) => {
        const x = xOf(b.idx);
        return [
          html`<line key=${"l" + i} x1=${x} y1=${pT} x2=${x} y2=${pT + iH}
            stroke=${b.color} strokeWidth="1" strokeDasharray="3 5" opacity="0.45" />`,
          html`<text key=${"t" + i} x=${x + 4} y=${pT + 12}
            fill=${b.color} fontSize="10" fontWeight="600" opacity="0.9">${b.label}</text>`,
        ];
      })}

      <path d=${areaPath} fill="url(#gcurve)" clipPath="url(#gcl)" />
      <path d=${linePath} fill="none" stroke="#00E5AC" strokeWidth="2.2"
        strokeLinejoin="round" clipPath="url(#gcl)" />

      ${yTicks.map((t, i) => html`
        <text key=${i} x=${pL - 7} y=${t.y + 4} textAnchor="end"
          fill="#7C93AB" fontSize="10" fontFamily='"JetBrains Mono", monospace'>${t.t}</text>
      `)}

      <line x1=${pL} y1=${pT + iH} x2=${W - pR} y2=${pT + iH}
        stroke="rgba(255,255,255,0.10)" strokeWidth="1" />
      <text x=${pL} y=${H - 6} fill="#7C93AB" fontSize="10">1</text>
      <text x=${W - pR} y=${H - 6} textAnchor="end" fill="#7C93AB" fontSize="10">100 clients</text>

      <line x1=${curX} y1=${pT} x2=${curX} y2=${pT + iH}
        stroke="rgba(0,229,172,0.35)" strokeWidth="1" strokeDasharray="3 3" />
      <circle cx=${curX} cy=${curY} r="7" fill="rgba(0,229,172,0.16)" />
      <circle cx=${curX} cy=${curY} r="4" fill="#00E5AC" />
      <circle cx=${curX} cy=${curY} r="1.8" fill="white" />

      <text x=${labelX} y=${labelY}
        fill="#00E5AC" fontSize="11" fontFamily='"JetBrains Mono", monospace' fontWeight="700">
        ${fmtUSD(curVal)}
      </text>
    </svg>
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
    <main style=${{ flex: "1", overflowY: "auto", padding: "26px 32px", display: "flex", flexDirection: "column", gap: "18px" }}>

      <!-- ── HERO ── -->
      <div class="card-glow" style=${{ padding: "30px 34px" }}>
        <div class="lbl" style=${{ marginBottom: "10px", letterSpacing: "0.16em" }}>ESTIMATED MONTHLY EARNINGS</div>

        <div style=${{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div class="earnings-num">${bigNum}</div>
            <div style=${{ fontSize: "12px", color: "#9BB0C6", marginTop: "8px", fontFamily: '"JetBrains Mono", monospace' }}>per month · 30-day rolling window</div>
          </div>
          <div style=${{ textAlign: "right", paddingTop: "5px" }}>
            <span class=${"tier-badge " + tierCss}>${tier.name.toUpperCase()}</span>
            <div style=${{ fontFamily: '"JetBrains Mono", monospace', fontSize: "21px", fontWeight: "700", color: tier.color, marginTop: "9px", letterSpacing: "-0.3px" }}>
              ×${tier.multiplier.toFixed(2)} tier boost
            </div>
          </div>
        </div>

        <div style=${{ display: "flex", gap: "12px", marginTop: "22px" }}>
          <div class="metric-pill">
            <div class="lbl" style=${{ marginBottom: "6px" }}>Per Client</div>
            <div style=${{ fontFamily: '"JetBrains Mono", monospace', fontSize: "21px", fontWeight: "700", color: "#FFFFFF" }}>${fmtUSD(perClient)}</div>
          </div>
          <div class="metric-pill">
            <div class="lbl" style=${{ marginBottom: "6px" }}>Total Lots Traded</div>
            <div style=${{ fontFamily: '"JetBrains Mono", monospace', fontSize: "21px", fontWeight: "700", color: "#FFFFFF" }}>${totalLots.toLocaleString()}</div>
          </div>
          <div class="metric-pill">
            <div class="lbl" style=${{ marginBottom: "6px" }}>Total Volume</div>
            <div style=${{ fontFamily: '"JetBrains Mono", monospace', fontSize: "21px", fontWeight: "700", color: "#FFFFFF" }}>${fmtVol(totalDolVol)}</div>
          </div>
        </div>
      </div>

      <!-- ── Tier Progress ── -->
      <div class="card" style=${{ padding: "20px 24px" }}>
        <div class="lbl" style=${{ marginBottom: "14px" }}>PARTNER TIER PROGRESS</div>
        <div style=${{ display: "flex", alignItems: "center", marginBottom: "12px" }}>
          ${ALL_TIERS.map((t, i) => {
            const tIdx = ALL_TIERS.findIndex(x => x.name === tier.name);
            const isActive = t.name === tier.name;
            const isPast   = i < tIdx;
            const col      = (isActive || isPast) ? t.color : "rgba(255,255,255,0.10)";
            return html`
              <div key=${t.name} style=${{ display: "flex", alignItems: "center", flex: i < 3 ? "1" : "none" }}>
                <div style=${{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
                  <span style=${{ fontSize: "11px", fontWeight: isActive ? "700" : "500", color: isActive ? t.color : isPast ? t.color : "#5E7A93", letterSpacing: "0.03em" }}>${t.name}</span>
                  <div style=${{ width: "12px", height: "12px", borderRadius: "50%", background: col, boxShadow: isActive ? "0 0 14px " + t.color + "90" : "none", transition: "all 0.3s" }}></div>
                  <span style=${{ fontSize: "11px", color: isActive ? t.color : "#5E7A93", fontFamily: '"JetBrains Mono", monospace' }}>×${t.multiplier.toFixed(2)}</span>
                </div>
                ${i < 3 ? html`<div style=${{ flex: "1", height: "2px", background: isPast ? t.color : "rgba(255,255,255,0.08)", margin: "0 7px", borderRadius: "2px" }}></div>` : null}
              </div>
            `;
          })}
        </div>
        <div class="tier-track">
          <div style=${{ height: "100%", borderRadius: "99px", background: tier.color, width: progressPct, transition: "width 0.4s ease" }}></div>
        </div>
        <div style=${{ marginTop: "10px", fontSize: "12px" }}>
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
      <div style=${{ display: "flex", gap: "14px" }}>
        <div class="insight-card">
          <div style=${{ fontSize: "11px", fontWeight: "750", color: nextTier ? nextTier.color : "#F0C355", letterSpacing: "0.10em", marginBottom: "10px" }}>
            ${nextTier ? "CLIENT GOAL" : "ELITE TIER ACTIVE"}
          </div>
          ${nextTier
            ? html`
                <div style=${{ fontSize: "13px", color: "#C7D4E3", lineHeight: "1.6", marginBottom: "12px" }}>
                  Bring <strong style=${{ color: "#FFFFFF", fontSize: "17px" }}>${clientsToNext}</strong> more clients to unlock <span style=${{ color: nextTier.color, fontWeight: "700" }}>${nextTier.name}</span>
                </div>
                <div style=${{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "7px" }}>
                  <span style=${{ fontFamily: '"JetBrains Mono", monospace', fontSize: "14px", color: "#8DA3BA" }}>${fmtUSD(finalReward)}</span>
                  <span style=${{ color: nextTier.color, fontSize: "18px" }}>→</span>
                  <span style=${{ fontFamily: '"JetBrains Mono", monospace', fontSize: "18px", fontWeight: "700", color: nextTier.color }}>${fmtUSD(earningsAtNext)}</span>
                </div>
                <div style=${{ fontSize: "11px", color: "#7C93AB" }}>
                  +${((earningsAtNext / Math.max(finalReward, 0.01) - 1) * 100).toFixed(0)}% earnings at same trading volume
                </div>
              `
            : html`
                <div style=${{ fontSize: "13px", color: "#C7D4E3", lineHeight: "1.6" }}>
                  Maximum tier. Every new client earns at the highest ×1.50 multiplier.
                </div>
              `
          }
        </div>

        <div class="insight-card insight-card-blue">
          <div style=${{ fontSize: "11px", fontWeight: "750", color: "#7DB4FF", letterSpacing: "0.10em", marginBottom: "10px" }}>VOLUME GOAL</div>
          <div style=${{ fontSize: "13px", color: "#C7D4E3", lineHeight: "1.6", marginBottom: "12px" }}>
            If clients trade <strong style=${{ color: "#FFFFFF", fontSize: "17px" }}>+50%</strong> more lots per instrument
          </div>
          <div style=${{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "7px" }}>
            <span style=${{ fontFamily: '"JetBrains Mono", monospace', fontSize: "14px", color: "#8DA3BA" }}>${fmtUSD(finalReward)}</span>
            <span style=${{ color: "#7DB4FF", fontSize: "18px" }}>→</span>
            <span style=${{ fontFamily: '"JetBrains Mono", monospace', fontSize: "18px", fontWeight: "700", color: "#7DB4FF" }}>${fmtUSD(finalReward * 1.5)}</span>
          </div>
          <div style=${{ fontSize: "11px", color: "#7C93AB" }}>
            +${fmtUSD(finalReward * 0.5)} additional per month
          </div>
        </div>
      </div>

      <!-- ── Charts Row ── -->
      <div style=${{ display: "flex", flexWrap: "wrap", gap: "14px", alignItems: "stretch" }}>

        <div class="card" style=${{ flex: "1 1 300px", minWidth: "280px", padding: "18px 20px" }}>
          <div class="lbl" style=${{ marginBottom: "12px" }}>EARNINGS BREAKDOWN</div>
          <${DonutChart} breakdown=${breakdown} finalReward=${finalReward} tier=${tier} />
        </div>

        <div class="card" style=${{ flex: "1 1 300px", minWidth: "280px", padding: "18px 20px", display: "flex", flexDirection: "column" }}>
          <div style=${{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "10px" }}>
            <span class="lbl">EARNINGS PROJECTION</span>
            <span style=${{ fontSize: "11px", color: "#5E7A93" }}>same lots/client · 1 to 100 clients</span>
          </div>
          <div style=${{ flex: "1", minHeight: "170px" }}>
            <${GrowthCurve} points=${growthPoints} currentClients=${clients} />
          </div>
        </div>

      </div>

    </main>
  `;
}
