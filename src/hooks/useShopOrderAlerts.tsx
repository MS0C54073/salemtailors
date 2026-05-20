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

  const refresh = useCallback(async () => {
    if (!enabled) return;
    const since = new Date(lastSeenRef.current || 0).toISOString();
    const { count } = await supabase
      .from('shop_orders')
      .select('id', { count: 'exact', head: true })
      .gt('created_at', since);
    setUnread(count || 0);
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

    const channel = supabase
      .channel('shop-orders-alerts')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'shop_orders' },
        (payload) => {
          const row: any = payload.new;
          setUnread((u) => u + 1);
          playChime();
          toast.success('New shop order!', {
            description: `${row?.customer_name || 'Customer'} • ${row?.currency || 'ZMW'} ${Number(row?.subtotal || 0).toLocaleString()}`,
            duration: 8000,
            action: {
              label: 'View',
              onClick: () => { window.location.href = '/dashboard/admin/shop-orders'; },
            },
          });
          notify('New shop order', `${row?.customer_name || 'Customer'} placed an order`);
        })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [enabled, refresh]);

  return { unread, markAllSeen, refresh };
};
