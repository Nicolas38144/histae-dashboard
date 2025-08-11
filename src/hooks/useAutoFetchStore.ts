import { useEffect, useRef } from 'react';

type UseAutoFetchStoreOptions<T> = {
  lastFetched: T;
  fetchFn: () => void | Promise<void>;
  maxAge: number;
  deps?: any[]; 
  persistKey?: string | null;
};

function shallowDepsEqual(a: any[] | null, b: any[]) {
  if (!a) return false;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

export function useAutoFetchStore<T extends number | null>({
  lastFetched,
  fetchFn,
  maxAge,
  deps = [],
  persistKey = null,
}: UseAutoFetchStoreOptions<T>) {
  const readPersistedDeps = (): any[] | null => {
    if (!persistKey) return null;
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem(`useAutoFetchStore:lastDeps:${persistKey}`);
      return raw ? JSON.parse(raw) : null;
    } catch (err) {
      return null;
    }
  };

  const lastDepsRef = useRef<any[] | null>(readPersistedDeps());

  useEffect(() => {
    const now = Date.now();
    const tooOld = !lastFetched || now - lastFetched > maxAge;

    const hasPrevDeps = lastDepsRef.current !== null;
    const depsChanged = !shallowDepsEqual(lastDepsRef.current, deps);
    const shouldFetch = hasPrevDeps ? (tooOld || depsChanged) : tooOld;

    if (shouldFetch) {
      void fetchFn();

      lastDepsRef.current = deps;
      if (persistKey && typeof window !== 'undefined') {
        try {
          localStorage.setItem(
            `useAutoFetchStore:lastDeps:${persistKey}`,
            JSON.stringify(deps)
          );
        } catch (err) {
          console.error(err);
        }
      }
    }
  }, [lastFetched, fetchFn, maxAge, ...deps]);
}
