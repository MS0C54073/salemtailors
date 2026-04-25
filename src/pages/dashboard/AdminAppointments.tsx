import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
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
import { Calendar, Clock, Plus, MessageCircle, AlertCircle, CalendarPlus } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { whatsappLink, buildAppointmentMessage } from '@/lib/admin-helpers';

const APPOINTMENT_TYPES = ['consultation', 'measurement', 'fitting', 'pickup'];
const SHOP_HOURS = { start: 8, end: 17 }; // 08:00 - 17:00
const SLOT_MINUTES = 30;

const AdminAppointments = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [view, setView] = useState<'day' | 'week'>('day');
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({
    customer_name: '', customer_phone: '',
    appointment_type: 'consultation',
    date: new Date().toISOString().slice(0, 10),
    time: '10:00',
    notes: '',
  });

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from('appointments').select('*').order('scheduled_at', { ascending: true });
    setAppointments(data || []);
  };

  useEffect(() => { load(); }, [user]);

  const dayAppts = useMemo(() => {
    const start = new Date(selectedDate + 'T00:00:00');
    const end = new Date(start.getTime() + (view === 'week' ? 7 : 1) * 24 * 60 * 60 * 1000);
    return appointments.filter(a => {
      const d = new Date(a.scheduled_at);
      return d >= start && d < end;
    });
  }, [appointments, selectedDate, view]);

  const isSlotTaken = (dateTimeISO: string) => {
    const target = new Date(dateTimeISO).getTime();
    return appointments.some(a => Math.abs(new Date(a.scheduled_at).getTime() - target) < SLOT_MINUTES * 60 * 1000);
  };

  const save = async () => {
    if (!form.customer_name.trim() || !form.customer_phone.trim()) return toast.error('Customer name and phone required');
    const scheduled_at = `${form.date}T${form.time}:00`;
    const dt = new Date(scheduled_at);
    if (dt.getHours() < SHOP_HOURS.start || dt.getHours() >= SHOP_HOURS.end) {
      return toast.error(`Outside shop hours (${SHOP_HOURS.start}:00–${SHOP_HOURS.end}:00)`);
    }
    if (isSlotTaken(scheduled_at)) {
      return toast.error('This slot is already booked. Please pick another time.');
    }
    const { error } = await supabase.from('appointments').insert({
      client_id: user?.id,
      appointment_type: form.appointment_type,
      scheduled_at: dt.toISOString(),
      notes: `${form.customer_name} (${form.customer_phone})${form.notes ? ' — ' + form.notes : ''}`,
      status: 'confirmed',
    });
    if (error) return toast.error(error.message);
    toast.success('Appointment created');
    // Send WhatsApp confirmation
    const msg = buildAppointmentMessage(form.customer_name, form.appointment_type, dt.toLocaleString());
    window.open(whatsappLink(form.customer_phone, msg), '_blank');
    setOpen(false);
    setForm({ ...form, customer_name: '', customer_phone: '', notes: '' });
    load();
  };

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from('appointments').update({ status: status as any }).eq('id', id);
    if (error) return toast.error(error.message);
    toast.success('Updated');
    load();
  };

  // Generate available time slots for current date
  const availableSlots = useMemo(() => {
    const slots: { time: string; taken: boolean }[] = [];
    for (let h = SHOP_HOURS.start; h < SHOP_HOURS.end; h++) {
      for (let m = 0; m < 60; m += SLOT_MINUTES) {
        const time = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        const iso = `${form.date}T${time}:00`;
        slots.push({ time, taken: isSlotTaken(iso) });
      }
    }
    return slots;
  }, [form.date, appointments]);

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h1 className="font-serif text-2xl font-bold text-foreground">Appointments</h1>
          <div className="flex gap-2">
            <Link to="/dashboard/admin/slots">
              <Button size="sm" variant="outline" className="gap-1 border-primary text-primary">
                <CalendarPlus className="h-4 w-4" /> Slots
              </Button>
            </Link>
            <Button size="sm" onClick={() => setOpen(true)} className="gap-1">
              <Plus className="h-4 w-4" /> New
            </Button>
          </div>
        </div>

        <div className="flex gap-2 items-center">
          <Input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="flex-1" />
          <div className="flex border border-border rounded-md overflow-hidden">
            <button
              onClick={() => setView('day')}
              className={`px-3 py-2 text-xs font-medium ${view === 'day' ? 'bg-primary text-primary-foreground' : 'bg-background text-muted-foreground'}`}
            >Day</button>
            <button
              onClick={() => setView('week')}
              className={`px-3 py-2 text-xs font-medium ${view === 'week' ? 'bg-primary text-primary-foreground' : 'bg-background text-muted-foreground'}`}
            >Week</button>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          Shop hours: {SHOP_HOURS.start}:00 – {SHOP_HOURS.end}:00 · {dayAppts.length} appointment{dayAppts.length !== 1 ? 's' : ''}
        </p>

        {dayAppts.length === 0 ? (
          <Card className="p-8 text-center">
            <Calendar className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No appointments {view === 'day' ? 'this day' : 'this week'}</p>
          </Card>
        ) : (
          <div className="space-y-2">
            {dayAppts.map(apt => (
              <Card key={apt.id} className="p-3 flex items-start gap-3">
                <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                  <Clock className="h-5 w-5 text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="text-sm font-semibold text-foreground capitalize">{apt.appointment_type}</p>
                    <p className="text-xs text-primary font-medium">
                      {new Date(apt.scheduled_at).toLocaleString('en-ZM', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  {apt.notes && <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{apt.notes}</p>}
                  <div className="flex items-center gap-2 mt-2">
                    <Select value={apt.status} onValueChange={v => updateStatus(apt.id, v)}>
                      <SelectTrigger className="h-7 text-[11px] w-32"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-serif">New Appointment</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Customer Name *</Label>
                <Input value={form.customer_name} onChange={e => setForm({ ...form, customer_name: e.target.value })} />
              </div>
              <div>
                <Label>Phone *</Label>
                <Input value={form.customer_phone} onChange={e => setForm({ ...form, customer_phone: e.target.value })} placeholder="+260…" />
              </div>
            </div>
            <div>
              <Label>Type</Label>
              <Select value={form.appointment_type} onValueChange={v => setForm({ ...form, appointment_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {APPOINTMENT_TYPES.map(t => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Date</Label>
                <Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
              </div>
              <div>
                <Label>Time</Label>
                <select value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                  {availableSlots.map(s => (
                    <option key={s.time} value={s.time} disabled={s.taken}>
                      {s.time} {s.taken ? '— booked' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {isSlotTaken(`${form.date}T${form.time}:00`) && (
              <div className="flex items-center gap-2 text-xs text-destructive bg-destructive/10 p-2 rounded">
                <AlertCircle className="h-4 w-4" /> This slot conflicts with an existing appointment.
              </div>
            )}
            <div>
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted p-2 rounded">
              <MessageCircle className="h-3 w-3 text-[#25D366]" />
              WhatsApp confirmation will open after saving
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save}>Save & Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default AdminAppointments;
