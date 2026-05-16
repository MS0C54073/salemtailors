import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Scissors, ArrowLeft, Upload, X, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { z } from 'zod';

const APPOINTMENT_TYPES = [
  { value: 'consultation', label: 'Consultation' },
  { value: 'measurement', label: 'Measurement' },
  { value: 'fitting', label: 'Fitting' },
  { value: 'pickup', label: 'Pickup' },
  { value: 'custom_design', label: 'Custom Design Discussion' },
];

const SHOP_WHATSAPP = '260979287496';
const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB

const bookingSchema = z.object({
  name: z.string().trim().min(2, 'Name is required').max(80),
  phone: z.string().trim().min(7, 'Valid phone is required').max(20)
    .regex(/^[+0-9 ()-]+$/, 'Phone may contain digits, spaces and + - ( )'),
  type: z.string().min(1, 'Please choose appointment type'),
  date: z.string().min(1, 'Date is required'),
  time: z.string().min(1, 'Time is required'),
  notes: z.string().max(500).optional(),
});

const Book = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', phone: '', type: '', date: '', time: '', notes: '' });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const pad = (n: number) => String(n).padStart(2, '0');
  const fmtDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const fmtTime = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

  // Min date = today on the user's device.
  const minDate = fmtDate(new Date());

  // Auto-detect a sensible default date & time on first load (still editable).
  // Defaults to tomorrow at 10:00 (device local time), skipping Sunday.
  useEffect(() => {
    const suggested = new Date();
    suggested.setDate(suggested.getDate() + 1);
    if (suggested.getDay() === 0) suggested.setDate(suggested.getDate() + 1);
    setForm(f => ({
      ...f,
      date: f.date || fmtDate(suggested),
      time: f.time || '10:00',
    }));
  }, []);

  const useNow = () => {
    // Real-time "now" from the user's system clock, then suggest the next available slot
    // within shop hours (08:00–17:00).
    const now = new Date();
    // Add 60 minutes lead time, then round up to the next half-hour.
    now.setMinutes(now.getMinutes() + 60);
    const m = now.getMinutes();
    if (m === 0 || m === 30) {
      now.setSeconds(0, 0);
    } else if (m < 30) {
      now.setMinutes(30, 0, 0);
    } else {
      now.setHours(now.getHours() + 1, 0, 0, 0);
    }
    // Clamp to shop hours; roll to next day (skipping Sunday) if past closing.
    if (now.getHours() < 8) {
      now.setHours(8, 0, 0, 0);
    }
    if (now.getHours() >= 17) {
      now.setDate(now.getDate() + 1);
      now.setHours(10, 0, 0, 0);
    }
    if (now.getDay() === 0) {
      now.setDate(now.getDate() + 1);
      now.setHours(10, 0, 0, 0);
    }
    setForm(f => ({ ...f, date: fmtDate(now), time: fmtTime(now) }));
    toast.success(`Set to ${fmtDate(now)} ${fmtTime(now)} — feel free to edit.`);
  };

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please choose an image file');
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      toast.error('Image must be under 5MB');
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const clearImage = () => {
    setImageFile(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await supabase.storage.from('booking-images').upload(path, file, {
      contentType: file.type,
      upsert: false,
    });
    if (error) {
      console.error('Image upload failed', error);
      return null;
    }
    const { data } = supabase.storage.from('booking-images').getPublicUrl(path);
    return data.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = bookingSchema.safeParse(form);
    if (!parsed.success) {
      const firstError = Object.values(parsed.error.flatten().fieldErrors)[0]?.[0];
      toast.error(firstError || 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      let imageUrl: string | null = null;
      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
        if (!imageUrl) {
          toast.error('Could not upload image. Sending booking without it.');
        }
      }

      const typeLabel = APPOINTMENT_TYPES.find(t => t.value === form.type)?.label || form.type;
      const scheduledAt = new Date(`${form.date}T${form.time}`);
      const formattedDate = scheduledAt.toLocaleString('en-GB', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
      });

      const lines = [
        `*New Appointment Booking — Salem Tailors*`,
        ``,
        `*Name:* ${form.name}`,
        `*Phone:* ${form.phone}`,
        `*Service:* ${typeLabel}`,
        `*Preferred Date & Time:* ${formattedDate}`,
      ];
      if (form.notes?.trim()) lines.push(`*Notes:* ${form.notes.trim()}`);
      if (imageUrl) lines.push(``, `*Reference image:* ${imageUrl}`);

      const waUrl = `https://wa.me/${SHOP_WHATSAPP}?text=${encodeURIComponent(lines.join('\n'))}`;
      window.open(waUrl, '_blank', 'noopener,noreferrer');

      toast.success('Opening WhatsApp to confirm your booking...');
      setForm({ name: '', phone: '', type: '', date: '', time: '', notes: '' });
      clearImage();
    } catch (err) {
      console.error(err);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Seo
        title="Book an Appointment — Salem Tailors"
        description="Book a consultation, measurement, fitting or pickup with Salem Tailors in Lusaka. Pick a date and we'll confirm via WhatsApp."
        path="/book"
      />
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-background/85 backdrop-blur-md border-b border-border">
        <div className="container flex items-center justify-between h-14 px-4">
          <Link to="/" className="flex items-center gap-2">
            <Scissors className="h-5 w-5 text-primary" />
            <span className="font-serif text-lg font-bold text-foreground">Salem Tailors</span>
          </Link>
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-1">
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
        </div>
      </header>

      <main className="container px-4 py-8 max-w-lg">
        <div className="mb-6 text-center">
          <h1 className="font-serif text-3xl font-bold text-foreground mb-2">Book an Appointment</h1>
          <p className="text-sm text-muted-foreground">
            Fill in your details and we'll confirm via WhatsApp.
          </p>
        </div>

        <Card className="p-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Full Name *</Label>
              <Input id="name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Jane Banda" maxLength={80} required />
            </div>
            <div>
              <Label htmlFor="phone">Phone Number *</Label>
              <Input id="phone" type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+260 ..." maxLength={20} required />
            </div>
            <div>
              <Label>Service *</Label>
              <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
                <SelectTrigger><SelectValue placeholder="Choose a service" /></SelectTrigger>
                <SelectContent>
                  {APPOINTMENT_TYPES.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <Label>When would you like to come in? *</Label>
                <button type="button" onClick={useNow}
                  className="text-xs font-medium text-primary hover:underline">
                  Auto-detect
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="date" className="text-xs text-muted-foreground">Date</Label>
                  <Input id="date" type="date" min={minDate} value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} required />
                </div>
                <div>
                  <Label htmlFor="time" className="text-xs text-muted-foreground">Time</Label>
                  <Input id="time" type="time" min="08:00" max="17:00" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} required />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                We've suggested a time — tap any field to change it.
              </p>
            </div>
            <div>
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea id="notes" rows={3} maxLength={500} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Tell us about the design, fabric, occasion..." />
            </div>

            <div>
              <Label>Reference image (optional)</Label>
              {imagePreview ? (
                <div className="relative mt-1 rounded-md overflow-hidden border border-border">
                  <img src={imagePreview} alt="Reference" className="w-full max-h-64 object-cover" />
                  <Button type="button" variant="secondary" size="icon" onClick={clearImage}
                    className="absolute top-2 right-2 h-8 w-8 rounded-full shadow-md">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <label htmlFor="image" className="mt-1 flex flex-col items-center justify-center gap-2 border-2 border-dashed border-border rounded-md p-6 cursor-pointer hover:bg-muted/40 transition-colors">
                  <Upload className="h-6 w-6 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Tap to upload an example</span>
                  <span className="text-xs text-muted-foreground">PNG or JPG, up to 5MB</span>
                  <input id="image" type="file" accept="image/*" className="hidden" onChange={handleImage} />
                </label>
              )}
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Sending...</> : 'Send Booking via WhatsApp'}
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              We'll open WhatsApp so you can send your booking to the shop.
            </p>
          </form>
        </Card>
      </main>
    </div>
  );
};

export default Book;
