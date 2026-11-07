import { act, renderHook } from '@testing-library/react';
import type { PhoneEntry } from '../../src/api/phone-blocklist';
import { usePhoneSearch } from '../../src/features/phone-blocklist/use-phone-search';

const lookup = vi.hoisted(() => vi.fn());
vi.mock('../../src/api/phone-blocklist', () => ({ lookupPhone: lookup }));
const phone = '+33600000000';
const entry: PhoneEntry = { id: 'entry', phone_hint: '+33……0000', decision: 'automatic', decision_until: null, version: 1, blocked: true, observations: [] };

describe('dynamic phone search', () => {
  beforeEach(() => { vi.useFakeTimers(); lookup.mockReset(); });
  afterEach(() => vi.useRealTimers());

  it('waits for a complete number and a 400 ms pause before looking it up', async () => {
    lookup.mockResolvedValue(entry);
    const { result, rerender } = renderHook(({ phone }) => usePhoneSearch(phone, 0), { initialProps: { phone: '+33' } });
    await act(() => vi.advanceTimersByTimeAsync(500));
    expect(lookup).not.toHaveBeenCalled();
    rerender({ phone });
    await act(() => vi.advanceTimersByTimeAsync(399));
    expect(lookup).not.toHaveBeenCalled();
    expect(result.current.loading).toBe(true);
    await act(() => vi.advanceTimersByTimeAsync(1));
    expect(lookup).toHaveBeenCalledExactlyOnceWith(phone, expect.any(AbortSignal));
    expect(result.current.entry).toEqual(entry);
  });

  it('cancels a previous request and ignores its late response', async () => {
    let resolveFirst!: (entry: PhoneEntry) => void;
    lookup.mockReturnValueOnce(new Promise<PhoneEntry>((resolve) => { resolveFirst = resolve; })).mockResolvedValue({ ...entry, id: 'latest' });
    const { result, rerender } = renderHook(({ phone }) => usePhoneSearch(phone, 0), { initialProps: { phone } });
    await act(() => vi.advanceTimersByTimeAsync(400));
    const signal = lookup.mock.calls[0][1] as AbortSignal;
    rerender({ phone: '+33700000000' });
    expect(signal.aborted).toBe(true);
    expect(result.current.entry).toBeNull();
    await act(() => vi.advanceTimersByTimeAsync(400));
    await act(async () => { resolveFirst(entry); });
    expect(result.current.entry?.id).toBe('latest');
  });

  it('clears results immediately and cancels delayed searches when the field is cleared', async () => {
    lookup.mockResolvedValue(entry);
    const { result, rerender, unmount } = renderHook(({ phone }) => usePhoneSearch(phone, 0), { initialProps: { phone } });
    await act(() => vi.advanceTimersByTimeAsync(200));
    rerender({ phone: '' });
    await act(() => vi.advanceTimersByTimeAsync(400));
    expect(lookup).not.toHaveBeenCalled();
    expect(result.current.active).toBe(false);
    expect(result.current.entry).toBeNull();
    rerender({ phone });
    unmount();
    await act(() => vi.advanceTimersByTimeAsync(400));
    expect(lookup).not.toHaveBeenCalled();
  });

  it('rereads the same phone on refresh and keeps lookup failures visible', async () => {
    const error = new Error('unavailable');
    lookup.mockRejectedValueOnce(error).mockResolvedValue(entry);
    const { result, rerender } = renderHook(({ revision }) => usePhoneSearch(phone, revision), { initialProps: { revision: 0 } });
    await act(() => vi.advanceTimersByTimeAsync(400));
    expect(result.current.error).toBe(error);
    expect(result.current.loading).toBe(false);
    rerender({ revision: 1 });
    await act(() => vi.advanceTimersByTimeAsync(400));
    expect(result.current.error).toBeNull();
    expect(result.current.entry).toEqual(entry);
    expect(lookup).toHaveBeenCalledTimes(2);
  });
});
