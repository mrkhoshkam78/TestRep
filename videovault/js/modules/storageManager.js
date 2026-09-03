/**
 * Storage Manager Module
 * Local history of downloads
 */

const KEY = 'videovault_history';
const MAX_ITEMS = 30;

export function getHistory() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addToHistory(item) {
  const list = getHistory();
  // Avoid duplicates by url+title
  const filtered = list.filter(
    (h) => !(h.url === item.url && h.title === item.title)
  );
  filtered.unshift({
    ...item,
    savedAt: Date.now()
  });
  const trimmed = filtered.slice(0, MAX_ITEMS);
  localStorage.setItem(KEY, JSON.stringify(trimmed));
  return trimmed;
}

export function removeFromHistory(index) {
  const list = getHistory();
  list.splice(index, 1);
  localStorage.setItem(KEY, JSON.stringify(list));
  return list;
}

export function clearHistory() {
  localStorage.removeItem(KEY);
  return [];
}
