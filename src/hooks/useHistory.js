import { useEffect, useState } from "react";
import { getHistory, subscribeHistory } from "../lib/historyStore.js";

export function useHistory() {
  const [entries, setEntries] = useState(getHistory());

  useEffect(() => {
    return subscribeHistory(setEntries);
  }, []);

  return entries;
}
