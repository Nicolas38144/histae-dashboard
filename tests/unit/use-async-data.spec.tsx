import { act, renderHook, waitFor } from '@testing-library/react';
import { useAsyncData } from '../../src/hooks/useAsyncData';

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

describe('useAsyncData', () => {
  it('exposes loading, result and normalized errors', async () => {
    const success = deferred<string>();
    const { result } = renderHook(() => useAsyncData(() => success.promise));
    expect(result.current).toMatchObject({ data: null, loading: true, error: null });

    act(() => success.resolve('ready'));
    await waitFor(() => expect(result.current).toMatchObject({ data: 'ready', loading: false, error: null }));
  });

  it('keeps the newest result when an older request finishes later', async () => {
    const first = deferred<string>();
    const second = deferred<string>();
    const { result, rerender } = renderHook(
      ({ loader }: { loader: () => Promise<string> }) => useAsyncData(loader),
      { initialProps: { loader: () => first.promise } },
    );

    rerender({ loader: () => second.promise });
    act(() => second.resolve('new result'));
    await waitFor(() => expect(result.current.data).toBe('new result'));
    act(() => first.resolve('stale result'));
    await waitFor(() => expect(result.current.data).toBe('new result'));
  });

  it('normalizes loader failures and supports an explicit reload', async () => {
    let attempts = 0;
    const loader = vi.fn(async () => {
      attempts += 1;
      if (attempts === 1) throw new Error('Échec contrôlé');
      return 'recovered';
    });
    const { result } = renderHook(() => useAsyncData(loader));

    await waitFor(() => expect(result.current.error).toBe('Échec contrôlé'));
    act(() => result.current.reload());
    await waitFor(() => expect(result.current).toMatchObject({ data: 'recovered', loading: false, error: null }));
    expect(loader).toHaveBeenCalledTimes(2);
  });
});
