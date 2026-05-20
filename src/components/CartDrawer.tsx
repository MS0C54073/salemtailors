import { useState } from 'react';
import { z } from 'zod';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ShoppingCart, Trash2, Plus, Minus, MessageCircle, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

import { useCart } from '@/contexts/CartContext';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

const ADMIN_WHATSAPP = '260979287496';

const checkoutSchema = z.object({
  customer_name: z.string().trim().min(1, 'Name is required').max(120),
  customer_phone: z.string().trim().min(5, 'Phone is required').max(30)
    .regex(/^[\d+\s()-]+$/, 'Phone can only contain digits, spaces and + - ( )'),
  customer_email: z.string().trim().email('Invalid email').max(255).optional().or(z.literal('')),
  notes: z.string().trim().max(2000).optional().or(z.literal('')),
});

export function CartButton() {
  const { count, setOpen } = useCart();
  return (
    <Button variant="outline" size="sm" className="relative gap-1.5" onClick={() => setOpen(true)} aria-label={`Cart, ${count} items`}>
      <ShoppingCart className="h-4 w-4" />
      <span className="hidden sm:inline">Cart</span>
      {count > 0 && (
        <span className="absolute -top-1.5 -right-1.5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full h-5 min-w-[20px] px-1 flex items-center justify-center">
          {count}
        </span>
      )}
    </Button>
  );
}

export default function CartDrawer() {
  const { items, count, subtotal, currency, open, setOpen, setQty, remove, clear } = useCart();
  const { user } = useAuth();
  const [form, setForm] = useState({ customer_name: '', customer_phone: '', customer_email: '', notes: '' });
  const [sending, setSending] = useState(false);

  const buildWhatsappMessage = (orderId?: string) => {
    const lines = [
      `🛍️ *New order from Salem Tailors shop*`,
      ``,
      `*Customer:* ${form.customer_name}`,
      `*Phone:* ${form.customer_phone}`,
      form.customer_email ? `*Email:* ${form.customer_email}` : null,
      ``,
      `*Items:*`,
      ...items.map(i =>
        `• ${i.name}${i.variantName ? ` (${i.variantName})` : ''} × ${i.qty}` +
        (i.price ? ` — ${i.currency} ${(i.price * i.qty).toLocaleString()}` : ' — price on inquiry')
      ),
      ``,
      `*Subtotal:* ${currency} ${subtotal.toLocaleString()}`,
      form.notes ? `\n*Notes:* ${form.notes}` : null,
      orderId ? `\n_Ref: ${orderId.slice(0, 8)}_` : null,
    ].filter(Boolean);
    return lines.join('\n');
  };

  const checkout = async () => {
    if (items.length === 0) return;
    const parsed = checkoutSchema.safeParse(form);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return toast.error(first.message);
    }
    setSending(true);
    const { data, error } = await supabase
      .from('shop_orders')
      .insert({
        customer_name: parsed.data.customer_name,
        customer_phone: parsed.data.customer_phone,
        customer_email: parsed.data.customer_email || null,
        notes: parsed.data.notes || null,
        items: items.map(i => ({
          item_id: i.itemId, variant_id: i.variantId || null,
          name: i.name, variant_name: i.variantName || null,
          slug: i.slug, qty: i.qty, price: i.price, currency: i.currency,
        })) as any,
        subtotal,
        currency,
        user_id: user?.id || null,
        whatsapp_sent: false,
      })
      .select('id')
      .single();
    if (error || !data) {
      setSending(false);
      console.error(error);
      return toast.error('Could not save order. Please try again.');
    }
    const msg = buildWhatsappMessage(data.id);
    const url = `https://wa.me/${ADMIN_WHATSAPP}?text=${encodeURIComponent(msg)}`;
    const opened = window.open(url, '_blank', 'noopener,noreferrer');
    // Only mark as sent if the WhatsApp link actually opened
    if (opened) {
      await supabase.from('shop_orders').update({ whatsapp_sent: true }).eq('id', data.id);
      toast.success('Order saved! Continuing on WhatsApp.');
    } else {
      toast.warning('Order saved, but WhatsApp could not open. Please retry from your orders.');
    }
    setSending(false);
    clear();
    setForm({ customer_name: '', customer_phone: '', customer_email: '', notes: '' });
    setOpen(false);

  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent className="w-full sm:max-w-md flex flex-col p-0">
        <SheetHeader className="px-4 py-3 border-b border-border">
          <SheetTitle className="font-serif text-xl">Your cart ({count})</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {items.length === 0 ? (
            <div className="text-center py-16">
              <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground text-sm">Your cart is empty.</p>
            </div>
          ) : (
            items.map(i => (
              <div key={i.id} className="flex gap-3 items-start border-b border-border pb-3">
                {i.image && (
                  <img src={i.image} alt={i.name} className="h-16 w-16 rounded-md object-cover bg-muted shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{i.name}</p>
                  {i.variantName && <p className="text-xs text-muted-foreground">{i.variantName}</p>}
                  <p className="text-sm font-bold text-primary mt-0.5">
                    {i.price ? `${i.currency} ${(i.price * i.qty).toLocaleString()}` : 'Inquire'}
                  </p>
                  <div className="flex items-center gap-1 mt-1.5">
                    <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => setQty(i.id, i.qty - 1)} aria-label="Decrease">
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="text-sm w-6 text-center font-medium">{i.qty}</span>
                    <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => setQty(i.id, i.qty + 1)} aria-label="Increase">
                      <Plus className="h-3 w-3" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 ml-auto text-destructive" onClick={() => remove(i.id)} aria-label="Remove">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-border px-4 py-3 space-y-3 bg-card/50">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-bold text-foreground">{currency} {subtotal.toLocaleString()}</span>
            </div>
            <div className="space-y-2">
              <div>
                <Label htmlFor="co-name" className="text-xs">Full name *</Label>
                <Input id="co-name" value={form.customer_name} onChange={e => setForm({ ...form, customer_name: e.target.value })} className="h-9" />
              </div>
              <div>
                <Label htmlFor="co-phone" className="text-xs">Phone (WhatsApp) *</Label>
                <Input id="co-phone" inputMode="tel" value={form.customer_phone} onChange={e => setForm({ ...form, customer_phone: e.target.value })} className="h-9" placeholder="+260…" />
              </div>
              <div>
                <Label htmlFor="co-email" className="text-xs">Email (optional)</Label>
                <Input id="co-email" type="email" value={form.customer_email} onChange={e => setForm({ ...form, customer_email: e.target.value })} className="h-9" />
              </div>
              <div>
                <Label htmlFor="co-notes" className="text-xs">Notes</Label>
                <Textarea id="co-notes" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} placeholder="Pickup, delivery, sizes…" />
              </div>
            </div>
            <Button onClick={checkout} disabled={sending} className="w-full gap-2 bg-[#25D366] hover:bg-[#25D366]/90 text-white">
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageCircle className="h-4 w-4" />}
              Send order via WhatsApp
            </Button>
            <p className="text-[10px] text-muted-foreground text-center">
              Your order is saved and forwarded to our team on WhatsApp for confirmation.{' '}
              <Link to="/track" onClick={() => setOpen(false)} className="underline hover:text-foreground">
                Track an existing order
              </Link>
            </p>

          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
