import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Search, ShoppingBag, Loader2, CheckCircle2, MessageCircle, Clock, XCircle, PackageCheck } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import Seo from '@/components/Seo';

type TrackedOrder = {
  id: string;
  status: 'new' | 'contacted' | 'confirmed' | 'fulfilled' | 'cancelled';
  subtotal: number;
  currency: string;
  items: any[];
  created_at: string;
  updated_at: string;
  whatsapp_sent: boolean;
  customer_name: string;
};

const STATUS_META: Record<TrackedOrder['status'], { label: string; color: string; Icon: typeof Clock; hint: string }> = {
  new:       { label: 'Received',  color: 'bg-primary/10 text-primary border-primary/30',           Icon: Clock,         hint: 'We received your order and will reach out shortly.' },
  contacted: { label: 'Contacted', color: 'bg-gold/10 text-gold border-gold/30',                    Icon: MessageCircle, hint: 'Our team has reached out to confirm details.' },
  confirmed: { label: 'Confirmed', color: 'bg-blue-500/10 text-blue-500 border-blue-500/30',       Icon: CheckCircle2,  hint: 'Your order is confirmed and being prepared.' },
  fulfilled: { label: 'Fulfilled', color: 'bg-green-500/10 text-green-600 border-green-500/30',    Icon: PackageCheck,  hint: 'Your order is ready or delivered. Thank you!' },
  cancelled: { label: 'Cancelled', color: 'bg-destructive/10 text-destructive border-destructive/30', Icon: XCircle,    hint: 'This order was cancelled. Contact us if this is unexpected.' },
};

export default function TrackOrder() {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<TrackedOrder[] | null>(null);

  const search = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 5) {
      return toast.error('Enter a valid phone number');
    }
    setLoading(true);
    const { data, error } = await supabase.rpc('track_shop_orders', { _phone: phone });
    setLoading(false);
    if (error) {
      console.error(error);
      return toast.error('Could not load your orders. Please try again.');
    }
    setOrders((data as TrackedOrder[]) || []);
  };

  return (
    <div className="min-h-screen bg-background">
      <Seo
        title="Track your order — Salem Tailors"
        description="Check the status of your Salem Tailors shop order using the phone number you placed it with."
        path="/track"
      />

      <header className="border-b border-border bg-card/60 backdrop-blur sticky top-0 z-30">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Home
          </Link>
          <h1 className="font-serif text-lg font-semibold ml-auto">Track your order</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        <Card className="p-4">
          <form onSubmit={search} className="space-y-3">
            <div>
              <Label htmlFor="phone" className="text-sm">Phone number used at checkout</Label>
              <Input
                id="phone"
                inputMode="tel"
                placeholder="+260 9XX XXX XXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="h-11 mt-1"
                autoComplete="tel"
              />
              <p className="text-[11px] text-muted-foreground mt-1">
                We only show orders that match this exact phone number.
              </p>
            </div>
            <Button type="submit" disabled={loading} className="w-full gap-2">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              Find my orders
            </Button>
          </form>
        </Card>

        {orders !== null && orders.length === 0 && (
          <Card className="p-10 text-center">
            <ShoppingBag className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground text-sm">
              No orders found for that phone number. Double-check the number you entered at checkout.
            </p>
          </Card>
        )}

        {orders && orders.length > 0 && (
          <div className="space-y-3">
            {orders.map((o) => {
              const meta = STATUS_META[o.status];
              const Icon = meta.Icon;
              return (
                <Card key={o.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div>
                      <p className="text-xs text-muted-foreground">Ref #{o.id.slice(0, 8)}</p>
                      <p className="text-xs text-muted-foreground">
                        Placed {formatDistanceToNow(new Date(o.created_at), { addSuffix: true })}
                      </p>
                    </div>
                    <Badge variant="outline" className={`${meta.color} gap-1`}>
                      <Icon className="h-3 w-3" /> {meta.label}
                    </Badge>
                  </div>

                  <p className="text-xs bg-muted/40 rounded p-2">{meta.hint}</p>

                  <ul className="text-sm space-y-1 border-t border-border pt-2">
                    {o.items.map((i: any, idx: number) => (
                      <li key={idx} className="flex justify-between gap-2">
                        <span className="text-foreground">
                          {i.name}{i.variant_name ? ` (${i.variant_name})` : ''} × {i.qty}
                        </span>
                        <span className="text-muted-foreground shrink-0">
                          {i.price ? `${i.currency} ${(Number(i.price) * i.qty).toLocaleString()}` : 'Inquire'}
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

                  {o.updated_at !== o.created_at && (
                    <p className="text-[11px] text-muted-foreground">
                      Last update {formatDistanceToNow(new Date(o.updated_at), { addSuffix: true })}
                    </p>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
