import { useState } from "react";
import { html } from "./lib/html.js";
import { AccountProvider } from "./context/AccountContext.js";
import { AccountPanel } from "./components/AccountPanel.js";
import { MarginCalculator } from "./components/calculators/MarginCalculator.js";
import { PipValueCalculator } from "./components/calculators/PipValueCalculator.js";
import { ProfitCalculator } from "./components/calculators/ProfitCalculator.js";
import { SwapCalculator } from "./components/calculators/SwapCalculator.js";
import { CurrencyCalculator } from "./components/calculators/CurrencyCalculator.js";
import { WithdrawalCalculator } from "./components/calculators/WithdrawalCalculator.js";
import { AllInOneCalculator } from "./components/calculators/AllInOneCalculator.js";
import { HistoryCalculator } from "./components/calculators/HistoryCalculator.js";

const TABS = [
  { key: "all-in-one", label: "All-in-One", Component: AllInOneCalculator },
  { key: "margin", label: "Margin", Component: MarginCalculator },
  { key: "pip", label: "Pip Value", Component: PipValueCalculator },
  { key: "profit", label: "Profit", Component: ProfitCalculator },
  { key: "swap", label: "Swap", Component: SwapCalculator },
  { key: "currency", label: "Currency", Component: CurrencyCalculator },
  { key: "withdrawal", label: "Withdrawal", Component: WithdrawalCalculator },
  { key: "history", label: "History", Component: HistoryCalculator },
];

function AppShell() {
  const [activeKey, setActiveKey] = useState("all-in-one");
  const Active = TABS.find((t) => t.key === activeKey).Component;

  return html`
    <div class="app">
      <header class="app-header">
        <h1>Trading Calculators</h1>
        <p>A smart assistant for sizing trades, estimating costs, and understanding risk before you execute.</p>
        <a class="business-case-link" href="business-case.html">View the business case →</a>
      </header>
      <${AccountPanel} />
      <nav class="tabs">
        ${TABS.map((t) => html`<button class=${activeKey === t.key ? "active" : ""} onClick=${() => setActiveKey(t.key)}>${t.label}</button>`)}
      </nav>
      <${Active} />
    </div>
  `;
}

export function App() {
  return html`<${AccountProvider}><${AppShell} /></${AccountProvider}>`;
}
