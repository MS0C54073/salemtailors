import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ShoppingBag, Phone, Mail, MessageCircle, Loader2, Send } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

import { useShopOrderAlerts } from '@/hooks/useShopOrderAlerts';

type Order = {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  notes: string | null;
  items: any[];
  subtotal: number;
  currency: string;
  status: string;
  created_at: string;
};

const STATUSES = ['new', 'contacted', 'confirmed', 'fulfilled', 'cancelled'];

const statusColor: Record<string, string> = {
  new: 'bg-primary/10 text-primary border-primary/30',
  contacted: 'bg-gold/10 text-gold border-gold/30',
  confirmed: 'bg-blue-500/10 text-blue-500 border-blue-500/30',
  fulfilled: 'bg-green-500/10 text-green-500 border-green-500/30',
  cancelled: 'bg-destructive/10 text-destructive border-destructive/30',
};

const AdminShopOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const { markAllSeen } = useShopOrderAlerts(true);

  const load = async () => {
    setLoading(true);
    const q = supabase.from('shop_orders').select('*').order('created_at', { ascending: false });
    const { data } = filter === 'all' ? await q : await q.eq('status', filter as any);
    setOrders((data as Order[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [filter]);
  useEffect(() => { markAllSeen(); }, [markAllSeen, orders.length]);

  // Live refresh on new/updated orders
  useEffect(() => {
    const ch = supabase
      .channel('shop-orders-page')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shop_orders' }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from('shop_orders').update({ status: status as any }).eq('id', id);
    if (error) return toast.error(error.message);
    toast.success('Status updated');
    load();
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h1 className="font-serif text-2xl font-bold text-foreground">Shop Orders</h1>
            <p className="text-xs text-muted-foreground">Orders placed from the catalogue cart</p>
          </div>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-36 h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <Card className="p-10 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></Card>
        ) : orders.length === 0 ? (
          <Card className="p-10 text-center">
            <ShoppingBag className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No shop orders yet.</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {orders.map(o => {
              const waNumber = o.customer_phone.replace(/[^\d]/g, '');
              return (
                <Card key={o.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div>
                      <p className="font-semibold text-foreground">{o.customer_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(o.created_at), { addSuffix: true })}
                      </p>
                    </div>
                    <Badge variant="outline" className={statusColor[o.status] || ''}>{o.status}</Badge>
                  </div>

                  <div className="flex flex-wrap gap-3 text-xs">
                    <a href={`tel:${o.customer_phone}`} className="flex items-center gap-1 text-foreground hover:text-primary">
                      <Phone className="h-3 w-3" /> {o.customer_phone}
                    </a>
                    {o.customer_email && (
                      <a href={`mailto:${o.customer_email}`} className="flex items-center gap-1 text-foreground hover:text-primary">
                        <Mail className="h-3 w-3" /> {o.customer_email}
                      </a>
                    )}
                    <a href={`https://wa.me/${waNumber}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[#25D366] hover:underline">
                      <MessageCircle className="h-3 w-3" /> WhatsApp
                    </a>
                  </div>

                  <ul className="text-sm space-y-1 border-t border-border pt-2">
                    {o.items.map((i: any, idx: number) => (
                      <li key={idx} className="flex justify-between gap-2">
                        <span className="text-foreground">
                          {i.name}{i.variant_name ? ` (${i.variant_name})` : ''} × {i.qty}
                        </span>
                        <span className="text-muted-foreground shrink-0">
                          {i.price ? `${i.currency} ${(i.price * i.qty).toLocaleString()}` : 'Inquire'}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <div className="flex justify-between items-center border-t border-border pt-2">
                    <span className="text-sm font-semibold">Total</span>
                    <span className="text-lg font-bold text-primary">
                      {o.currency} {Number(o.subtotal).toLocaleString()}
                    </span>
                  </div>

                  {o.notes && (
                    <p className="text-xs bg-muted/40 rounded p-2 whitespace-pre-wrap">{o.notes}</p>
                  )}

                  <div className="flex gap-2">
                    <Select value={o.status} onValueChange={(v) => updateStatus(o.id, v)}>
                      <SelectTrigger className="h-8 text-xs flex-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminShopOrders;
