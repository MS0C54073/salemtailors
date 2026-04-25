import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from '@/components/ui/dialog';
import { User, Phone, Plus, Search, Repeat, Ruler, MessageCircle, Download } from 'lucide-react';
import { toast } from 'sonner';
import { whatsappLink, cleanPhone } from '@/lib/admin-helpers';
import { toCSV, downloadCSV } from '@/lib/csv-export';
import { useNavigate } from 'react-router-dom';

const MEASUREMENT_FIELDS = [
  'chest', 'waist', 'hips', 'shoulder', 'sleeve', 'neck', 'inseam', 'outseam', 'thigh', 'bicep',
];

const AdminCustomers = () => {
  const [customers, setCustomers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>({ full_name: '', phone: '', email: '', notes: '', measurements: {} });
  const navigate = useNavigate();

  const load = async () => {
    const { data } = await supabase.from('customers').select('*').order('created_at', { ascending: false });
    setCustomers(data || []);
  };

  useEffect(() => { load(); }, []);

  const openNew = () => {
    setEditing(null);
    setForm({ full_name: '', phone: '', email: '', notes: '', measurements: {} });
    setOpen(true);
  };

  const openEdit = (c: any) => {
    setEditing(c);
    setForm({
      full_name: c.full_name,
      phone: c.phone,
      email: c.email || '',
      notes: c.notes || '',
      measurements: c.measurements || {},
    });
    setOpen(true);
  };

  const save = async () => {
    if (!form.full_name.trim() || !form.phone.trim()) {
      return toast.error('Name and phone are required');
    }
    const payload = {
      full_name: form.full_name.trim(),
      phone: form.phone.trim(),
      email: form.email?.trim() || null,
      notes: form.notes?.trim() || null,
      measurements: form.measurements || {},
    };
    const { error } = editing
      ? await supabase.from('customers').update(payload).eq('id', editing.id)
      : await supabase.from('customers').insert(payload);
    if (error) return toast.error(error.message);
    toast.success(editing ? 'Customer updated' : 'Customer added');
    setOpen(false);
    load();
  };

  const reorder = (c: any) => {
    sessionStorage.setItem('prefill_customer', JSON.stringify({ id: c.id, name: c.full_name, phone: c.phone, measurements: c.measurements }));
    navigate('/dashboard/admin/orders?new=1');
  };

  const filtered = customers.filter(c =>
    !search ||
    c.full_name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search)
  );

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="flex items-center justify-between gap-2">
          <h1 className="font-serif text-2xl font-bold text-foreground">Customers</h1>
          <Button onClick={openNew} size="sm" className="gap-1">
            <Plus className="h-4 w-4" /> New
          </Button>
        </div>

        <div className="relative">
          <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
          <Input
            placeholder="Search by name or phone…"
            className="pl-9"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <p className="text-xs text-muted-foreground">{filtered.length} of {customers.length} customers</p>

        <div className="space-y-2">
          {filtered.map(c => (
            <Card key={c.id} className="p-4">
              <div className="flex items-start justify-between gap-2">
                <button onClick={() => openEdit(c)} className="text-left flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground truncate">{c.full_name}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Phone className="h-3 w-3" /> {c.phone}
                      </p>
                    </div>
                  </div>
                  {c.measurements && Object.keys(c.measurements).length > 0 && (
                    <p className="text-[11px] text-accent mt-2 flex items-center gap-1">
                      <Ruler className="h-3 w-3" /> {Object.keys(c.measurements).length} measurements saved
                    </p>
                  )}
                  {c.notes && <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{c.notes}</p>}
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
              <p className="text-sm text-muted-foreground">No customers yet</p>
            </Card>
          )}
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif">{editing ? 'Edit Customer' : 'New Customer'}</DialogTitle>
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
              <Label>Email (optional)</Label>
              <Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Preferred styles, allergies, etc." />
            </div>
            <div>
              <Label className="flex items-center gap-1"><Ruler className="h-3 w-3" /> Measurements (cm)</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {MEASUREMENT_FIELDS.map(f => (
                  <div key={f}>
                    <Label className="text-xs capitalize text-muted-foreground">{f}</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={form.measurements[f] || ''}
                      onChange={e => setForm({
                        ...form,
                        measurements: { ...form.measurements, [f]: e.target.value ? Number(e.target.value) : undefined },
                      })}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save}>{editing ? 'Save changes' : 'Add customer'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default AdminCustomers;
