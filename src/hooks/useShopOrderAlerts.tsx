import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const LAST_SEEN_KEY = 'shop_orders_last_seen_at';

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

export const useShopOrderAlerts = (enabled: boolean) => {
  const [unread, setUnread] = useState(0);
  const lastSeenRef = useRef<number>(getLastSeen());
  const knownIdsRef = useRef<Set<string>>(new Set());
  const primedRef = useRef(false);

  const refresh = useCallback(async () => {
    if (!enabled) return;
    const since = new Date(lastSeenRef.current || 0).toISOString();
    const { data, count } = await supabase
      .from('shop_orders')
      .select('id, customer_name, currency, subtotal, created_at', { count: 'exact' })
      .gt('created_at', since)
      .order('created_at', { ascending: false })
      .limit(50);
    setUnread(count || 0);

    // Surface a toast/chime for orders we haven't seen during this session.
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
  }, [enabled]);

  const markAllSeen = useCallback(() => {
    const now = Date.now();
    lastSeenRef.current = now;
    localStorage.setItem(LAST_SEEN_KEY, String(now));
    setUnread(0);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    refresh();

    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }

    // Poll instead of subscribing to realtime — shop_orders is no longer in the
    // realtime publication so order data isn't broadcast to other tabs.
    const interval = window.setInterval(() => { refresh(); }, 20000);
    return () => { window.clearInterval(interval); };
  }, [enabled, refresh]);

  return { unread, markAllSeen, refresh };
};
