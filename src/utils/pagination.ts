export function appendUniqueBy<T>(current: T[], incoming: T[], getKey: (item: T) => string): T[] {
  const seen = new Set(current.map(getKey));
  const unique = incoming.filter((item) => {
    const key = getKey(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  return unique.length ? [...current, ...unique] : current;
}

export function prependUniqueBy<T>(incoming: T[], current: T[], getKey: (item: T) => string): T[] {
  const currentKeys = new Set(current.map(getKey));
  const seen = new Set<string>();
  const unique = incoming.filter((item) => {
    const key = getKey(item);
    if (currentKeys.has(key) || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  return unique.length ? [...unique, ...current] : current;
}

export function uniqueBy<T>(items: T[], getKey: (item: T) => string): T[] {
  return appendUniqueBy([], items, getKey);
}
