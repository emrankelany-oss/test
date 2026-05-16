export function createLruCache(capacity, onEvict) {
  const map = new Map(); // Map preserves insertion order

  return {
    get(key) {
      if (!map.has(key)) return undefined;
      const v = map.get(key);
      map.delete(key);
      map.set(key, v); // mark most-recent
      return v;
    },
    set(key, value) {
      if (map.has(key)) map.delete(key);
      map.set(key, value);
      while (map.size > capacity) {
        const oldestKey = map.keys().next().value;
        const oldestVal = map.get(oldestKey);
        map.delete(oldestKey);
        if (onEvict) onEvict(oldestKey, oldestVal);
      }
    },
    has(key) {
      return map.has(key);
    },
    get size() {
      return map.size;
    },
    clear() {
      if (onEvict) for (const [k, v] of map) onEvict(k, v);
      map.clear();
    },
  };
}
