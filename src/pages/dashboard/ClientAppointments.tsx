import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Plus } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';

const APPOINTMENT_TYPES = [
  { value: 'consultation', label: 'Consultation' },
  { value: 'measurement', label: 'Measurement' },
  { value: 'fitting', label: 'Fitting' },
  { value: 'pickup', label: 'Pickup' },
];

const ClientAppointments = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ type: '', date: '', time: '', notes: '' });

  const fetchAppointments = () => {
    if (!user) return;
    supabase.from('appointments').select('*').eq('client_id', user.id)
      .order('scheduled_at', { ascending: true })
      .then(({ data }) => setAppointments(data || []));
  };

  useEffect(() => { fetchAppointments(); }, [user]);

  const handleBook = async () => {
    if (!user || !form.type || !form.date || !form.time) return;
    setLoading(true);
    const scheduledAt = new Date(`${form.date}T${form.time}`).toISOString();

    // Check for double booking
    const { data: existing } = await supabase.from('appointments').select('id')
      .eq('scheduled_at', scheduledAt).neq('status', 'cancelled');
    if (existing && existing.length > 0) {
      toast.error('This time slot is already booked. Please choose another.');
      setLoading(false);
      return;
    }

    const { error } = await supabase.from('appointments').insert({
      client_id: user.id,
      appointment_type: form.type as any,
      scheduled_at: scheduledAt,
      notes: form.notes || null,
    });

    if (error) {
      toast.error('Failed to book appointment');
    } else {
      toast.success('Appointment booked!');
      setOpen(false);
      setForm({ type: '', date: '', time: '', notes: '' });
      fetchAppointments();
    }
    setLoading(false);
  };

  const statusColors: Record<string, string> = {
    pending: 'bg-gold/20 text-earth',
    confirmed: 'bg-accent/20 text-accent',
    completed: 'bg-muted text-muted-foreground',
    cancelled: 'bg-destructive/20 text-destructive',
    rescheduled: 'bg-primary/20 text-primary',
  };

  // Get minimum date (tomorrow)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  return (
    <DashboardLayout>
      <div className="max-w-lg mx-auto">
        <div className="flex justify-between items-center mb-4">
          <h1 className="font-serif text-2xl font-bold text-foreground">Appointments</h1>
          <Dialog open={open} onOpenChange={setOpen}>
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
                  <Label>Date *</Label>
                  <Input type="date" min={minDate} value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
                </div>
                <div>
                  <Label>Time *</Label>
                  <Input type="time" min="08:00" max="17:00" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} />
                </div>
                <div>
                  <Label>Notes</Label>
                  <Textarea placeholder="Any special notes..." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} />
                </div>
                <Button className="w-full" onClick={handleBook} disabled={loading || !form.type || !form.date || !form.time}>
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
