import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  User, Phone, Mail, Plus, Search, Repeat, Ruler, MessageCircle, Download,
  Crown, ShieldCheck, History, Calendar, Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { whatsappLink } from '@/lib/admin-helpers';
import { toCSV, downloadCSV } from '@/lib/csv-export';
import { useNavigate } from 'react-router-dom';
import { formatDate, formatDateTime, formatKwacha, buildStatusMessage, buildPickupMessage } from '@/lib/admin-helpers';
import { ALL_TEMPLATES, MEASUREMENT_FIELDS, MeasurementTemplate, TEMPLATE_LABEL } from '@/lib/measurements';
import { getCategoryLabel } from '@/lib/supabase-helpers';
import { ORDER_STATUS_FLOW } from '@/lib/admin-helpers';

type Tier = 'regular' | 'member';

interface UnifiedCustomer {
  source: 'profile' | 'customer';
  id: string;            // row id (profile.id or customer.id)
  user_id?: string;      // profiles.user_id when source=profile
  full_name: string;
  phone: string;
  email: string | null;
  notes?: string | null;
  tier: Tier;
  tier_since?: string | null;
  created_at: string;
}

const TierBadge = ({ tier }: { tier: Tier }) => (
  tier === 'member'
    ? <Badge className="gap-1 bg-gold/20 text-earth border-gold/40 hover:bg-gold/30"><Crown className="h-3 w-3" /> Member</Badge>
    : <Badge variant="secondary" className="gap-1"><ShieldCheck className="h-3 w-3" /> Regular</Badge>
);

const AdminCustomers = () => {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState<'all' | Tier>('all');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'profile' | 'customer'>('all');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>({ full_name: '', phone: '', email: '', notes: '', tier: 'regular' });
  const navigate = useNavigate();

  // Detail panel
  const [detail, setDetail] = useState<UnifiedCustomer | null>(null);

  const load = async () => {
    const [{ data: p }, { data: c }] = await Promise.all([
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('customers').select('*').order('created_at', { ascending: false }),
    ]);
    setProfiles(p || []);
    setCustomers(c || []);
  };

  useEffect(() => { load(); }, []);

  const unified: UnifiedCustomer[] = useMemo(() => {
    const fromProfiles: UnifiedCustomer[] = profiles.map(p => ({
      source: 'profile',
      id: p.id,
      user_id: p.user_id,
      full_name: p.full_name,
      phone: p.phone,
      email: p.email,
      tier: p.tier,
      tier_since: p.tier_since,
      created_at: p.created_at,
    }));
    const fromCustomers: UnifiedCustomer[] = customers.map(c => ({
      source: 'customer',
      id: c.id,
      full_name: c.full_name,
      phone: c.phone,
      email: c.email,
      notes: c.notes,
      tier: c.tier,
      tier_since: c.tier_since,
      created_at: c.created_at,
    }));
    return [...fromProfiles, ...fromCustomers].sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [profiles, customers]);

  const filtered = unified.filter(c => {
    if (tierFilter !== 'all' && c.tier !== tierFilter) return false;
    if (sourceFilter !== 'all' && c.source !== sourceFilter) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.full_name?.toLowerCase().includes(q) ||
      c.phone?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q)
    );
  });

  const memberCount = unified.filter(c => c.tier === 'member').length;
  const regularCount = unified.length - memberCount;

  const openNew = () => {
    setEditing(null);
    setForm({ full_name: '', phone: '', email: '', notes: '', tier: 'regular' });
    setOpen(true);
  };

  const openEditWalkIn = (c: any) => {
    setEditing(c);
    setForm({
      full_name: c.full_name,
      phone: c.phone,
      email: c.email || '',
      notes: c.notes || '',
      tier: c.tier || 'regular',
    });
    setOpen(true);
  };

  const save = async () => {
    if (!form.full_name.trim() || !form.phone.trim()) {
      return toast.error('Name and phone are required');
    }
    const payload: any = {
      full_name: form.full_name.trim(),
      phone: form.phone.trim(),
      email: form.email?.trim() || null,
      notes: form.notes?.trim() || null,
      tier: form.tier as Tier,
    };
    if (form.tier === 'member' && (!editing || editing.tier !== 'member')) {
      payload.tier_since = new Date().toISOString();
    }
    const { error } = editing
      ? await supabase.from('customers').update(payload).eq('id', editing.id)
      : await supabase.from('customers').insert(payload);
    if (error) return toast.error(error.message);
    toast.success(editing ? 'Customer updated' : 'Customer added');
    setOpen(false);
    load();
  };

  const togglePromote = async (c: UnifiedCustomer) => {
    const newTier: Tier = c.tier === 'member' ? 'regular' : 'member';
    const update: any = { tier: newTier };
    if (newTier === 'member') update.tier_since = new Date().toISOString();
    else update.tier_since = null;

    const table = c.source === 'profile' ? 'profiles' : 'customers';
    const { error } = await supabase.from(table).update(update).eq('id', c.id);
    if (error) return toast.error(error.message);
    toast.success(newTier === 'member' ? `${c.full_name} is now a Member` : `${c.full_name} reverted to Regular`);
    if (detail && detail.id === c.id) setDetail({ ...detail, tier: newTier });
    load();
  };

  const reorder = (c: UnifiedCustomer) => {
    sessionStorage.setItem('prefill_customer', JSON.stringify({
      name: c.full_name, phone: c.phone, tier: c.tier,
    }));
    navigate('/dashboard/admin/orders?new=1');
  };

  const exportCsv = () => {
    const rows = filtered.map(c => ({
      source: c.source === 'profile' ? 'Registered' : 'Walk-in',
      tier: c.tier,
      full_name: c.full_name,
      phone: c.phone,
      email: c.email || '',
      tier_since: c.tier_since || '',
      created_at: c.created_at,
    }));
    if (rows.length === 0) return toast.error('No customers to export');
    downloadCSV('salem_customers.csv', toCSV(rows));
    toast.success(`Exported ${rows.length} customer${rows.length !== 1 ? 's' : ''}`);
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h1 className="font-serif text-2xl font-bold text-foreground">Customers</h1>
            <p className="text-xs text-muted-foreground">
              {unified.length} total · <span className="text-earth">{memberCount} Members</span> · {regularCount} Regular
            </p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={exportCsv} className="gap-1">
              <Download className="h-4 w-4" /> Export
            </Button>
            <Button onClick={openNew} size="sm" className="gap-1">
              <Plus className="h-4 w-4" /> Walk-in
            </Button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
            <Input
              placeholder="Search by name, phone, or email…"
              className="pl-9"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <Select value={tierFilter} onValueChange={v => setTierFilter(v as any)}>
            <SelectTrigger className="sm:w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All tiers</SelectItem>
              <SelectItem value="member">Members</SelectItem>
              <SelectItem value="regular">Regulars</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sourceFilter} onValueChange={v => setSourceFilter(v as any)}>
            <SelectTrigger className="sm:w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All sources</SelectItem>
              <SelectItem value="profile">Registered</SelectItem>
              <SelectItem value="customer">Walk-in</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <p className="text-xs text-muted-foreground">{filtered.length} of {unified.length}</p>

        <div className="space-y-2">
          {filtered.map(c => (
            <Card key={`${c.source}-${c.id}`} className="p-4">
              <div className="flex items-start justify-between gap-2">
                <button onClick={() => setDetail(c)} className="text-left flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                      c.tier === 'member' ? 'bg-gold/20' : 'bg-primary/10'
                    }`}>
                      {c.tier === 'member'
                        ? <Crown className="h-4 w-4 text-earth" />
                        : <User className="h-4 w-4 text-primary" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-foreground truncate">{c.full_name}</p>
                        <TierBadge tier={c.tier} />
                        <Badge variant="outline" className="text-[10px]">
                          {c.source === 'profile' ? 'Registered' : 'Walk-in'}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Phone className="h-3 w-3" /> {c.phone}
                        {c.email && <><Mail className="h-3 w-3 ml-2" /> <span className="truncate">{c.email}</span></>}
                      </p>
                    </div>
                  </div>
                </button>
                <div className="flex flex-col gap-1 shrink-0">
                  <Button size="icon" variant="ghost" className="h-8 w-8" asChild>
                    <a href={whatsappLink(c.phone, `Hello ${c.full_name}`)} target="_blank" rel="noopener noreferrer" title="WhatsApp">
                      <MessageCircle className="h-4 w-4 text-[#25D366]" />
                    </a>
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => reorder(c)} title="Quick reorder">
                    <Repeat className="h-4 w-4 text-primary" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
          {filtered.length === 0 && (
            <Card className="p-8 text-center">
              <User className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No customers match these filters</p>
            </Card>
          )}
        </div>
      </div>

      {/* Walk-in create/edit dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif">{editing ? 'Edit Walk-in Customer' : 'New Walk-in Customer'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Full Name *</Label>
              <Input value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} />
            </div>
            <div>
              <Label>Phone (WhatsApp) *</Label>
              <Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+260…" />
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="optional" />
            </div>
            <div>
              <Label>Tier</Label>
              <Select value={form.tier} onValueChange={v => setForm({ ...form, tier: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="regular">Regular</SelectItem>
                  <SelectItem value="member">Member</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Preferred styles, fabrics, etc." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save}>{editing ? 'Save changes' : 'Add customer'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail panel */}
      {detail && (
        <CustomerDetailDialog
          customer={detail}
          onClose={() => setDetail(null)}
          onPromote={() => togglePromote(detail)}
          onEdit={() => {
            if (detail.source === 'customer') {
              const c = customers.find(x => x.id === detail.id);
              if (c) { setDetail(null); openEditWalkIn(c); }
            } else {
              toast.info('Registered clients edit their own profile in Settings.');
            }
          }}
          onReorder={() => reorder(detail)}
        />
      )}
    </DashboardLayout>
  );
};

// ============================================================
// Detail dialog: history, measurements, notify
// ============================================================
const CustomerDetailDialog = ({
  customer, onClose, onPromote, onEdit, onReorder,
}: {
  customer: UnifiedCustomer;
  onClose: () => void;
  onPromote: () => void;
  onEdit: () => void;
  onReorder: () => void;
}) => {
  const [orders, setOrders] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [measurements, setMeasurements] = useState<Record<MeasurementTemplate, any | null>>({ male: null, female: null, child: null });
  const [activeTpl, setActiveTpl] = useState<MeasurementTemplate>('male');
  const [editingMeasure, setEditingMeasure] = useState(false);
  const [measureDraft, setMeasureDraft] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      // Orders: registered → by client_id; walk-in → by phone match (best-effort)
      const orderQuery = customer.source === 'profile' && customer.user_id
        ? supabase.from('garment_requests').select('*').eq('client_id', customer.user_id).order('created_at', { ascending: false })
        : supabase.from('garment_requests').select('*').eq('customer_phone', customer.phone).order('created_at', { ascending: false });

      const aptQuery = customer.source === 'profile' && customer.user_id
        ? supabase.from('appointments').select('*').eq('client_id', customer.user_id).order('scheduled_at', { ascending: false })
        : Promise.resolve({ data: [] });

      const measureQuery = customer.source === 'profile' && customer.user_id
        ? supabase.from('customer_measurements').select('*').eq('profile_user_id', customer.user_id)
        : supabase.from('customer_measurements').select('*').eq('customer_id', customer.id);

      const [{ data: o }, aptResult, { data: m }] = await Promise.all([orderQuery, aptQuery as any, measureQuery]);
      if (cancelled) return;
      setOrders(o || []);
      setAppointments(aptResult?.data || []);
      const grouped: any = { male: null, female: null, child: null };
      (m || []).forEach((row: any) => { grouped[row.template as MeasurementTemplate] = row; });
      setMeasurements(grouped);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [customer]);

  const startEditMeasure = () => {
    const existing = measurements[activeTpl]?.measurements || {};
    const draft: Record<string, string> = {};
    MEASUREMENT_FIELDS[activeTpl].forEach(f => { draft[f.key] = existing[f.key] != null ? String(existing[f.key]) : ''; });
    setMeasureDraft(draft);
    setEditingMeasure(true);
  };

  const saveMeasurements = async () => {
    const numeric: Record<string, number> = {};
    Object.entries(measureDraft).forEach(([k, v]) => {
      if (v.trim()) numeric[k] = Number(v);
    });
    const payload: any = {
      template: activeTpl,
      measurements: numeric,
    };
    if (customer.source === 'profile' && customer.user_id) payload.profile_user_id = customer.user_id;
    else payload.customer_id = customer.id;

    const existing = measurements[activeTpl];
    const { error } = existing
      ? await supabase.from('customer_measurements').update({ measurements: numeric }).eq('id', existing.id)
      : await supabase.from('customer_measurements').insert(payload);
    if (error) return toast.error(error.message);
    toast.success('Measurements saved');
    setEditingMeasure(false);
    // Refresh
    const { data: m } = customer.source === 'profile' && customer.user_id
      ? await supabase.from('customer_measurements').select('*').eq('profile_user_id', customer.user_id)
      : await supabase.from('customer_measurements').select('*').eq('customer_id', customer.id);
    const grouped: any = { male: null, female: null, child: null };
    (m || []).forEach((row: any) => { grouped[row.template as MeasurementTemplate] = row; });
    setMeasurements(grouped);
  };

  const sendStatusUpdate = (order: any) => {
    const status = ORDER_STATUS_FLOW.find(s => s.value === order.status)?.label || order.status;
    const msg = order.status === 'ready_for_pickup' || order.status === 'completed'
      ? buildPickupMessage(customer.full_name, order.description?.slice(0, 40))
      : buildStatusMessage(customer.full_name, status, order.id.slice(0, 8));
    window.open(whatsappLink(customer.phone, msg), '_blank');
  };

  const sendEmailUpdate = (order: any) => {
    if (!customer.email) return toast.error('No email on file for this customer');
    const status = ORDER_STATUS_FLOW.find(s => s.value === order.status)?.label || order.status;
    const subject = `Salem Tailors — Order update (${order.id.slice(0, 8)})`;
    const body = buildStatusMessage(customer.full_name, status, order.id.slice(0, 8));
    window.location.href = `mailto:${customer.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const totalSpent = orders
    .filter(o => o.payment_status === 'fully_paid')
    .reduce((sum, o) => sum + Number(o.total_price || 0), 0);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <DialogTitle className="font-serif text-xl flex items-center gap-2 flex-wrap">
                {customer.full_name}
                <TierBadge tier={customer.tier} />
              </DialogTitle>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-3 flex-wrap">
                <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {customer.phone}</span>
                {customer.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {customer.email}</span>}
                <Badge variant="outline" className="text-[10px]">
                  {customer.source === 'profile' ? 'Registered' : 'Walk-in'}
                </Badge>
              </p>
            </div>
          </div>
        </DialogHeader>

        {/* Quick actions */}
        <div className="flex flex-wrap gap-2 -mt-2">
          <Button size="sm" variant="outline" onClick={onPromote} className="gap-1">
            <Crown className="h-3 w-3" />
            {customer.tier === 'member' ? 'Revert to Regular' : 'Promote to Member'}
          </Button>
          <Button size="sm" variant="outline" onClick={onReorder} className="gap-1">
            <Repeat className="h-3 w-3" /> New order
          </Button>
          {customer.source === 'customer' && (
            <Button size="sm" variant="outline" onClick={onEdit}>Edit</Button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          <Card className="p-3">
            <p className="text-[10px] uppercase text-muted-foreground tracking-wide">Orders</p>
            <p className="text-xl font-bold text-foreground">{orders.length}</p>
          </Card>
          <Card className="p-3">
            <p className="text-[10px] uppercase text-muted-foreground tracking-wide">Spent (paid)</p>
            <p className="text-xl font-bold text-accent">{formatKwacha(totalSpent)}</p>
          </Card>
          <Card className="p-3">
            <p className="text-[10px] uppercase text-muted-foreground tracking-wide">Appointments</p>
            <p className="text-xl font-bold text-foreground">{appointments.length}</p>
          </Card>
        </div>

        <Tabs defaultValue="history" className="mt-2">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="history" className="gap-1"><History className="h-3 w-3" /> History</TabsTrigger>
            <TabsTrigger value="measurements" className="gap-1"><Ruler className="h-3 w-3" /> Measurements</TabsTrigger>
            <TabsTrigger value="appointments" className="gap-1"><Calendar className="h-3 w-3" /> Visits</TabsTrigger>
          </TabsList>

          <TabsContent value="history" className="space-y-2 mt-3">
            {loading && <Loader2 className="h-4 w-4 animate-spin mx-auto text-primary" />}
            {!loading && orders.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6">No orders yet</p>
            )}
            {orders.map(o => {
              const status = ORDER_STATUS_FLOW.find(s => s.value === o.status) || ORDER_STATUS_FLOW[0];
              return (
                <Card key={o.id} className="p-3">
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">{getCategoryLabel(o.category)}</p>
                      <p className="text-xs text-muted-foreground">{formatDateTime(o.created_at)}</p>
                      <p className="text-xs text-foreground/80 line-clamp-2 mt-1">{o.description}</p>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap ${status.color}`}>{status.label}</span>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2 text-xs">
                    {o.total_price && <span className="text-accent font-semibold">{formatKwacha(o.total_price)}</span>}
                    {o.discount_percent > 0 && <span className="text-earth">−{o.discount_percent}% member</span>}
                    {o.payment_status && <span className="text-muted-foreground capitalize">· {o.payment_status.replace('_', ' ')}</span>}
                  </div>
                  <div className="flex gap-1 mt-2">
                    <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => sendStatusUpdate(o)}>
                      <MessageCircle className="h-3 w-3 text-[#25D366]" /> WhatsApp
                    </Button>
                    {customer.email && (
                      <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => sendEmailUpdate(o)}>
                        <Mail className="h-3 w-3" /> Email
                      </Button>
                    )}
                  </div>
                </Card>
              );
            })}
          </TabsContent>

          <TabsContent value="measurements" className="mt-3 space-y-3">
            <div className="flex gap-2">
              {ALL_TEMPLATES.map(t => (
                <Button
                  key={t}
                  size="sm"
                  variant={activeTpl === t ? 'default' : 'outline'}
                  onClick={() => { setActiveTpl(t); setEditingMeasure(false); }}
                >
                  {TEMPLATE_LABEL[t]}
                </Button>
              ))}
            </div>
            {!editingMeasure ? (
              <Card className="p-3">
                {measurements[activeTpl] ? (
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {MEASUREMENT_FIELDS[activeTpl].map(f => {
                      const v = measurements[activeTpl]?.measurements?.[f.key];
                      return (
                        <div key={f.key} className="flex justify-between border-b border-border/50 py-1">
                          <span className="text-muted-foreground">{f.label}</span>
                          <span className="font-medium">{v != null ? `${v} cm` : '—'}</span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">No {TEMPLATE_LABEL[activeTpl].toLowerCase()} measurements saved</p>
                )}
                <Button size="sm" variant="outline" className="mt-3 gap-1" onClick={startEditMeasure}>
                  <Ruler className="h-3 w-3" /> {measurements[activeTpl] ? 'Edit' : 'Add'} {TEMPLATE_LABEL[activeTpl]} measurements
                </Button>
              </Card>
            ) : (
              <Card className="p-3 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  {MEASUREMENT_FIELDS[activeTpl].map(f => (
                    <div key={f.key}>
                      <Label className="text-xs">{f.label}</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={measureDraft[f.key] || ''}
                        onChange={e => setMeasureDraft(d => ({ ...d, [f.key]: e.target.value }))}
                      />
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 justify-end pt-1">
                  <Button size="sm" variant="ghost" onClick={() => setEditingMeasure(false)}>Cancel</Button>
                  <Button size="sm" onClick={saveMeasurements}>Save</Button>
                </div>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="appointments" className="space-y-2 mt-3">
            {loading && <Loader2 className="h-4 w-4 animate-spin mx-auto text-primary" />}
            {!loading && appointments.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6">No appointments</p>
            )}
            {appointments.map(a => (
              <Card key={a.id} className="p-3 flex items-center gap-3">
                <Calendar className="h-5 w-5 text-accent shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium capitalize">{a.appointment_type}</p>
                  <p className="text-xs text-muted-foreground">{formatDateTime(a.scheduled_at)}</p>
                </div>
                <Badge variant="outline" className="capitalize text-[10px]">{a.status}</Badge>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default AdminCustomers;
