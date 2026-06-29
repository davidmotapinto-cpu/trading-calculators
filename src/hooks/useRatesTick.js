import { useEffect, useState } from "react";
import { subscribeRates } from "../lib/fxRates.js";

// Forces a re-render whenever RATES is refreshed from the ECB in the
// background, so components that read RATES directly (rather than via
// useLiveTicker, which already re-renders constantly from its own tick)
// don't keep showing whatever rate was current the last time the user
// happened to interact with an input.
export function useRatesTick() {
  const [, setTick] = useState(0);
  useEffect(() => subscribeRates(() => setTick((t) => t + 1)), []);
}
