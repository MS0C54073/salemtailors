import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const LAST_SEEN_KEY = 'shop_orders_last_seen_at';

// Tuned for low-bandwidth networks: short active interval so the UI still feels
// real-time, longer interval when the tab is hidden, exponential backoff on
// failure, hard request timeout so a stalled fetch never blocks the next tick.
const ACTIVE_POLL_MS = 15_000;
const HIDDEN_POLL_MS = 60_000;
const REQUEST_TIMEOUT_MS = 8_000;
const BACKOFF_BASE_MS = 5_000;
const BACKOFF_MAX_MS = 120_000;

const getLastSeen = (): number => {
  const v = localStorage.getItem(LAST_SEEN_KEY);
  return v ? Number(v) : 0;
};

const playChime = () => {
  try {
    const Ctx = (window.AudioContext || (window as any).webkitAudioContext);
    if (!Ctx) return;
    const ctx = new Ctx();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.type = 'sine';
    o.frequency.setValueAtTime(880, ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.18);
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.4);
    o.start(); o.stop(ctx.currentTime + 0.42);
  } catch { /* ignore */ }
};

const notify = (title: string, body: string) => {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission === 'granted') {
    try { new Notification(title, { body, icon: '/favicon.ico', tag: 'shop-order' }); } catch { /* ignore */ }
  }
};

const withTimeout = <T,>(p: PromiseLike<T>, ms: number): Promise<T> =>
  new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('timeout')), ms);
    Promise.resolve(p).then(
      (v) => { clearTimeout(t); resolve(v); },
      (e) => { clearTimeout(t); reject(e); },
    );
  });

export type ShopOrderAlertsStatus = 'idle' | 'loading' | 'online' | 'offline';

export const useShopOrderAlerts = (enabled: boolean) => {
  const [unread, setUnread] = useState(0);
  const [status, setStatus] = useState<ShopOrderAlertsStatus>('idle');
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);

  const lastSeenRef = useRef<number>(getLastSeen());
  const knownIdsRef = useRef<Set<string>>(new Set());
  const primedRef = useRef(false);
  const inflightRef = useRef(false);
  const failuresRef = useRef(0);
  const timerRef = useRef<number | null>(null);
  const mountedRef = useRef(true);

  const clearTimer = () => {
    if (timerRef.current != null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const scheduleNext = useCallback((overrideMs?: number) => {
    clearTimer();
    if (!enabled || !mountedRef.current) return;
    const base = document.visibilityState === 'hidden' ? HIDDEN_POLL_MS : ACTIVE_POLL_MS;
    const backoff = failuresRef.current > 0
      ? Math.min(BACKOFF_MAX_MS, BACKOFF_BASE_MS * 2 ** (failuresRef.current - 1))
      : 0;
    const delay = overrideMs ?? Math.max(base, backoff);
    timerRef.current = window.setTimeout(() => { void refresh(); }, delay);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  const refresh = useCallback(async () => {
    if (!enabled) return;
    // Coalesce overlapping polls — important on slow networks where a request
    // can outlast the polling interval.
    if (inflightRef.current) return;
    inflightRef.current = true;
    if (mountedRef.current) setStatus('loading');

    const since = new Date(lastSeenRef.current || 0).toISOString();
    try {
      const { data, count, error } = await withTimeout(
        supabase
          .from('shop_orders')
          .select('id, customer_name, currency, subtotal, created_at', { count: 'exact' })
          .gt('created_at', since)
          .order('created_at', { ascending: false })
          .limit(50),
        REQUEST_TIMEOUT_MS,
      );

      if (error) throw error;
      if (!mountedRef.current) return;

      failuresRef.current = 0;
      setStatus('online');
      setLastUpdatedAt(Date.now());
      setUnread(count || 0);

      if (primedRef.current && data?.length) {
        for (const row of data) {
          if (knownIdsRef.current.has(row.id)) continue;
          knownIdsRef.current.add(row.id);
          playChime();
          toast.success('New shop order!', {
            description: `${row.customer_name || 'Customer'} • ${row.currency || 'ZMW'} ${Number(row.subtotal || 0).toLocaleString()}`,
            duration: 8000,
            action: {
              label: 'View',
              onClick: () => { window.location.href = '/dashboard/admin/shop-orders'; },
            },
          });
          notify('New shop order', `${row.customer_name || 'Customer'} placed an order`);
        }
      } else if (data?.length) {
        data.forEach(r => knownIdsRef.current.add(r.id));
      }
      primedRef.current = true;
    } catch (err) {
      if (!mountedRef.current) return;
      failuresRef.current = Math.min(failuresRef.current + 1, 8);
      setStatus('offline');
      // Quiet failure — admin badge just stays stale until the next tick.
      // eslint-disable-next-line no-console
      console.warn('[shop-order alerts] poll failed', (err as Error)?.message || err);
    } finally {
      inflightRef.current = false;
      if (mountedRef.current) scheduleNext();
    }
  }, [enabled, scheduleNext]);

  const markAllSeen = useCallback(() => {
    const now = Date.now();
    lastSeenRef.current = now;
    localStorage.setItem(LAST_SEEN_KEY, String(now));
    setUnread(0);
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    if (!enabled) return;

    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }

    // Kick off an immediate refresh, then let the polling loop chain itself.
    void refresh();

    // When the tab/window regains focus or comes online, refresh right away so
    // the badge feels live without waiting up to a full interval.
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        scheduleNext(0);
      } else {
        scheduleNext();
      }
    };
    const onOnline = () => { failuresRef.current = 0; scheduleNext(0); };
    const onFocus = () => { scheduleNext(0); };

    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('online', onOnline);
    window.addEventListener('focus', onFocus);

    return () => {
      mountedRef.current = false;
      clearTimer();
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('online', onOnline);
      window.removeEventListener('focus', onFocus);
    };
  }, [enabled, refresh, scheduleNext]);

  return { unread, markAllSeen, refresh, status, lastUpdatedAt };
};
