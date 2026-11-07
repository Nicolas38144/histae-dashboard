import { getUserNames } from '../api/admin';

const MAX_CACHED_NAMES = 1_000;
const NAME_TTL_MS = 5 * 60_000;
const MISSING_NAME_TTL_MS = 30_000;
const cache = new Map<string, { name: string | null; expiresAt: number }>();
const pending = new Map<string, { promise: Promise<string | null>; resolve: (name: string | null) => void }>();
const queued = new Set<string>();
let scheduled = false;
let generation = 0;

function cacheName(id: string, name: string | null): void {
  const now = Date.now();
  cache.delete(id);
  cache.set(id, { name, expiresAt: now + (name === null ? MISSING_NAME_TTL_MS : NAME_TTL_MS) });
  if (cache.size > MAX_CACHED_NAMES) cache.delete(cache.keys().next().value!);
}

function schedule(): void {
  if (scheduled) return;
  scheduled = true;
  window.setTimeout(() => void flush(), 0);
}

async function flush(): Promise<void> {
  scheduled = false;
  const currentGeneration = generation;
  const ids = [...queued].slice(0, 100);
  ids.forEach((id) => queued.delete(id));
  if (queued.size) schedule();
  if (!ids.length) return;

  let names: Map<string, string | null> | null = null;
  try {
    names = new Map((await getUserNames(ids)).map((user) => [user.user_id.toLowerCase(), user.firstname]));
  } catch {
    // A failed lookup can be retried when the link is mounted again.
  }
  if (currentGeneration !== generation) return;
  const now = Date.now();
  for (const [key, entry] of cache) {
    if (entry.expiresAt <= now) cache.delete(key);
  }
  ids.forEach((id) => {
    const name = names?.get(id) ?? null;
    if (names) cacheName(id, name);
    pending.get(id)?.resolve(name);
    pending.delete(id);
  });
}

export function resolveUserName(id: string): Promise<string | null> {
  const key = id.toLowerCase();
  const cached = cache.get(key);
  if (cached) {
    cache.delete(key);
    if (cached.expiresAt > Date.now()) {
      // Keep recently used entries when the bounded cache reaches capacity.
      cache.set(key, cached);
      return Promise.resolve(cached.name);
    }
  }
  const existing = pending.get(key);
  if (existing) return existing.promise;

  let resolve!: (name: string | null) => void;
  const promise = new Promise<string | null>((done) => { resolve = done; });
  pending.set(key, { promise, resolve });
  queued.add(key);
  schedule();
  return promise;
}

export function clearUserNames(): void {
  generation += 1;
  cache.clear();
  queued.clear();
  pending.forEach(({ resolve }) => resolve(null));
  pending.clear();
}
