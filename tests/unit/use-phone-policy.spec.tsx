import { act, renderHook } from '@testing-library/react';
import type { PhoneChange, PhoneEntry } from '../../src/api/phone-blocklist';
import { usePhonePolicy } from '../../src/features/phone-blocklist/use-phone-policy';

const api = vi.hoisted(() => ({ lookup: vi.fn(), change: vi.fn() }));
vi.mock('../../src/api/phone-blocklist', () => ({ lookupPhone: api.lookup, changePhonePolicy: api.change }));

const entry: PhoneEntry = {
  id: '90000000-0000-4000-8000-000000000001', phone_hint: '+33……0000',
  decision: 'automatic', decision_until: null, version: 3, blocked: true, observations: [],
};
const change: PhoneChange = { entry_id: entry.id!, decision: 'allow', version: entry.version, valid_days: 30 };

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => { resolve = done; });
  return { promise, resolve };
}

describe('phone policy operations', () => {
  beforeEach(() => {
    api.lookup.mockReset();
    api.change.mockReset();
  });

  it('ignores repeated lookups and writes while a lookup is pending', async () => {
    const response = deferred<PhoneEntry>();
    api.lookup.mockReturnValue(response.promise);
    const { result } = renderHook(() => usePhonePolicy(vi.fn()));
    let lookup!: Promise<void>;
    act(() => {
      lookup = result.current.search('synthetic-phone');
      void result.current.search('another-phone');
      void result.current.save(change);
    });
    expect(api.lookup).toHaveBeenCalledTimes(1);
    expect(api.change).not.toHaveBeenCalled();
    expect(result.current.looking).toBe(true);

    await act(async () => { response.resolve(entry); await lookup; });
    expect(result.current.review).toEqual({ entry, target: { entry_id: entry.id } });
    expect(result.current.looking).toBe(false);
  });

  it('submits once and keeps the review open until the write finishes', async () => {
    const response = deferred<void>();
    api.change.mockReturnValue(response.promise);
    const reload = vi.fn();
    const { result } = renderHook(() => usePhonePolicy(reload));
    act(() => result.current.open(entry));
    let write!: Promise<void>;
    act(() => {
      write = result.current.save(change);
      void result.current.save(change);
      result.current.close();
    });
    expect(api.change).toHaveBeenCalledExactlyOnceWith(change);
    expect(result.current.review?.entry).toEqual(entry);
    expect(result.current.saving).toBe(true);

    await act(async () => { response.resolve(); await write; });
    expect(reload).toHaveBeenCalledTimes(1);
    expect(result.current.review).toBeNull();
    expect(result.current.saving).toBe(false);
  });

  it('closes and rereads after an uncertain write without retrying it', async () => {
    const failure = new Error('uncertain write');
    api.change.mockRejectedValue(failure);
    const reload = vi.fn();
    const { result } = renderHook(() => usePhonePolicy(reload));
    act(() => result.current.open(entry));
    await act(() => result.current.save(change));
    expect(api.change).toHaveBeenCalledTimes(1);
    expect(reload).toHaveBeenCalledTimes(1);
    expect(result.current.review).toBeNull();
    expect(result.current.error).toBe(failure);
  });

  it('aborts a lookup on unmount and does not publish its late response', async () => {
    const response = deferred<PhoneEntry>();
    api.lookup.mockReturnValue(response.promise);
    const reload = vi.fn();
    const { result, unmount } = renderHook(() => usePhonePolicy(reload));
    let lookup!: Promise<void>;
    act(() => { lookup = result.current.search('synthetic-phone'); });
    const signal = api.lookup.mock.calls[0][1] as AbortSignal;
    unmount();
    expect(signal.aborted).toBe(true);
    await act(async () => { response.resolve(entry); await lookup; });
    expect(result.current.review).toBeNull();
    expect(reload).not.toHaveBeenCalled();
  });
});
