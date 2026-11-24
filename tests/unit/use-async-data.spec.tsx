import { act, renderHook, waitFor } from '@testing-library/react';
import { useAsyncData } from '../../src/hooks/useAsyncData';

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => { resolve = done; });
  return { promise, resolve };
}

describe('useAsyncData', () => {
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
    expect(result.current).toMatchObject({ data: null, loading: true, error: null });

    await waitFor(() => expect(result.current.error).toBe('Une erreur inattendue est survenue.'));
    act(() => result.current.reload());
    await waitFor(() => expect(result.current).toMatchObject({ data: 'recovered', loading: false, error: null }));
    expect(loader).toHaveBeenCalledTimes(2);
  });
});
