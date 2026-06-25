import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// --- Mocks ----------------------------------------------------------------

vi.mock('sonner', () => ({ toast: { success: vi.fn() } }));

type QueryResult = { data?: any[]; count?: number; error?: any };
const nextResult = { value: { data: [], count: 0 } as QueryResult };
const queryCalls: number[] = [];
let resolveDelay: ((v: QueryResult) => void) | null = null;
let delayNextMs = 0;

vi.mock('@/integrations/supabase/client', () => {
  const builder = () => {
    const thenable: any = {
      select: () => thenable,
      gt: () => thenable,
      order: () => thenable,
      limit: () => thenable,
      then: (resolve: (v: QueryResult) => void) => {
        queryCalls.push(Date.now());
        if (delayNextMs > 0) {
          const ms = delayNextMs;
          delayNextMs = 0;
          resolveDelay = resolve;
          setTimeout(() => { resolveDelay = null; resolve(nextResult.value); }, ms);
        } else {
          resolve(nextResult.value);
        }
        return Promise.resolve();
      },
    };
    return thenable;
  };
  return { supabase: { from: () => builder() } };
});

// Lazy import after mocks
import { useShopOrderAlerts } from './useShopOrderAlerts';

beforeEach(() => {
  vi.useFakeTimers();
  queryCalls.length = 0;
  nextResult.value = { data: [], count: 0 };
  delayNextMs = 0;
  resolveDelay = null;
  localStorage.clear();
});

afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
});

describe('useShopOrderAlerts polling', () => {
  it('does nothing while disabled', async () => {
    renderHook(() => useShopOrderAlerts(false));
    await act(async () => { await vi.advanceTimersByTimeAsync(60_000); });
    expect(queryCalls).toHaveLength(0);
  });

  it('runs an immediate refresh then re-polls on the active interval', async () => {
    const { result } = renderHook(() => useShopOrderAlerts(true));
    await act(async () => { await vi.advanceTimersByTimeAsync(0); });
    expect(queryCalls.length).toBe(1);

    await act(async () => { await vi.advanceTimersByTimeAsync(15_000); });
    expect(queryCalls.length).toBe(2);

    expect(result.current.status).toBe('online');
    expect(result.current.lastUpdatedAt).not.toBeNull();
  });

  it('exposes a loading status while a request is inflight', async () => {
    delayNextMs = 2_000;
    const { result } = renderHook(() => useShopOrderAlerts(true));
    await act(async () => { await vi.advanceTimersByTimeAsync(50); });
    expect(result.current.status).toBe('loading');
    await act(async () => { await vi.advanceTimersByTimeAsync(2_000); });
    expect(result.current.status).toBe('online');
  });

  it('aborts a slow request after the 8s timeout and marks status offline', async () => {
    delayNextMs = 20_000; // never resolves within timeout
    const { result } = renderHook(() => useShopOrderAlerts(true));
    await act(async () => { await vi.advanceTimersByTimeAsync(8_100); });
    await waitFor(() => expect(result.current.status).toBe('offline'));
  });

  it('coalesces overlapping polls so a slow request does not pile up calls', async () => {
    delayNextMs = 30_000;
    renderHook(() => useShopOrderAlerts(true));
    await act(async () => { await vi.advanceTimersByTimeAsync(50); });
    const before = queryCalls.length;
    // advance through several would-be polls while the first is still inflight
    await act(async () => { await vi.advanceTimersByTimeAsync(45_000); });
    // request eventually times out at 8s, fails, and reschedules with backoff;
    // the key assertion: we did NOT fan out one request per tick.
    expect(queryCalls.length - before).toBeLessThanOrEqual(1);
  });

  it('applies exponential backoff after failures', async () => {
    nextResult.value = { error: new Error('boom') };
    const { result } = renderHook(() => useShopOrderAlerts(true));
    await act(async () => { await vi.advanceTimersByTimeAsync(0); });
    expect(result.current.status).toBe('offline');
    const after1 = queryCalls.length;

    // First backoff ~5s — well under the 15s active interval.
    await act(async () => { await vi.advanceTimersByTimeAsync(5_100); });
    expect(queryCalls.length).toBeGreaterThan(after1);
  });

  it('refreshes immediately when the tab becomes visible again', async () => {
    const { result } = renderHook(() => useShopOrderAlerts(true));
    await act(async () => { await vi.advanceTimersByTimeAsync(0); });
    const before = queryCalls.length;

    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' });
    await act(async () => {
      document.dispatchEvent(new Event('visibilitychange'));
      await vi.advanceTimersByTimeAsync(50);
    });
    expect(queryCalls.length).toBeGreaterThan(before);
    expect(result.current).toBeTruthy();
  });

  it('markAllSeen zeroes the unread count and persists last-seen', async () => {
    nextResult.value = { data: [], count: 3 };
    const { result } = renderHook(() => useShopOrderAlerts(true));
    await act(async () => { await vi.advanceTimersByTimeAsync(0); });
    expect(result.current.unread).toBe(3);

    act(() => result.current.markAllSeen());
    expect(result.current.unread).toBe(0);
    expect(localStorage.getItem('shop_orders_last_seen_at')).not.toBeNull();
  });
});
