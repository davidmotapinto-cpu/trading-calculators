import { html } from "../lib/html.js";
import { formatMoney } from "../lib/format.js";

// Rule-based commentary (no actual model call) that reads like guidance from
// a trading assistant: a headline judgment, the numbers behind it, and — for
// risky setups — a concrete sizing suggestion instead of just a warning.
const HEADLINES = {
  low: { icon: "✓", text: "This trade size looks comfortably within typical risk limits." },
  medium: { icon: "!", text: "This trade uses a moderate share of your account — worth watching." },
  high: { icon: "⚠", text: "This trade exposes a high percentage of your account to risk." },
};

export function AIInsight({ level, marginUtilizationPct, lossPct, marginAccount, lossAmount, accountCcy, lots, lotStep, marginCallDistancePct, leverage }) {
  const headline = HEADLINES[level];
  const rawSuggestion = level === "high" && lossPct > 5 ? Math.max(lotStep, Math.floor((lots * (5 / lossPct)) / lotStep) * lotStep) : null;
  const suggestedLots = rawSuggestion != null && rawSuggestion < lots ? rawSuggestion : null;
  const showMarginCall = Number.isFinite(marginCallDistancePct);
  const worstCaseReturnOnMarginPct = marginAccount > 0 ? (lossAmount / marginAccount) * 100 : null;

  return html`
    <div class="ai-insight ai-insight-${level}">
      <div class="ai-insight-head">
        <span class="ai-insight-icon">${headline.icon}</span>
        <span class="ai-insight-headline">${headline.text}</span>
      </div>
      <p class="ai-insight-body">
        Margin in use: <strong>${formatMoney(marginAccount, accountCcy)}</strong> (${marginUtilizationPct.toFixed(1)}% of equity).
        Worst case across the price range shown: <strong>${formatMoney(Math.abs(lossAmount), accountCcy)}</strong> (${lossPct.toFixed(1)}% of equity).
        ${showMarginCall && html`A sustained move of about <strong>${marginCallDistancePct.toFixed(1)}%</strong> against you could trigger a margin call at this leverage.`}
        ${leverage && worstCaseReturnOnMarginPct != null && html`At 1:${leverage} leverage, that worst case is about <strong>${Math.abs(worstCaseReturnOnMarginPct).toFixed(0)}%</strong> of the margin you've actually committed — leverage amplifies swings on your capital in both directions, not just the dollar P/L.`}
      </p>
      ${suggestedLots &&
      html`
        <p class="ai-insight-suggestion">
          Suggestion: reducing to <strong>${suggestedLots.toFixed(2)} lots</strong> would bring worst-case loss closer to 5% of equity.
        </p>
      `}
    </div>
  `;
}
