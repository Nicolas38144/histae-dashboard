import { useEffect } from 'react';

type UseAutoFetchStoreOptions<T> = {
  lastFetched: T;
  fetchFn: () => void | Promise<void>;
  maxAge: number;
};

export function useAutoFetchStore<T extends number | null>({
  lastFetched,
  fetchFn,
  maxAge,
}: UseAutoFetchStoreOptions<T>) {
  useEffect(() => {
    const now = Date.now();

    const shouldFetch = !lastFetched || now - lastFetched > maxAge;

    if (shouldFetch) {
      void fetchFn();
    }
  }, [lastFetched, fetchFn, maxAge]);
}
