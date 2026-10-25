import { useLocale } from '../i18n/useLocale';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useListPosition } from './useListPosition';
import { useListRestoration } from './useListRestoration';
import { loadCursorPages, type CursorPage, type MergeCursorPage } from '../utils/cursor-pages';
export type { CursorPage } from '../utils/cursor-pages';
import { errorMessage } from '../api/client';
import { appendUniqueBy, uniqueBy } from '../utils/pagination';

export function useCursorPagination<T>(
  loader: (cursor: string | undefined, signal: AbortSignal) => Promise<CursorPage<T>>,
  getKey: (item: T) => string,
  mergePage: MergeCursorPage<T> = appendUniqueBy,
  memoryKey?: string,
) {
  const locale = useLocale();
  const viewKey = memoryKey ? JSON.stringify([memoryKey, locale]) : undefined;
  const restoration = useListRestoration(viewKey);
  const [items, setItems] = useState<T[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [loadMoreError, setLoadMoreError] = useState<unknown>(null);
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
      const page = await loadCursorPages({
        loader, cursor, signal: controller.signal, getKey, mergePage,
        depth: append ? 1 : restoration.readDepth(),
      });
      if (controller.signal.aborted || requestId !== requestSequence.current) return;
      restoration.rememberDepth(append ? restoration.readDepth() + 1 : page.depth);
      setItems((current) => append
        ? mergePage(current, page.items, getKey)
        : uniqueBy(page.items, getKey));
      setNextCursor(page.nextCursor);
    } catch (reason) {
      if (controller.signal.aborted || requestId !== requestSequence.current) return;
      if (append) setLoadMoreError(reason);
      else setError(reason);
    } finally {
      if (!controller.signal.aborted && requestId === requestSequence.current) {
        if (append) setLoadingMore(false);
        else setLoading(false);
      }
    }
  }, [getKey, loader, mergePage, restoration]);

  useEffect(() => {
    void load();
    return () => {
      activeController.current?.abort();
      requestSequence.current += 1;
    };
  }, [load, revision, locale]);

  useListPosition(viewKey, !loading && error === null);
  const reload = useCallback(() => {
    restoration.reset();
    setRevision(value => value + 1);
  }, [restoration]);
  const loadMore = useCallback(() => {
    if (nextCursor && !loading && !loadingMore) void load(nextCursor);
  }, [load, loading, loadingMore, nextCursor]);

  return {
    items,
    nextCursor,
    loading,
    loadingMore,
    error: error === null ? null : errorMessage(error),
    loadMoreError: loadMoreError === null ? null : errorMessage(loadMoreError),
    reload,
    loadMore,
  };
}
