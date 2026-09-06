import { useCallback, useEffect, useRef, useState } from 'react';
import { errorMessage } from '../api/client';
import { appendUniqueBy, uniqueBy } from '../utils/pagination';

export type CursorPage<T> = {
  items: T[];
  nextCursor: string | null;
};

export type MergeCursorPage<T> = (
  current: T[],
  incoming: T[],
  getKey: (item: T) => string,
) => T[];

export function useCursorPagination<T>(
  loader: (cursor: string | undefined, signal: AbortSignal) => Promise<CursorPage<T>>,
  getKey: (item: T) => string,
  mergePage: MergeCursorPage<T> = appendUniqueBy,
) {
  const [items, setItems] = useState<T[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  const requestSequence = useRef(0);
  const activeController = useRef<AbortController | null>(null);

  const load = useCallback(async (cursor?: string) => {
    const append = cursor !== undefined;
    const requestId = ++requestSequence.current;
    activeController.current?.abort();
    const controller = new AbortController();
    activeController.current = controller;

    if (append) {
      setLoadingMore(true);
      setLoadMoreError(null);
    } else {
      setLoading(true);
      setLoadingMore(false);
      setError(null);
      setLoadMoreError(null);
    }

    try {
      const page = await loader(cursor, controller.signal);
      if (controller.signal.aborted || requestId !== requestSequence.current) return;
      setItems((current) => append
        ? mergePage(current, page.items, getKey)
        : uniqueBy(page.items, getKey));
      setNextCursor(page.nextCursor);
    } catch (reason) {
      if (controller.signal.aborted || requestId !== requestSequence.current) return;
      if (append) setLoadMoreError(errorMessage(reason));
      else setError(errorMessage(reason));
    } finally {
      if (!controller.signal.aborted && requestId === requestSequence.current) {
        if (append) setLoadingMore(false);
        else setLoading(false);
      }
    }
  }, [getKey, loader, mergePage]);

  useEffect(() => {
    void load();
    return () => {
      activeController.current?.abort();
      requestSequence.current += 1;
    };
  }, [load, revision]);

  const reload = useCallback(() => setRevision((value) => value + 1), []);
  const loadMore = useCallback(() => {
    if (nextCursor && !loading && !loadingMore) void load(nextCursor);
  }, [load, loading, loadingMore, nextCursor]);

  return {
    items,
    nextCursor,
    loading,
    loadingMore,
    error,
    loadMoreError,
    reload,
    loadMore,
  };
}
