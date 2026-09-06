import { act, renderHook, waitFor } from '@testing-library/react';
import type { CursorPage } from '../../src/hooks/useCursorPagination';
import { useCursorPagination } from '../../src/hooks/useCursorPagination';

type Item = { id: string; label: string };
const itemKey = (item: Item) => item.id;

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
}

describe('useCursorPagination', () => {
  it('represents an empty first and final page without offering another request', async () => {
    const loader = vi.fn(async (): Promise<CursorPage<Item>> => ({ items: [], nextCursor: null }));
    const { result } = renderHook(() => useCursorPagination(loader, itemKey));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.items).toEqual([]);
    expect(result.current.nextCursor).toBeNull();
    act(() => result.current.loadMore());
    expect(loader).toHaveBeenCalledOnce();
  });

  it('loads intermediate and final pages while deduplicating overlaps', async () => {
    const loader = vi.fn(async (cursor?: string): Promise<CursorPage<Item>> => {
      if (!cursor) return { items: [{ id: 'one', label: 'One' }, { id: 'two', label: 'Two' }], nextCursor: 'page-2' };
      if (cursor === 'page-2') return { items: [{ id: 'two', label: 'Duplicate' }, { id: 'three', label: 'Three' }], nextCursor: 'page-3' };
      return { items: [{ id: 'four', label: 'Four' }], nextCursor: null };
    });
    const { result } = renderHook(() => useCursorPagination(loader, itemKey));

    await waitFor(() => expect(result.current.nextCursor).toBe('page-2'));
    act(() => result.current.loadMore());
    await waitFor(() => expect(result.current.nextCursor).toBe('page-3'));
    expect(result.current.items.map((item) => item.id)).toEqual(['one', 'two', 'three']);
    act(() => result.current.loadMore());
    await waitFor(() => expect(result.current.nextCursor).toBeNull());
    expect(result.current.items.map((item) => item.id)).toEqual(['one', 'two', 'three', 'four']);
    expect(loader.mock.calls.map(([cursor]) => cursor)).toEqual([undefined, 'page-2', 'page-3']);
  });

  it('keeps the loaded page when a cursor is refused and can restart from the beginning', async () => {
    let initialLoads = 0;
    const loader = vi.fn(async (cursor?: string): Promise<CursorPage<Item>> => {
      if (cursor) throw new Error('Curseur refusé');
      initialLoads += 1;
      return initialLoads === 1
        ? { items: [{ id: 'one', label: 'Initial result' }], nextCursor: 'expired-cursor' }
        : { items: [{ id: 'fresh', label: 'Fresh result' }], nextCursor: null };
    });
    const { result } = renderHook(() => useCursorPagination(loader, itemKey));

    await waitFor(() => expect(result.current.nextCursor).toBe('expired-cursor'));
    act(() => result.current.loadMore());
    await waitFor(() => expect(result.current.loadMoreError).toBe('Curseur refusé'));
    expect(result.current.items.map((item) => item.id)).toEqual(['one']);

    act(() => result.current.reload());
    await waitFor(() => expect(result.current.items.map((item) => item.id)).toEqual(['fresh']));
    expect(result.current).toMatchObject({ nextCursor: null, loadMoreError: null, error: null });
  });

  it('ignores a response from a filter that is no longer active', async () => {
    const oldPage = deferred<CursorPage<Item>>();
    const newPage = deferred<CursorPage<Item>>();
    const oldLoader = vi.fn(() => oldPage.promise);
    const newLoader = vi.fn(() => newPage.promise);
    const { result, rerender } = renderHook(
      ({ loader }: { loader: typeof oldLoader }) => useCursorPagination(loader, itemKey),
      { initialProps: { loader: oldLoader } },
    );

    rerender({ loader: newLoader });
    act(() => newPage.resolve({ items: [{ id: 'new', label: 'New filter' }], nextCursor: null }));
    await waitFor(() => expect(result.current.items.map((item) => item.id)).toEqual(['new']));
    act(() => oldPage.resolve({ items: [{ id: 'old', label: 'Old filter' }], nextCursor: null }));
    await waitFor(() => expect(result.current.items.map((item) => item.id)).toEqual(['new']));
  });
});
