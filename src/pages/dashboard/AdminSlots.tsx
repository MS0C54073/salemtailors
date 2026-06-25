import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Trash2, RotateCcw, Clock, CalendarPlus } from 'lucide-react';
import { toast } from 'sonner';

interface Slot {
  id: string;
  slot_at: string;
  duration_minutes: number;
  is_available: boolean;
  booked_by: string | null;
  notes: string | null;
}

const AdminSlots = () => {
  const { user } = useAuth();
  const [slots, setSlots] = useState<Slot[]>([]);
  const [bookerNames, setBookerNames] = useState<Record<string, string>>({});
  const [open, setOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Single slot form
  const [form, setForm] = useState({ date: '', time: '', duration: '30', notes: '' });

  // Bulk slot form
  const [bulk, setBulk] = useState({
    date: '',
    startTime: '09:00',
    endTime: '17:00',
    interval: '30',
  });

  const fetchSlots = async () => {
    // Notes are column-restricted; use the secure RPC that returns notes only to
    // staff/owners. Falls back to the column-safe view for non-eligible rows.
    const { data: withNotes } = await supabase.rpc('get_appointment_slots_with_notes');
    const { data: base } = await supabase
      .from('appointment_slots')
      .select('id, slot_at, duration_minutes, is_available, booked_by, appointment_id, created_by, created_at, updated_at')
      .order('slot_at', { ascending: true });
    const notesMap = new Map<string, string | null>(
      (withNotes || []).map((s: any) => [s.id, s.notes ?? null])
    );
    const list = (base || [])
      .map(s => ({ ...s, notes: notesMap.get(s.id) ?? null }))
      .sort((a, b) => new Date(a.slot_at).getTime() - new Date(b.slot_at).getTime());
    setSlots(list);

    // Resolve booker names
    const ids = Array.from(new Set(list.map(s => s.booked_by).filter(Boolean))) as string[];
    if (ids.length) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, phone')
        .in('user_id', ids);
      const map: Record<string, string> = {};
      profiles?.forEach(p => { map[p.user_id] = p.full_name || p.phone || 'Client'; });
      setBookerNames(map);
    }
  };

  useEffect(() => { fetchSlots(); }, []);

  const addSingle = async () => {
    if (!form.date || !form.time) return;
    setLoading(true);
    const slotAt = new Date(`${form.date}T${form.time}`).toISOString();
    const { error } = await supabase.from('appointment_slots').insert({
      slot_at: slotAt,
      duration_minutes: parseInt(form.duration) || 30,
      notes: form.notes || null,
      created_by: user?.id,
    });
    if (error) {
      toast.error(error.message.includes('unique') ? 'A slot already exists at this time' : 'Failed to create slot');
    } else {
      toast.success('Slot created');
      setOpen(false);
      setForm({ date: '', time: '', duration: '30', notes: '' });
      fetchSlots();
    }
    setLoading(false);
  };

  const addBulk = async () => {
    if (!bulk.date || !bulk.startTime || !bulk.endTime) return;
    setLoading(true);
    const interval = parseInt(bulk.interval) || 30;
    const start = new Date(`${bulk.date}T${bulk.startTime}`);
    const end = new Date(`${bulk.date}T${bulk.endTime}`);
    const rows: any[] = [];
    for (let t = new Date(start); t < end; t = new Date(t.getTime() + interval * 60000)) {
      rows.push({
        slot_at: t.toISOString(),
        duration_minutes: interval,
        created_by: user?.id,
      });
    }
    if (rows.length === 0) {
      toast.error('Invalid time range');
      setLoading(false);
      return;
    }
    // Insert one-by-one tolerating uniqueness conflicts
    let created = 0, skipped = 0;
    for (const row of rows) {
      const { error } = await supabase.from('appointment_slots').insert(row);
      if (error) skipped++; else created++;
    }
    toast.success(`${created} slot${created !== 1 ? 's' : ''} created${skipped ? `, ${skipped} skipped (duplicate)` : ''}`);
    setBulkOpen(false);
    setBulk({ date: '', startTime: '09:00', endTime: '17:00', interval: '30' });
    fetchSlots();
    setLoading(false);
  };

  const reopenSlot = async (id: string) => {
    const { error } = await supabase
      .from('appointment_slots')
      .update({ is_available: true, booked_by: null, appointment_id: null })
      .eq('id', id);
    if (error) toast.error('Failed to reopen slot');
    else { toast.success('Slot reopened'); fetchSlots(); }
  };

  const closeSlot = async (id: string) => {
    const { error } = await supabase
      .from('appointment_slots')
      .update({ is_available: false })
      .eq('id', id);
    if (error) toast.error('Failed to close slot');
    else { toast.success('Slot closed'); fetchSlots(); }
  };

  const deleteSlot = async (id: string) => {
    if (!confirm('Delete this slot?')) return;
    const { error } = await supabase.from('appointment_slots').delete().eq('id', id);
    if (error) toast.error('Failed to delete');
    else { toast.success('Slot deleted'); fetchSlots(); }
  };

  // Get tomorrow as min date
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  // Group by date for nicer display
  const grouped = slots.reduce<Record<string, Slot[]>>((acc, s) => {
    const day = new Date(s.slot_at).toLocaleDateString('en-GB', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });
    (acc[day] = acc[day] || []).push(s);
    return acc;
  }, {});

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-4 gap-2">
          <h1 className="font-serif text-2xl font-bold text-foreground">Available Slots</h1>
          <div className="flex gap-2">
            <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="border-primary text-primary">
                  <CalendarPlus className="h-4 w-4 mr-1" /> Bulk
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle className="font-serif">Create Slots for a Day</DialogTitle></DialogHeader>
                <div className="space-y-4 mt-2">
                  <div>
                    <Label>Date *</Label>
                    <Input type="date" min={minDate} value={bulk.date} onChange={e => setBulk(b => ({ ...b, date: e.target.value }))} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>From *</Label>
                      <Input type="time" value={bulk.startTime} onChange={e => setBulk(b => ({ ...b, startTime: e.target.value }))} />
                    </div>
                    <div>
                      <Label>To *</Label>
                      <Input type="time" value={bulk.endTime} onChange={e => setBulk(b => ({ ...b, endTime: e.target.value }))} />
                    </div>
                  </div>
                  <div>
                    <Label>Slot length (minutes) *</Label>
                    <Input type="number" min="15" step="15" value={bulk.interval} onChange={e => setBulk(b => ({ ...b, interval: e.target.value }))} />
                  </div>
                  <Button className="w-full" onClick={addBulk} disabled={loading || !bulk.date}>
                    {loading ? 'Creating...' : 'Create Slots'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-1" /> Add
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle className="font-serif">Add Slot</DialogTitle></DialogHeader>
                <div className="space-y-4 mt-2">
                  <div>
                    <Label>Date *</Label>
                    <Input type="date" min={minDate} value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
                  </div>
                  <div>
                    <Label>Time *</Label>
                    <Input type="time" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} />
                  </div>
                  <div>
                    <Label>Duration (minutes)</Label>
                    <Input type="number" min="15" step="15" value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))} />
                  </div>
                  <div>
                    <Label>Notes (optional)</Label>
                    <Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
                  </div>
                  <Button className="w-full" onClick={addSingle} disabled={loading || !form.date || !form.time}>
                    {loading ? 'Creating...' : 'Create Slot'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <p className="text-xs text-muted-foreground mb-4">
          Open slots clients can book. If a client doesn't show up, tap <RotateCcw className="inline h-3 w-3" /> to reopen the slot.
        </p>

        {slots.length === 0 ? (
          <Card className="p-8 text-center">
            <Clock className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No slots created yet</p>
            <p className="text-xs text-muted-foreground mt-1">Use Bulk to quickly fill a workday</p>
          </Card>
        ) : (
          <div className="space-y-5">
            {Object.entries(grouped).map(([day, daySlots]) => (
              <div key={day}>
                <h2 className="font-semibold text-sm text-foreground mb-2">{day}</h2>
                <div className="space-y-2">
                  {daySlots.map(slot => {
                    const time = new Date(slot.slot_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
                    const booked = !!slot.booked_by;
                    return (
                      <Card key={slot.id} className="p-3 flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                          booked ? 'bg-terracotta/20' : slot.is_available ? 'bg-accent/20' : 'bg-muted'
                        }`}>
                          <Clock className={`h-5 w-5 ${booked ? 'text-terracotta' : slot.is_available ? 'text-accent' : 'text-muted-foreground'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground">{time} <span className="text-xs text-muted-foreground font-normal">· {slot.duration_minutes}m</span></p>
                          {booked ? (
                            <p className="text-xs text-terracotta truncate">Booked: {bookerNames[slot.booked_by!] || 'Client'}</p>
                          ) : (
                            <p className="text-xs text-muted-foreground">{slot.is_available ? 'Open' : 'Closed'}</p>
                          )}
                        </div>
                        <div className="flex gap-1">
                          {booked || !slot.is_available ? (
                            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => reopenSlot(slot.id)} title="Reopen slot">
                              <RotateCcw className="h-4 w-4 text-primary" />
                            </Button>
                          ) : (
                            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => closeSlot(slot.id)} title="Close slot">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          )}
                          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => deleteSlot(slot.id)} title="Delete">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminSlots;
