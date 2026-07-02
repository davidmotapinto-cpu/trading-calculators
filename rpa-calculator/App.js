import { useState, useMemo } from "react";
import { html } from "./lib/html.js";
import { COEFFICIENT_TABLE, getCoeffEntry, BENCHMARK } from "./lib/coefficients.js";
import { PARAMS, getTier, getNextTier, rewardRate } from "./lib/calculations.js";
import { LeftPanel } from "./components/LeftPanel.js";
import { Dashboard } from "./components/Dashboard.js";

const BALANCE_RATIO = 1.00;         // account-level multiplier — never shown in UI
const ALLOC_PCT     = 60;           // allocation % — never shown in UI
const REWARD_RATE   = rewardRate(ALLOC_PCT, PARAMS); // constant $/1M, e.g. $23.52 — never shown in UI

function clampCoeff(c) {
  return Math.max(PARAMS.coeffFloor, Math.min(PARAMS.coeffCeiling, c));
}

// Display metadata per instrument symbol — labels, colors, category, USD notional per 1 standard lot.
// XAUJPY is quoted in JPY; its dollarised notional uses the same USD-equivalent 100oz gold
// contract value as XAUUSD (a raw JPY-price multiply would need FX conversion, which the
// reference sheet does not provide — using the USD-equivalent avoids overstating volume ~180x).
const INSTRUMENT_INFO = {
  XAUUSD:    { label: "Gold / USD",           color: "#D4AF37", category: "Metals",  lotValue: 335_000 },
  XAUJPY:    { label: "Gold / JPY",           color: "#FCD34D", category: "Metals",  lotValue: 335_000 },
  GCM:       { label: "Gold Futures (GCM)",   color: "#F59E0B", category: "Metals",  lotValue:     100 },
  WTI:       { label: "Crude Oil (WTI)",      color: "#FB923C", category: "Energy",  lotValue:  80_000 },
  EURUSD:    { label: "EUR / USD",            color: "#34D399", category: "Forex",   lotValue: 108_000 },
  US30M:     { label: "Wall St 30 — Cash",    color: "#60A5FA", category: "Indices", lotValue:  44_500 },
  US30ROLL:  { label: "Wall St 30 — Roll",    color: "#818CF8", category: "Indices", lotValue:  44_500 },
  UT100M:    { label: "Nasdaq 100 — Cash",    color: "#22D3EE", category: "Indices", lotValue:  21_800 },
  UT100ROLL: { label: "Nasdaq 100 — Roll",    color: "#A78BFA", category: "Indices", lotValue:  21_800 },
};

const CATEGORY_ORDER = ["Metals", "Energy", "Forex", "Indices"];

const DEFAULT_LOTS = {
  Standard:         { XAUUSD: 30, WTI: 20 },
  Premier:          { EURUSD: 25, XAUUSD: 15 },
  Classic:          { XAUUSD: 25 },
  B2BDirect:        { XAUUSD: 20 },
  B2BMT4Direct:     { XAUUSD: 20 },
  B2BAPI:           { XAUUSD: 15, EURUSD: 15 },
  StandardProvider: { XAUUSD: 20 },
  StandardFollower: { XAUUSD: 20 },
  PremierProvider:  { XAUUSD: 20 },
};

// Build the eligible instrument catalog for an account type directly from the
// coefficient table — grouped by category, in a stable display order.
function buildCatalog(accountType) {
  const rows = COEFFICIENT_TABLE.filter(r => r.accountType === accountType && r.eligible);
  const catalog = {};
  CATEGORY_ORDER.forEach(cat => { catalog[cat] = []; });
  rows.forEach(r => {
    const info = INSTRUMENT_INFO[r.instrument];
    if (!info) return;
    catalog[info.category].push({ key: r.instrument, ...info });
  });
  Object.keys(catalog).forEach(cat => { if (catalog[cat].length === 0) delete catalog[cat]; });
  return catalog;
}

function flatInstruments(catalog) {
  return Object.values(catalog).flat();
}

export function App() {
  const [accountType,    setAccountType]    = useState("Standard");
  const [clients,        setClients]        = useState(20);
  const [instrumentLots, setInstrumentLots] = useState({ ...DEFAULT_LOTS.Standard });

  function handleAccountType(type) {
    setAccountType(type);
    setInstrumentLots({ ...(DEFAULT_LOTS[type] || {}) });
  }

  function setLots(key, val) {
    const n = Math.max(0, Math.round(Number(val) || 0));
    setInstrumentLots(prev => ({ ...prev, [key]: n }));
  }

  function removeInstrument(key) {
    setInstrumentLots(prev => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  function addInstrument(key) {
    setInstrumentLots(prev => ({ ...prev, [key]: 10 }));
  }

  const catalog = useMemo(() => buildCatalog(accountType), [accountType]);
  const allInst = useMemo(() => flatInstruments(catalog), [catalog]);

  function rewardFor(inst, lots, clientCount) {
    const entry = getCoeffEntry(accountType, inst.key);
    if (!entry || entry.eligible === false || entry.coeff === null) return 0;
    const dolVol = clientCount * lots * inst.lotValue;
    const coeff  = clampCoeff(entry.coeff);
    return (dolVol * BALANCE_RATIO * coeff / 1_000_000) * REWARD_RATE;
  }

  const computed = useMemo(() => {
    const tier     = getTier(clients);
    const nextTier = getNextTier(clients);

    let baseReward = 0;
    const breakdown = [];

    allInst.forEach(inst => {
      const lots = instrumentLots[inst.key];
      if (!lots || lots <= 0) return;
      const reward = rewardFor(inst, lots, clients);
      if (reward <= 0) return;

      baseReward += reward;
      breakdown.push({ ...inst, lots, totalLots: clients * lots, dolVol: clients * lots * inst.lotValue, reward });
    });

    const finalReward = baseReward * tier.multiplier;
    const perClient   = clients > 0 ? finalReward / clients : 0;
    const totalLots   = breakdown.reduce((s, b) => s + b.totalLots, 0);
    const totalDolVol = breakdown.reduce((s, b) => s + b.dolVol, 0);

    const earningsAtNext = nextTier
      ? baseReward * (nextTier.min / Math.max(1, clients)) * nextTier.multiplier
      : 0;

    const growthPoints = [];
    for (let c = 1; c <= 100; c++) {
      const t = getTier(c);
      let base = 0;
      allInst.forEach(inst => {
        const lots = instrumentLots[inst.key];
        if (!lots || lots <= 0) return;
        base += rewardFor(inst, lots, c);
      });
      growthPoints.push(base * t.multiplier);
    }

    return {
      finalReward, baseReward, perClient,
      totalLots, totalDolVol,
      breakdown, tier, nextTier,
      earningsAtNext, growthPoints,
    };
    // eslint-disable-next-line
  }, [accountType, clients, instrumentLots, allInst]);

  return html`
    <div style=${{ height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>

      <header style=${{ borderBottom: "1px solid rgba(255,255,255,0.08)", padding: "22px 48px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <div style=${{ display: "flex", alignItems: "center", gap: "20px" }}>
          <div style=${{ width: "50px", height: "50px", borderRadius: "14px", background: "linear-gradient(135deg, #00E5AC, #0EA5E9)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 0 24px rgba(0,200,150,0.35)" }}>
            <span style=${{ color: "#fff", fontSize: "26px", fontWeight: "900" }}>E</span>
          </div>
          <div>
            <div style=${{ fontSize: "24px", fontWeight: "750", color: "#FFFFFF", letterSpacing: "-0.02em" }}>Partner Earnings Simulator</div>
            <div style=${{ fontSize: "13px", color: "#7C93AB", letterSpacing: "0.12em", fontWeight: "700" }}>EQUITI IB PORTAL</div>
          </div>
        </div>
        <div style=${{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style=${{ width: "10px", height: "10px", borderRadius: "50%", background: "#00E5AC", boxShadow: "0 0 14px #00E5AC" }}></div>
          <span style=${{ fontSize: "14px", color: "#7C93AB", fontFamily: '"JetBrains Mono", monospace', letterSpacing: "0.12em", fontWeight: "600" }}>LIVE</span>
        </div>
      </header>

      <div style=${{ flex: "1", display: "flex", overflow: "hidden" }}>
        <${LeftPanel}
          accountType=${accountType}
          onAccountType=${handleAccountType}
          clients=${clients}
          onClients=${setClients}
          instrumentLots=${instrumentLots}
          onSetLots=${setLots}
          onRemoveInstrument=${removeInstrument}
          onAddInstrument=${addInstrument}
          catalog=${catalog}
          allInst=${allInst}
          tier=${computed.tier}
        />
        <${Dashboard} result=${computed} clients=${clients} />
      </div>
    </div>
  `;
}
