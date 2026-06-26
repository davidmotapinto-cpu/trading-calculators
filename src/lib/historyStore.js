// Saved-simulation history — persisted to localStorage so it survives reloads.
// Single shared store with a pub/sub listener set (same pattern as
// useLiveTicker) so the History tab updates instantly when a calculator saves
// a snapshot, without needing a React context provider.
const KEY = "tc_simulation_history";
const MAX_ENTRIES = 100;

function read() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function write(entries) {
  try {
    localStorage.setItem(KEY, JSON.stringify(entries));
  } catch {
    // Storage full or unavailable (e.g. private browsing) — fail silently,
    // history just won't persist this session.
  }
}

let cache = read();
const listeners = new Set();

function notify() {
  listeners.forEach((fn) => fn(cache));
}

export function getHistory() {
  return cache;
}

export function subscribeHistory(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function saveSimulation({ calculator, instrument, summary, details }) {
  const entry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: Date.now(),
    calculator,
    instrument,
    summary,
    details,
  };
  cache = [entry, ...cache].slice(0, MAX_ENTRIES);
  write(cache);
  notify();
  return entry;
}

export function deleteSimulation(id) {
  cache = cache.filter((e) => e.id !== id);
  write(cache);
  notify();
}

export function clearHistory() {
  cache = [];
  write(cache);
  notify();
}
