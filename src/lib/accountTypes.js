// Real account tiers as published on Equiti's own site (cross-checked against
// two regional pages, since third-party aggregators disagreed with each
// other on Premier's minimum deposit):
//   https://www.equiti.com/uae-en/accounts/standard-account/
//   https://www.equiti.com/jo-en/accounts/premier-account/
// Spread is modeled as a one-time round-trip cost (you cross the spread once
// entering, once exiting); commission is charged per side, so x2 for a
// round trip. Both are real, published figures — not estimates.
export const ACCOUNT_TYPES = {
  standard: {
    key: "standard",
    label: "Standard",
    minDeposit: 100,
    avgSpreadPips: 1.4,
    commissionPerLotPerSide: 0,
    leverageMax: 500,
    tagline: "No commission, average spreads from 1.4 pips — built for new to intermediate traders.",
  },
  premier: {
    key: "premier",
    label: "Premier",
    minDeposit: 3000,
    avgSpreadPips: 0,
    commissionPerLotPerSide: 3.5,
    leverageMax: 500,
    tagline: "Raw spreads from 0.0 pips plus $3.5/lot/side commission — built for advanced, high-volume traders.",
  },
};

export const ACCOUNT_TYPE_LIST = Object.values(ACCOUNT_TYPES);

// `pipValuePerLot` here means the per-pip account-currency value already
// scaled by lots (i.e. calculatePipValue's perUnitAccount output) — spread
// cost is one round-trip crossing of the average spread on that position.
export function estimateTradingCost({ accountType, lots, pipValuePerUnitAccount }) {
  const type = ACCOUNT_TYPES[accountType] || ACCOUNT_TYPES.standard;
  const spreadCost = type.avgSpreadPips * pipValuePerUnitAccount;
  const commissionCost = type.commissionPerLotPerSide * 2 * lots; // entry + exit
  return { spreadCost, commissionCost, totalCost: spreadCost + commissionCost };
}
