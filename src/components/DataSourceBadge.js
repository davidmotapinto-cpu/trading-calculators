import { html } from "../lib/html.js";
import { getDataSource } from "../lib/liveDataFeeds.js";

const LABELS = {
  live: { text: "Live", title: "Real price, refreshed every few seconds from a public exchange feed (Binance)." },
  proxy: { text: "Live (Proxy)", title: "Real price from a closely-tracking proxy (a tokenized asset on Binance), refreshed every ~10s — usually close to spot but not the literal interbank quote." },
  daily: { text: "Daily Rate", title: "Real ECB reference rate, refreshed once a day — accurate, but not tick-by-tick live." },
  simulated: { text: "Simulated", title: "No free real-time source available for this instrument — price is simulated, not live." },
};

export function DataSourceBadge({ symbol }) {
  const source = getDataSource(symbol);
  const { text, title } = LABELS[source];
  return html`<span class="sim-badge source-${source}" title=${title}>${text}</span>`;
}
