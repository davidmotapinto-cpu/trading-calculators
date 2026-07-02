import { useState } from "react";
import { html } from "../lib/html.js";
import { ACCOUNT_TYPE_META } from "../lib/accountTypes.js";
import { COEFFICIENT_TABLE } from "../lib/coefficients.js";

const TIER_CSS = {
  Entry: "tier-entry", Growth: "tier-growth",
  Professional: "tier-professional", Elite: "tier-elite",
};

const CLIENT_PRESETS = [1, 10, 25, 50, 100, 200];
const LOT_PRESETS     = [5, 10, 25, 50, 100, 250];

function eligibleCount(accountType) {
  return COEFFICIENT_TABLE.filter(r => r.accountType === accountType && r.eligible).length;
}

function MinusIcon() {
  return html`<svg viewBox="0 0 16 16" width="20" height="20"><path d="M3 8h10" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" /></svg>`;
}
function PlusIcon() {
  return html`<svg viewBox="0 0 16 16" width="20" height="20"><path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" /></svg>`;
}
function CloseIcon() {
  return html`<svg viewBox="0 0 16 16" width="16" height="16"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" /></svg>`;
}
function ChevronIcon({ open }) {
  return html`<svg viewBox="0 0 16 16" width="16" height="16" style=${{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}><path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" /></svg>`;
}
function SearchIcon() {
  return html`<svg viewBox="0 0 16 16" width="18" height="18"><circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.8" fill="none" /><path d="M11 11l3.5 3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>`;
}

function NumberField({ value, onChange, min = 0, max = 99999, step = 1, size = "md" }) {
  const cls = size === "lg" ? "stepper-btn stepper-lg" : "stepper-btn";
  return html`
    <div style=${{ display: "flex", alignItems: "stretch" }}>
      <button class=${cls + " stepper-l"} onClick=${() => onChange(Math.max(min, value - step))}><${MinusIcon} /></button>
      <input class=${size === "lg" ? "lot-input lot-input-lg" : "lot-input"} type="number" min=${min} max=${max}
        value=${value}
        onInput=${e => onChange(e.target.value)}
        onChange=${e => onChange(e.target.value)}
      />
      <button class=${cls + " stepper-r"} onClick=${() => onChange(Math.min(max, value + step))}><${PlusIcon} /></button>
    </div>
  `;
}

function InstrumentCard({ inst, lots, onSetLots, onRemove }) {
  return html`
    <div class="inst-card" style=${{ borderLeft: "3px solid " + inst.color + "50" }}>
      <div style=${{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "18px" }}>
        <div style=${{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div style=${{ width: "18px", height: "18px", borderRadius: "5px", background: inst.color, boxShadow: "0 0 12px " + inst.color + "80", flexShrink: 0 }}></div>
          <div>
            <div style=${{ fontSize: "23px", fontWeight: "650", color: "#FFFFFF", lineHeight: "1.25" }}>${inst.label}</div>
            <div style=${{ fontSize: "15px", color: "#8DA3BA", fontFamily: '"JetBrains Mono", monospace', letterSpacing: "0.06em", marginTop: "5px" }}>${inst.key} · ${inst.category}</div>
          </div>
        </div>
        <button class="remove-btn" onClick=${onRemove} title="Remove instrument"><${CloseIcon} /></button>
      </div>

      <div style=${{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
        <span style=${{ fontSize: "16px", color: "#9BB0C6", fontWeight: "500" }}>Lots / client / month</span>
        <${NumberField} value=${lots} onChange=${onSetLots} />
      </div>

      <div style=${{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        ${LOT_PRESETS.map(p => html`
          <button key=${p} class=${"preset-btn" + (lots === p ? " active" : "")}
            onClick=${() => onSetLots(p)}>${p}</button>
        `)}
      </div>
    </div>
  `;
}

export function LeftPanel({
  accountType, onAccountType,
  clients, onClients,
  instrumentLots, onSetLots, onRemoveInstrument, onAddInstrument,
  catalog, allInst, tier,
}) {
  const [showPicker, setShowPicker] = useState(false);
  const [search, setSearch] = useState("");
  const [showAcctPicker, setShowAcctPicker] = useState(false);

  const activeKeys = new Set(Object.keys(instrumentLots));
  const activeInstruments = allInst.filter(i => activeKeys.has(i.key));

  const availableByCategory = {};
  Object.entries(catalog).forEach(([cat, insts]) => {
    const avail = insts.filter(i => !activeKeys.has(i.key));
    const filtered = search.trim()
      ? avail.filter(i => (i.label + " " + i.key).toLowerCase().includes(search.trim().toLowerCase()))
      : avail;
    if (filtered.length > 0) availableByCategory[cat] = filtered;
  });
  const totalAvailable = Object.values(catalog).flat().filter(i => !activeKeys.has(i.key)).length;
  const hasAvailable = totalAvailable > 0;
  const hasFilteredResults = Object.keys(availableByCategory).length > 0;

  const currentAcct = ACCOUNT_TYPE_META[accountType];
  const acctGroups = { Retail: [], Institutional: [] };
  Object.entries(ACCOUNT_TYPE_META).forEach(([key, meta]) => {
    acctGroups[meta.group].push({ key, ...meta });
  });

  return html`
    <aside style=${{ width: "720px", minWidth: "720px", borderRight: "1px solid rgba(255,255,255,0.08)", overflowY: "auto", display: "flex", flexDirection: "column" }}>
      <div style=${{ padding: "44px 42px", display: "flex", flexDirection: "column", gap: "46px" }}>

        <!-- ── Account Type ── -->
        <section>
          <div class="lbl" style=${{ marginBottom: "16px" }}>Account Type</div>

          <button class="acct-select-btn" onClick=${() => setShowAcctPicker(!showAcctPicker)}>
            <div style=${{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "5px" }}>
              <span style=${{ fontSize: "23px", fontWeight: "700", color: "#FFFFFF" }}>${currentAcct.label}</span>
              <span style=${{ fontSize: "15px", color: "#9BB0C6" }}>${currentAcct.desc}</span>
            </div>
            <span style=${{ marginLeft: "auto", color: "#00E5AC", display: "flex", alignItems: "center", gap: "8px" }}>
              <span class="inst-count-chip">${eligibleCount(accountType)} instruments</span>
              <${ChevronIcon} open=${showAcctPicker} />
            </span>
          </button>

          ${showAcctPicker ? html`
            <div class="inst-picker">
              ${["Retail", "Institutional"].map(group => html`
                <div key=${group} style=${{ marginBottom: "18px" }}>
                  <div style=${{ fontSize: "14px", fontWeight: "700", letterSpacing: "0.14em", color: "#7C93AB", textTransform: "uppercase", marginBottom: "12px" }}>${group} Accounts</div>
                  <div style=${{ display: "flex", flexDirection: "column", gap: "9px" }}>
                    ${acctGroups[group].map(a => html`
                      <button key=${a.key} class=${"picker-row" + (a.key === accountType ? " picker-row-active" : "")}
                        onClick=${() => { onAccountType(a.key); setShowAcctPicker(false); }}>
                        <div style=${{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "4px", flex: "1" }}>
                          <span style=${{ fontSize: "18px", fontWeight: "600", color: a.key === accountType ? "#00E5AC" : "#E4ECF5" }}>${a.label}</span>
                          <span style=${{ fontSize: "14px", color: "#8DA3BA" }}>${a.desc}</span>
                        </div>
                        <span class="add-chip">${eligibleCount(a.key)} inst.</span>
                      </button>
                    `)}
                  </div>
                </div>
              `)}
            </div>
          ` : null}
        </section>

        <!-- ── Active Clients ── -->
        <section>
          <div style=${{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
            <div>
              <div class="lbl" style=${{ marginBottom: "7px" }}>Active Clients</div>
              <div style=${{ fontSize: "16px", color: "#8DA3BA" }}>referred clients trading in 30-day window</div>
            </div>
            <span class=${"tier-badge " + (TIER_CSS[tier.name] || "tier-entry")}>${tier.name}</span>
          </div>

          <${NumberField} value=${clients} onChange=${v => onClients(Math.max(1, Math.min(500, Math.round(Number(v) || 1))))} min="1" max="500" size="lg" />

          <div style=${{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "16px" }}>
            ${CLIENT_PRESETS.map(p => html`
              <button key=${p} class=${"preset-btn" + (clients === p ? " active" : "")}
                onClick=${() => onClients(p)}>${p}</button>
            `)}
          </div>
        </section>

        <!-- ── Divider ── -->
        <div style=${{ height: "1px", background: "rgba(255,255,255,0.08)", margin: "0 -42px" }}></div>

        <!-- ── Instrument Configuration ── -->
        <section>
          <div style=${{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "9px" }}>
            <div class="lbl">Instrument Configuration</div>
            <span style=${{ fontSize: "15px", color: "#7C93AB", fontFamily: '"JetBrains Mono", monospace' }}>${activeInstruments.length} active</span>
          </div>
          <div style=${{ fontSize: "16px", color: "#8DA3BA", marginBottom: "26px", lineHeight: "1.6" }}>
            Choose the instruments your clients trade and set average lots per client per month
          </div>

          ${activeInstruments.length === 0
            ? html`
                <div style=${{ padding: "40px 26px", textAlign: "center", color: "#8DA3BA", fontSize: "17px", background: "rgba(255,255,255,0.02)", borderRadius: "18px", border: "1px dashed rgba(255,255,255,0.12)", lineHeight: "1.8" }}>
                  No instruments selected.<br/>
                  <span style=${{ color: "#5E7A93" }}>Add instruments below to start simulating earnings.</span>
                </div>
              `
            : html`
                <div style=${{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  ${activeInstruments.map(inst => html`
                    <${InstrumentCard}
                      key=${inst.key}
                      inst=${inst}
                      lots=${instrumentLots[inst.key] || 0}
                      onSetLots=${v => onSetLots(inst.key, v)}
                      onRemove=${() => onRemoveInstrument(inst.key)}
                    />
                  `)}
                </div>
              `
          }

          <!-- ── Add Instrument ── -->
          <div style=${{ marginTop: "20px" }}>
            ${hasAvailable ? html`
              <button class="add-inst-btn" onClick=${() => setShowPicker(!showPicker)}>
                <span style=${{ display: "flex", alignItems: "center", justifyContent: "center", width: "22px", height: "22px" }}><${PlusIcon} /></span>
                Add Instrument
                <span style=${{ marginLeft: "auto", color: "#00E5AC" }}><${ChevronIcon} open=${showPicker} /></span>
              </button>

              ${showPicker ? html`
                <div class="inst-picker">
                  <div class="search-wrap">
                    <span style=${{ color: "#7C93AB", display: "flex" }}><${SearchIcon} /></span>
                    <input class="search-input" type="text" placeholder="Search instruments…"
                      value=${search} onInput=${e => setSearch(e.target.value)} />
                  </div>

                  ${!hasFilteredResults
                    ? html`<div style=${{ fontSize: "16px", color: "#7C93AB", textAlign: "center", padding: "26px 0" }}>No instruments match "${search}"</div>`
                    : Object.entries(availableByCategory).map(([cat, insts]) => html`
                        <div key=${cat} style=${{ marginBottom: "20px" }}>
                          <div style=${{ fontSize: "14px", fontWeight: "700", letterSpacing: "0.14em", color: "#7C93AB", textTransform: "uppercase", marginBottom: "11px" }}>${cat}</div>
                          <div style=${{ display: "flex", flexDirection: "column", gap: "9px" }}>
                            ${insts.map(inst => html`
                              <button key=${inst.key} class="picker-row"
                                onClick=${() => { onAddInstrument(inst.key); setShowPicker(false); setSearch(""); }}>
                                <div style=${{ width: "12px", height: "12px", borderRadius: "3px", background: inst.color, flexShrink: 0 }}></div>
                                <span style=${{ fontSize: "18px", fontWeight: "550", color: "#E4ECF5", flex: "1", textAlign: "left" }}>${inst.label}</span>
                                <span style=${{ fontSize: "14px", color: "#7C93AB", fontFamily: '"JetBrains Mono", monospace' }}>${inst.key}</span>
                                <span class="add-chip">+ Add</span>
                              </button>
                            `)}
                          </div>
                        </div>
                      `)
                  }
                </div>
              ` : null}
            ` : html`
              <div style=${{ fontSize: "16px", color: "#7C93AB", textAlign: "center", padding: "18px 0" }}>
                All RPA-eligible instruments for ${currentAcct.label} are added
              </div>
            `}
          </div>

          <!-- ── Reference prices ── -->
          <div style=${{ fontSize: "15px", color: "#5E7A93", marginTop: "30px", lineHeight: "1.9", borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: "22px" }}>
            Reference prices for dollarisation:<br/>
            Gold $3,350/oz · Crude Oil $80/bbl · Nasdaq ~$21,800 · EUR/USD ~1.08 · Wall St 30 ~$44,500
          </div>
        </section>

      </div>
    </aside>
  `;
}
