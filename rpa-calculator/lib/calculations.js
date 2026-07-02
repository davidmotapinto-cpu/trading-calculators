import { getCoeffEntry, BENCHMARK } from "./coefficients.js";

// ── Model parameters (from config table — no hardcoding in production) ──────
export const PARAMS = {
  benchmarkRevPerM: BENCHMARK.revPerM, // $39.20
  coeffFloor: 0.10,
  coeffCeiling: 2.00,
};

// ── Tier table ───────────────────────────────────────────────────────────────
export const TIERS = [
  { name: "Entry",        min: 1,  max: 10,       multiplier: 1.00, color: "#C3CEDA" },
  { name: "Growth",       min: 11, max: 25,       multiplier: 1.15, color: "#7DA6FF" },
  { name: "Professional", min: 26, max: 50,       multiplier: 1.30, color: "#C4A8FF" },
  { name: "Elite",        min: 51, max: Infinity,  multiplier: 1.50, color: "#F0C355" },
];

export function getTier(clients) {
  return TIERS.find(t => clients >= t.min && clients <= t.max) ?? TIERS[0];
}

export function getNextTier(clients) {
  const idx = TIERS.findIndex(t => clients >= t.min && clients <= t.max);
  return idx < TIERS.length - 1 ? TIERS[idx + 1] : null;
}

// ── Step 3: Reward Rate per $1M ──────────────────────────────────────────────
export function rewardRate(allocationPct, params = PARAMS) {
  return params.benchmarkRevPerM * (allocationPct / 100);
}

// ── Per-row calculation ──────────────────────────────────────────────────────
export function calcRow(row, allocationPct, balanceRatio, params = PARAMS) {
  const { lots, contractSize, spotPrice, accountType, instrument } = row;
  const dv = (lots ?? 0) * (contractSize ?? 0) * (spotPrice ?? 0); // Step 1
  if (!dv) return { dollarisedVolume: 0, coeff: null, reward: 0 };

  const entry = getCoeffEntry(accountType, instrument);
  if (!entry || !entry.eligible || entry.coeff === null)
    return { dollarisedVolume: dv, coeff: null, reward: 0, revPerM: null };

  // Step 2: coefficient (pre-calculated, just clamp)
  const coeff = Math.max(params.coeffFloor, Math.min(params.coeffCeiling, entry.coeff));
  const rate   = rewardRate(allocationPct, params); // Step 3
  // Step 4: base reward contribution for this row
  const reward = (dv * balanceRatio * coeff / 1_000_000) * rate;

  return { dollarisedVolume: dv, coeff, revPerM: entry.revPerM, reward, rate };
}

// ── Full RPA calculation ─────────────────────────────────────────────────────
export function calcRPA({ rows, allocationPct, balanceRatio, activeClients, params = PARAMS }) {
  const tier = getTier(activeClients);
  const rate = rewardRate(allocationPct, params);

  const rowResults = rows.map(r => ({ ...r, ...calcRow(r, allocationPct, balanceRatio, params) }));

  const totalVolume = rowResults.reduce((s, r) => s + r.dollarisedVolume, 0);
  const baseReward  = rowResults.reduce((s, r) => s + r.reward, 0);
  const finalReward = baseReward * tier.multiplier; // Step 5
  const effectiveRatePerM = totalVolume > 0 ? (finalReward / totalVolume) * 1_000_000 : 0;

  return { rowResults, totalVolume, baseReward, finalReward, tier, rate, effectiveRatePerM };
}

// ── Curve helpers for charts ─────────────────────────────────────────────────
export function volumeCurve(rows, allocationPct, balanceRatio, activeClients, params = PARAMS) {
  const points = [];
  for (let m = 0.1; m <= 5.01; m += 0.1) {
    const mult = Math.round(m * 10) / 10;
    const scaled = rows.map(r => ({ ...r, lots: r.lots * mult }));
    const res = calcRPA({ rows: scaled, allocationPct, balanceRatio, activeClients, params });
    points.push({ mult, volume: res.totalVolume, reward: res.finalReward });
  }
  return points;
}

export function sensitivityCurve(rows, balanceRatio, activeClients, params = PARAMS) {
  const points = [];
  for (let alloc = 10; alloc <= 100; alloc += 5) {
    const res = calcRPA({ rows, allocationPct: alloc, balanceRatio, activeClients, params });
    points.push({ alloc, reward: res.finalReward });
  }
  return points;
}

export function tierImpactData(baseReward) {
  return TIERS.map(t => ({ ...t, reward: baseReward * t.multiplier }));
}
