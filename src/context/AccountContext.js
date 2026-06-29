// Simulated account state. `fetchAccount` is the seam for a real CRM/Trading
// Platform call — everything else (consumers via useAccount) stays the same
// once that function returns live data instead of the default below.
import React, { createContext, useCallback, useContext, useState } from "react";

const DEFAULT_ACCOUNT = {
  currency: "USD",
  leverage: 200,
  balance: 10000, // treated as equity in this simulation (no live floating P/L feed)
  usedMargin: 2000,
  accountType: "standard", // "standard" | "premier" — see src/lib/accountTypes.js
  hasAccount: true, // false = prospective client exploring before opening one
};

async function fetchAccount() {
  return DEFAULT_ACCOUNT;
}

const AccountContext = createContext(null);

export function AccountProvider({ children }) {
  const [account, setAccount] = useState(DEFAULT_ACCOUNT);

  const updateAccount = useCallback((patch) => {
    setAccount((prev) => ({ ...prev, ...patch }));
  }, []);

  const refreshFromBackend = useCallback(async () => {
    const fresh = await fetchAccount();
    setAccount(fresh);
  }, []);

  return React.createElement(
    AccountContext.Provider,
    { value: { account, updateAccount, refreshFromBackend } },
    children
  );
}

export function useAccount() {
  const ctx = useContext(AccountContext);
  if (!ctx) throw new Error("useAccount must be used within AccountProvider");
  return ctx;
}
