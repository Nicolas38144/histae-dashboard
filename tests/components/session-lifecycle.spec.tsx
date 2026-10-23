import { act, renderHook } from '@testing-library/react';
import * as auth from '../../src/api/auth';
import { isAdminSessionLocked, notifyAdminSessionExpired, unlockAdminSession } from '../../src/auth/session';
import { ADMIN_IDLE_TIMEOUT_MS, ADMIN_SESSION_CHECK_INTERVAL_MS, useAdminSession } from '../../src/auth/useAdminSession';
import { adminSession } from '../fixtures';

describe('administrator session lifecycle', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible');
    vi.spyOn(auth, 'getAdminSession').mockResolvedValue(adminSession);
  });
  afterEach(() => vi.useRealTimers());

  async function mount() {
    const hook = renderHook(useAdminSession);
    await act(async () => {});
    expect(hook.result.current).toEqual(adminSession);
    return hook;
  }

  it('detects a remote revocation during periodic checks and requires a new login', async () => {
    const { result, unmount } = await mount();
    vi.mocked(auth.getAdminSession).mockRejectedValueOnce(new Error('revoked'));
    await act(() => vi.advanceTimersByTimeAsync(ADMIN_SESSION_CHECK_INTERVAL_MS));
    expect(result.current).toBeNull();
    expect(isAdminSessionLocked()).toBe(true);
    unmount();
    const calls = vi.mocked(auth.getAdminSession).mock.calls.length;
    const remounted = renderHook(useAdminSession);
    await act(async () => {});
    expect(remounted.result.current).toBeNull();
    expect(auth.getAdminSession).toHaveBeenCalledTimes(calls);
    remounted.unmount();
    unlockAdminSession();
    await mount();
  });

  it('conceals cached data in the background and revalidates before showing it again', async () => {
    const { result } = await mount();
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden');
    act(() => document.dispatchEvent(new Event('visibilitychange')));
    expect(result.current).toBeUndefined();
    await act(() => vi.advanceTimersByTimeAsync(ADMIN_SESSION_CHECK_INTERVAL_MS));
    expect(auth.getAdminSession).toHaveBeenCalledTimes(1);
    let resolve!: (value: typeof adminSession) => void;
    vi.mocked(auth.getAdminSession).mockReturnValueOnce(new Promise((done) => { resolve = done; }));
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible');
    act(() => document.dispatchEvent(new Event('visibilitychange')));
    expect(result.current).toBeUndefined();
    await act(async () => resolve(adminSession));
    expect(result.current).toEqual(adminSession);
  });

  it('ignores an old successful response after invalidation', async () => {
    const { result } = await mount();
    let resolve!: (value: typeof adminSession) => void;
    vi.mocked(auth.getAdminSession).mockReturnValueOnce(new Promise((done) => { resolve = done; }));
    await act(() => vi.advanceTimersByTimeAsync(ADMIN_SESSION_CHECK_INTERVAL_MS));
    await act(async () => {
      notifyAdminSessionExpired();
      resolve(adminSession);
    });
    expect(result.current).toBeNull();
  });

  it('locks after fifteen idle minutes even when background checks succeed', async () => {
    const { result } = await mount();
    await act(() => vi.advanceTimersByTimeAsync(ADMIN_IDLE_TIMEOUT_MS));
    expect(result.current).toBeNull();
  });

  it('extends the idle deadline on real interface activity', async () => {
    const { result } = await mount();
    await act(() => vi.advanceTimersByTimeAsync(ADMIN_IDLE_TIMEOUT_MS - 1));
    act(() => window.dispatchEvent(new Event('keydown')));
    await act(() => vi.advanceTimersByTimeAsync(ADMIN_IDLE_TIMEOUT_MS - 1));
    expect(result.current).toEqual(adminSession);
    await act(() => vi.advanceTimersByTimeAsync(1));
    expect(result.current).toBeNull();
  });

  it('does not revive the view after browser timers were suspended past the idle deadline', async () => {
    const { result } = await mount();
    vi.setSystemTime(Date.now() + ADMIN_IDLE_TIMEOUT_MS + 1);
    act(() => window.dispatchEvent(new Event('pointerdown')));
    expect(result.current).toBeNull();
  });

  it('fails closed on focus if the server cannot verify the session', async () => {
    const { result } = await mount();
    vi.mocked(auth.getAdminSession).mockRejectedValueOnce(new Error('offline'));
    await act(async () => window.dispatchEvent(new Event('focus')));
    expect(result.current).toBeNull();
  });

  it('hides the view before a page enters the back-forward cache and checks it on restoration', async () => {
    const { result } = await mount();
    act(() => window.dispatchEvent(new Event('pagehide')));
    expect(result.current).toBeUndefined();
    vi.mocked(auth.getAdminSession).mockRejectedValueOnce(new Error('revoked'));
    await act(async () => window.dispatchEvent(new Event('pageshow')));
    expect(result.current).toBeNull();
  });

  it('aborts pending checks and removes its timers on unmount', async () => {
    vi.mocked(auth.getAdminSession).mockReturnValue(new Promise(() => {}));
    const { unmount } = renderHook(useAdminSession);
    const signal = vi.mocked(auth.getAdminSession).mock.calls[0][0];
    unmount();
    expect(signal?.aborted).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
  });
});
