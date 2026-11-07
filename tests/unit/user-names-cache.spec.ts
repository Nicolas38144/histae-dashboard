import { clearUserNames, resolveUserName } from '../../src/utils/userNames';

const lookup = vi.hoisted(() => vi.fn());
vi.mock('../../src/api/admin', () => ({ getUserNames: lookup }));

async function resolve(id: string) {
  const result = resolveUserName(id);
  await vi.runAllTimersAsync();
  return result;
}

describe('session-only name cache', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    clearUserNames();
    lookup.mockReset().mockImplementation(async (ids: string[]) => ids.map((user_id) => ({ user_id, firstname: 'Alice' })));
  });
  afterEach(async () => {
    clearUserNames();
    await vi.runAllTimersAsync();
    vi.useRealTimers();
  });

  it('shares pending lookups and reuses names for five minutes', async () => {
    const first = resolveUserName('USER-A');
    expect(resolveUserName('user-a')).toBe(first);
    await vi.runAllTimersAsync();
    await expect(first).resolves.toBe('Alice');
    await expect(resolveUserName('user-a')).resolves.toBe('Alice');
    expect(lookup).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(5 * 60_000);
    lookup.mockResolvedValue([{ user_id: 'user-a', firstname: 'Updated' }]);
    expect(await resolve('user-a')).toBe('Updated');
    expect(lookup).toHaveBeenCalledTimes(2);
  });

  it('only retains missing names for thirty seconds and never caches failures', async () => {
    lookup.mockResolvedValueOnce([]).mockRejectedValueOnce(new Error('unavailable'));
    expect(await resolve('missing')).toBeNull();
    await expect(resolveUserName('missing')).resolves.toBeNull();
    expect(lookup).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(30_000);
    expect(await resolve('missing')).toBeNull();
    expect(await resolve('missing')).toBe('Alice');
    expect(lookup).toHaveBeenCalledTimes(3);
  });

  it('caps the cache at one thousand names and evicts the least recently used entry', async () => {
    const initial = Array.from({ length: 1_000 }, (_, index) => resolveUserName(`user-${index}`));
    await vi.runAllTimersAsync();
    await Promise.all(initial);
    expect(lookup.mock.calls.every(([ids]) => ids.length <= 100)).toBe(true);
    await resolveUserName('user-0');
    await resolve('extra');
    lookup.mockClear();
    await resolveUserName('user-0');
    expect(lookup).not.toHaveBeenCalled();
    await resolve('user-1');
    expect(lookup).toHaveBeenCalledExactlyOnceWith(['user-1']);
  });

  it('discards late responses after session cache invalidation', async () => {
    let complete!: (users: Array<{ user_id: string; firstname: string }>) => void;
    lookup.mockReturnValueOnce(new Promise((done) => { complete = done; }));
    const pending = resolveUserName('user-a');
    await vi.runAllTimersAsync();
    clearUserNames();
    await expect(pending).resolves.toBeNull();
    complete([{ user_id: 'user-a', firstname: 'Private old name' }]);
    await vi.runAllTimersAsync();
    expect(await resolve('user-a')).toBe('Alice');
    expect(lookup).toHaveBeenCalledTimes(2);
  });
});
