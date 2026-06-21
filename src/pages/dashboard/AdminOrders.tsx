import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { GARMENT_CATEGORIES, getCategoryLabel } from '@/lib/supabase-helpers';
import { ORDER_STATUS_FLOW, formatKwacha, whatsappLink, buildStatusMessage, buildPickupMessage, formatDate, formatDateTime } from '@/lib/admin-helpers';
import { toCSV, downloadCSV } from '@/lib/csv-export';
import { Download } from 'lucide-react';
import { toast } from 'sonner';
import { Plus, MessageCircle, Phone, Image as ImageIcon, Loader2, X } from 'lucide-react';
import SignedImage from '@/components/SignedImage';
import { validateImageFile, ImageValidationError, safeStorageName, scanUploadedFile } from '@/lib/image-validation';


const getStatusFlow = (s: string) => ORDER_STATUS_FLOW.find(x => x.value === s) || ORDER_STATUS_FLOW[0];

const AdminOrders = () => {
  const { user, role } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [filter, setFilter] = useState('all');
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const [form, setForm] = useState<any>({
    customer_name: '', customer_phone: '', category: 'casual_wear',
    description: '', service_type: '', due_date: '', total_price: '',
    measurements: {}, reference_images: [] as string[], notes: '',
  });

  const fetchOrders = async () => {
    if (!user) return;
    let query = supabase.from('garment_requests').select('*')
      .order('is_member_priority', { ascending: false })
      .order('created_at', { ascending: false });
    if (role === 'sub_admin') query = query.eq('assigned_to', user.id);
    const { data } = await query;
    setOrders(data || []);
  };

  useEffect(() => { fetchOrders(); }, [user, role]);

  // Open New dialog if ?new=1 (from quick actions / customer reorder)
  useEffect(() => {
    if (searchParams.get('new') === '1') {
      const prefill = sessionStorage.getItem('prefill_customer');
      if (prefill) {
        try {
          const c = JSON.parse(prefill);
          setForm((f: any) => ({ ...f, customer_name: c.name, customer_phone: c.phone, measurements: c.measurements || {} }));
        } catch {}
        sessionStorage.removeItem('prefill_customer');
      }
      setOpen(true);
      searchParams.delete('new');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const updateStatus = async (orderId: string, newStatus: string) => {
    const { error } = await supabase.from('garment_requests')
      .update({ status: newStatus as any })
      .eq('id', orderId);
    if (error) { toast.error('Failed to update'); return; }
    toast.success('Status updated');
    fetchOrders();
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    let validated;
    try {
      validated = await validateImageFile(file, { maxBytes: 10 * 1024 * 1024 });
    } catch (err) {
      const msg = err instanceof ImageValidationError ? err.message : 'Invalid image';
      toast.error(msg);
      return;
    }
    setUploading(true);
    const path = `orders/${safeStorageName(validated.ext)}`;
    const { error } = await supabase.storage
      .from('booking-images')
      .upload(path, file, { contentType: validated.mime, upsert: false });
    if (error) { toast.error(error.message); setUploading(false); return; }
    await scanUploadedFile(path, 'booking-images');
    const { data } = supabase.storage.from('booking-images').getPublicUrl(path);
    setForm((f: any) => ({ ...f, reference_images: [...f.reference_images, data.publicUrl] }));
    setUploading(false);
  };


  const saveOrder = async () => {
    if (!form.customer_name.trim() || !form.customer_phone.trim() || !form.description.trim()) {
      return toast.error('Customer name, phone, and description required');
    }

    // Look up tier by phone (registered profile or walk-in customer)
    const cleanedPhone = form.customer_phone.trim();
    let isMember = false;
    const { data: matchProfile } = await supabase.from('profiles').select('tier').eq('phone', cleanedPhone).maybeSingle();
    if (matchProfile?.tier === 'member') isMember = true;
    if (!isMember) {
      const { data: matchCustomer } = await supabase.from('customers').select('tier').eq('phone', cleanedPhone).maybeSingle();
      if (matchCustomer?.tier === 'member') isMember = true;
    }
    let discountPercent = 0;
    if (isMember) {
      const { data: settings } = await supabase.from('app_settings').select('member_discount_percent').limit(1).maybeSingle();
      discountPercent = Number(settings?.member_discount_percent ?? 10);
    }
    const basePrice = form.total_price ? Number(form.total_price) : null;
    const finalPrice = basePrice != null && discountPercent > 0
      ? Math.round(basePrice * (1 - discountPercent / 100) * 100) / 100
      : basePrice;

    const { error } = await supabase.from('garment_requests').insert({
      client_id: user?.id,
      customer_name: form.customer_name.trim(),
      customer_phone: cleanedPhone,
      category: form.category,
      service_type: form.service_type || null,
      description: form.description.trim(),
      due_date: form.due_date || null,
      total_price: finalPrice,
      estimated_cost: basePrice,
      reference_images: form.reference_images,
      measurements: form.measurements,
      notes: form.notes || null,
      status: 'request_submitted',
      discount_percent: discountPercent,
      is_member_priority: isMember,
    });
    if (error) return toast.error(error.message);
    toast.success(isMember ? `Order created with ${discountPercent}% member discount` : 'Order created');
    setOpen(false);
    setForm({
      customer_name: '', customer_phone: '', category: 'casual_wear',
      description: '', service_type: '', due_date: '', total_price: '',
      measurements: {}, reference_images: [], notes: '',
    });
    fetchOrders();
  };

  const sendWhatsApp = (order: any, type: 'status' | 'pickup' = 'status') => {
    if (!order.customer_phone) return toast.error('No phone number for this customer');
    const msg = type === 'pickup'
      ? buildPickupMessage(order.customer_name, order.description?.slice(0, 40))
      : buildStatusMessage(order.customer_name, getStatusFlow(order.status).label, order.id.slice(0, 8));
    window.open(whatsappLink(order.customer_phone, msg), '_blank');
  };

  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter);

  const exportCsv = () => {
    const rows = filtered.map(o => ({
      reference: o.id.slice(0, 8),
      created_at: o.created_at,
      customer_name: o.customer_name || '',
      customer_phone: o.customer_phone || '',
      category: getCategoryLabel(o.category),
      description: o.description,
      status: getStatusFlow(o.status).label,
      total_price_kwacha: o.total_price ?? '',
      payment_status: o.payment_status || '',
      due_date: o.due_date || '',
      event_date: o.event_date || '',
      notes: o.notes || '',
    }));
    if (rows.length === 0) return toast.error('No orders to export');
    downloadCSV('salem_orders.csv', toCSV(rows));
    toast.success(`Exported ${rows.length} order${rows.length !== 1 ? 's' : ''}`);
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="flex items-center justify-between gap-2">
          <h1 className="font-serif text-2xl font-bold text-foreground">Orders</h1>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={exportCsv} className="gap-1">
              <Download className="h-4 w-4" /> Export
            </Button>
            <Button size="sm" onClick={() => setOpen(true)} className="gap-1">
              <Plus className="h-4 w-4" /> New
            </Button>
          </div>
        </div>

        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger><SelectValue placeholder="Filter by status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Orders ({orders.length})</SelectItem>
            {ORDER_STATUS_FLOW.map(s => (
              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="space-y-3">
          {filtered.map(order => {
            const status = getStatusFlow(order.status);
            return (
              <Card key={order.id} className={`p-4 space-y-3 ${order.is_member_priority ? 'border-gold/40 bg-gold/5' : ''}`}>
                <div className="flex justify-between items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-foreground truncate">
                        {order.customer_name || getCategoryLabel(order.category)}
                      </p>
                      {order.is_member_priority && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gold/20 text-earth border border-gold/40 font-semibold">
                          ★ MEMBER
                        </span>
                      )}
                    </div>
                    {order.customer_phone && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Phone className="h-3 w-3" /> {order.customer_phone}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {getCategoryLabel(order.category)} · {formatDateTime(order.created_at)}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${status.color}`}>{status.label}</span>
                </div>
                <p className="text-sm text-foreground/80">{order.description}</p>
                <div className="flex flex-wrap gap-3 text-xs">
                  {order.due_date && <span className="text-primary">📅 Due: {formatDate(order.due_date)}</span>}
                  {order.total_price && <span className="text-accent font-semibold">{formatKwacha(order.total_price)}</span>}
                  {order.payment_status && <span className="text-muted-foreground capitalize">· {order.payment_status.replace('_', ' ')}</span>}
                </div>
                {order.reference_images?.length > 0 && (
                  <div className="flex gap-1 overflow-x-auto">
                    {order.reference_images.slice(0, 4).map((img: string, i: number) => (
                      <SignedImage key={i} src={img} alt="" className="w-14 h-14 rounded object-cover border border-border shrink-0" />
                    ))}
                  </div>
                )}
                {(role === 'admin' || role === 'super_admin') && (
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Select value={order.status} onValueChange={v => updateStatus(order.id, v)}>
                      <SelectTrigger className="h-9 text-xs flex-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {ORDER_STATUS_FLOW.map(s => (
                          <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {order.customer_phone && (
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline" className="gap-1 h-9" onClick={() => sendWhatsApp(order, 'status')}>
                          <MessageCircle className="h-3 w-3 text-[#25D366]" /> Update
                        </Button>
                        {(order.status === 'completed' || order.status === 'ready_for_pickup') && (
                          <Button size="sm" className="gap-1 h-9 bg-[#25D366] hover:bg-[#1ebe57] text-white border-0" onClick={() => sendWhatsApp(order, 'pickup')}>
                            <MessageCircle className="h-3 w-3" /> Pickup
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
          {filtered.length === 0 && (
            <Card className="p-8 text-center text-muted-foreground">No orders found</Card>
          )}
        </div>
      </div>

      {/* New Order Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-serif">New Order</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Customer Name *</Label>
                <Input value={form.customer_name} onChange={e => setForm({ ...form, customer_name: e.target.value })} />
              </div>
              <div>
                <Label>Phone (WhatsApp) *</Label>
                <Input value={form.customer_phone} onChange={e => setForm({ ...form, customer_phone: e.target.value })} placeholder="+260…" />
              </div>
            </div>
            <div>
              <Label>Service Type</Label>
              <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                {GARMENT_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <Label>Description *</Label>
              <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="What is the customer ordering?" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Due Date</Label>
                <Input type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} />
              </div>
              <div>
                <Label>Total Price (K)</Label>
                <Input type="number" step="0.01" value={form.total_price} onChange={e => setForm({ ...form, total_price: e.target.value })} />
              </div>
            </div>

            <div>
              <Label>Reference Images</Label>
              <div className="flex flex-wrap gap-2 mt-1">
                {form.reference_images.map((img: string, i: number) => (
                  <div key={i} className="relative">
                    <img src={img} alt="" className="w-16 h-16 rounded object-cover border border-border" />
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, reference_images: form.reference_images.filter((_: any, idx: number) => idx !== i) })}
                      className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                <label className="w-16 h-16 rounded border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:border-primary">
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-5 w-5 text-muted-foreground" />}
                  <input type="file" accept="image/*" onChange={handleFile} className="hidden" disabled={uploading} />
                </label>
              </div>
            </div>

            <div>
              <Label>Measurements (cm)</Label>
              <div className="grid grid-cols-3 gap-2 mt-1">
                {['chest', 'waist', 'hips', 'shoulder', 'sleeve', 'length'].map(f => (
                  <Input
                    key={f}
                    type="number"
                    step="0.1"
                    placeholder={f}
                    value={form.measurements[f] || ''}
                    onChange={e => setForm({ ...form, measurements: { ...form.measurements, [f]: e.target.value ? Number(e.target.value) : undefined } })}
                  />
                ))}
              </div>
            </div>

            <div>
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={saveOrder}>Create Order</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default AdminOrders;
