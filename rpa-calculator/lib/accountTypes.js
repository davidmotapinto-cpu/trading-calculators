// Every partner account type defined in the coefficient table — not just Standard/Premier.
// Each has its own set of RPA-eligible instruments and reward coefficients.
export const ACCOUNT_TYPE_META = {
  Standard:         { label: "Standard",          group: "Retail",        desc: "Commission-based · Gold, Oil & Nasdaq" },
  Premier:          { label: "Premier",           group: "Retail",        desc: "Spread-based · FX, Gold & Indices" },
  Classic:          { label: "Classic",           group: "Retail",        desc: "Spread-based · Gold only" },
  B2BDirect:        { label: "B2B Direct",        group: "Institutional", desc: "Direct institutional bridge · Gold & Nasdaq" },
  B2BMT4Direct:     { label: "B2B MT4 Direct",    group: "Institutional", desc: "MT4 institutional bridge · Gold only" },
  B2BAPI:           { label: "B2B API",           group: "Institutional", desc: "FIX/API institutional access · Gold & FX" },
  StandardProvider: { label: "Standard Provider", group: "Institutional", desc: "Liquidity provider tier · Gold only" },
  StandardFollower: { label: "Standard Follower", group: "Institutional", desc: "Copy-trading follower tier · Gold only" },
  PremierProvider:  { label: "Premier Provider",  group: "Institutional", desc: "Premier liquidity provider tier · Gold only" },
};
