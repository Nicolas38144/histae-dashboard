import { getUserNames } from '../api/admin';

const cache = new Map<string, string | null>();
const pending = new Map<string, { promise: Promise<string | null>; resolve: (name: string | null) => void }>();
const queued = new Set<string>();
let scheduled = false;
let generation = 0;

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
  ids.forEach((id) => {
    const name = names?.get(id) ?? null;
    if (names) cache.set(id, name);
    pending.get(id)?.resolve(name);
    pending.delete(id);
  });
}

export function resolveUserName(id: string): Promise<string | null> {
  const key = id.toLowerCase();
  if (cache.has(key)) return Promise.resolve(cache.get(key) ?? null);
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
