import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Plus } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';

const APPOINTMENT_TYPES = [
  { value: 'consultation', label: 'Consultation' },
  { value: 'measurement', label: 'Measurement' },
  { value: 'fitting', label: 'Fitting' },
  { value: 'pickup', label: 'Pickup' },
];

interface Slot {
  id: string;
  slot_at: string;
  duration_minutes: number;
}

const ClientAppointments = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ type: '', slotId: '', notes: '' });

  const fetchAppointments = () => {
    if (!user) return;
    supabase.from('appointments').select('*').eq('client_id', user.id)
      .order('scheduled_at', { ascending: true })
      .then(({ data }) => setAppointments(data || []));
  };

  const fetchSlots = () => {
    supabase.from('appointment_slots').select('id, slot_at, duration_minutes')
      .eq('is_available', true)
      .is('booked_by', null)
      .gte('slot_at', new Date().toISOString())
      .order('slot_at', { ascending: true })
      .then(({ data }) => setSlots(data || []));
  };

  useEffect(() => {
    fetchAppointments();
    fetchSlots();
  }, [user]);

  // Group slots by day for the picker
  const groupedSlots = useMemo(() => {
    return slots.reduce<Record<string, Slot[]>>((acc, s) => {
      const day = new Date(s.slot_at).toLocaleDateString('en-GB', {
        weekday: 'short', month: 'short', day: 'numeric',
      });
      (acc[day] = acc[day] || []).push(s);
      return acc;
    }, {});
  }, [slots]);

  const handleBook = async () => {
    if (!user || !form.type || !form.slotId) return;
    const slot = slots.find(s => s.id === form.slotId);
    if (!slot) return toast.error('Selected slot is no longer available');
    setLoading(true);

    // Atomically claim the slot (RLS allows only if still available + null booked_by)
    const { data: claimed, error: claimErr } = await supabase
      .from('appointment_slots')
      .update({ booked_by: user.id, is_available: false })
      .eq('id', slot.id)
      .eq('is_available', true)
      .is('booked_by', null)
      .select()
      .maybeSingle();

    if (claimErr || !claimed) {
      toast.error('That slot was just taken. Please pick another.');
      fetchSlots();
      setLoading(false);
      return;
    }

    // Create the appointment
    const { data: apt, error } = await supabase.from('appointments').insert({
      client_id: user.id,
      appointment_type: form.type as any,
      scheduled_at: slot.slot_at,
      notes: form.notes || null,
    }).select().single();

    if (error) {
      // Roll back the slot claim
      await supabase.from('appointment_slots').update({
        booked_by: null, is_available: true,
      }).eq('id', slot.id);
      toast.error('Failed to book appointment');
      setLoading(false);
      return;
    }

    // Link appointment back to slot
    await supabase.from('appointment_slots')
      .update({ appointment_id: apt.id })
      .eq('id', slot.id);

    toast.success('Appointment booked! Opening WhatsApp...');

    // Build WhatsApp message
    const typeLabel = APPOINTMENT_TYPES.find(t => t.value === form.type)?.label || form.type;
    const formattedDate = new Date(slot.slot_at).toLocaleString('en-GB', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
    const clientName = user.user_metadata?.full_name || user.email || 'Client';
    const messageLines = [
      `*New Appointment Booking - Salem Tailors*`,
      ``,
      `*Client:* ${clientName}`,
      `*Type:* ${typeLabel}`,
      `*Date & Time:* ${formattedDate}`,
    ];
    if (form.notes) messageLines.push(`*Notes:* ${form.notes}`);
    const waMessage = encodeURIComponent(messageLines.join('\n'));
    window.open(`https://wa.me/260979287496?text=${waMessage}`, '_blank', 'noopener,noreferrer');

    setOpen(false);
    setForm({ type: '', slotId: '', notes: '' });
    fetchAppointments();
    fetchSlots();
    setLoading(false);
  };

  const statusColors: Record<string, string> = {
    pending: 'bg-gold/20 text-earth',
    confirmed: 'bg-accent/20 text-accent',
    completed: 'bg-muted text-muted-foreground',
    cancelled: 'bg-destructive/20 text-destructive',
    rescheduled: 'bg-primary/20 text-primary',
  };

  return (
    <DashboardLayout>
      <div className="max-w-lg mx-auto">
        <div className="flex justify-between items-center mb-4">
          <h1 className="font-serif text-2xl font-bold text-foreground">Appointments</h1>
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (v) fetchSlots(); }}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="border-primary text-primary font-semibold"><Plus className="h-4 w-4 mr-1" /> Book</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="font-serif">Book Appointment</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                <div>
                  <Label>Type *</Label>
                  <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      {APPOINTMENT_TYPES.map(t => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Available Slot *</Label>
                  {slots.length === 0 ? (
                    <p className="text-xs text-muted-foreground mt-2 p-3 bg-muted rounded">
                      No open slots right now. Please check back soon — Salem Tailors will publish more times.
                    </p>
                  ) : (
                    <Select value={form.slotId} onValueChange={v => setForm(f => ({ ...f, slotId: v }))}>
                      <SelectTrigger><SelectValue placeholder="Pick a time" /></SelectTrigger>
                      <SelectContent className="max-h-72">
                        {Object.entries(groupedSlots).map(([day, daySlots]) => (
                          <div key={day}>
                            <div className="px-2 py-1 text-[10px] font-semibold uppercase text-muted-foreground tracking-wide">{day}</div>
                            {daySlots.map(s => (
                              <SelectItem key={s.id} value={s.id}>
                                {new Date(s.slot_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                                {' '}· {s.duration_minutes}m
                              </SelectItem>
                            ))}
                          </div>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
                <div>
                  <Label>Notes</Label>
                  <Textarea placeholder="Any special notes..." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} />
                </div>
                <Button className="w-full" onClick={handleBook} disabled={loading || !form.type || !form.slotId}>
                  {loading ? 'Booking...' : 'Book Appointment'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {appointments.length === 0 ? (
          <Card className="p-8 text-center">
            <Calendar className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No appointments yet</p>
            <p className="text-xs text-muted-foreground mt-1">Book your first appointment above</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {appointments.map(apt => (
              <Card key={apt.id} className="p-4 flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Clock className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <p className="text-sm font-semibold text-foreground capitalize">{apt.appointment_type}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${statusColors[apt.status] || ''}`}>
                      {apt.status}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{new Date(apt.scheduled_at).toLocaleString()}</p>
                  {apt.notes && <p className="text-xs text-muted-foreground mt-1">{apt.notes}</p>}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ClientAppointments;
