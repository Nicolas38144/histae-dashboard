import { getUserNames } from '../api/admin';

const MAX_CACHED_NAMES = 1_000;
const NAME_TTL_MS = 5 * 60_000;
const MISSING_NAME_TTL_MS = 30_000;
type ResolvedUserName = { status: 'found'; firstname: string | null } | { status: 'missing' };
export type UserNameResult = ResolvedUserName | { status: 'unresolved' };

const cache = new Map<string, { result: ResolvedUserName; expiresAt: number }>();
const pending = new Map<string, { promise: Promise<UserNameResult>; resolve: (result: UserNameResult) => void }>();
const queued = new Set<string>();
let scheduled = false;
let generation = 0;

function cacheName(id: string, result: ResolvedUserName): void {
  const ttl = result.status === 'found' && result.firstname !== null ? NAME_TTL_MS : MISSING_NAME_TTL_MS;
  cache.delete(id);
  cache.set(id, { result, expiresAt: Date.now() + ttl });
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
    const firstname = names?.get(id);
    const result: UserNameResult = firstname !== undefined ? { status: 'found', firstname }
      : names ? { status: 'missing' } : { status: 'unresolved' };
    if (result.status !== 'unresolved') cacheName(id, result);
    pending.get(id)?.resolve(result);
    pending.delete(id);
  });
}

export function resolveUserName(id: string): Promise<UserNameResult> {
  const key = id.toLowerCase();
  const cached = cache.get(key);
  if (cached) {
    cache.delete(key);
    if (cached.expiresAt > Date.now()) {
      // Keep recently used entries when the bounded cache reaches capacity.
      cache.set(key, cached);
      return Promise.resolve(cached.result);
    }
  }
  const existing = pending.get(key);
  if (existing) return existing.promise;

  let resolve!: (result: UserNameResult) => void;
  const promise = new Promise<UserNameResult>((done) => { resolve = done; });
  pending.set(key, { promise, resolve });
  queued.add(key);
  schedule();
  return promise;
}

export function clearUserNames(): void {
  generation += 1;
  cache.clear();
  queued.clear();
  pending.forEach(({ resolve }) => resolve({ status: 'unresolved' }));
  pending.clear();
}
