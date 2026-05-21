import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GARMENT_CATEGORIES } from '@/lib/supabase-helpers';
import { toast } from 'sonner';
import { Loader2, Upload, X } from 'lucide-react';

const NewGarmentRequest = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    category: '',
    description: '',
    eventDate: '',
    notes: '',
  });
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  const handleImageAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (images.length + files.length > 5) {
      toast.error('Maximum 5 images allowed');
      return;
    }
    setImages(prev => [...prev, ...files]);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => setPreviews(prev => [...prev, reader.result as string]);
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !form.category || !form.description) return;
    setLoading(true);

    try {
      // Upload images
      const imageUrls: string[] = [];
      for (const file of images) {
        if (!file.type.startsWith('image/')) { toast.error(`${file.name} is not an image`); continue; }
        if (file.size > 15 * 1024 * 1024) { toast.error(`${file.name} is over 15MB`); continue; }
        const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '');
        const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('garment-images')
          .upload(path, file, { cacheControl: '3600', contentType: file.type, upsert: false });
        if (uploadError) {
          toast.error(`Upload failed: ${uploadError.message}`);
        } else {
          const { data: { publicUrl } } = supabase.storage.from('garment-images').getPublicUrl(path);
          imageUrls.push(publicUrl);
        }
      }

      const { error } = await supabase.from('garment_requests').insert({
        client_id: user.id,
        category: form.category as any,
        description: form.description,
        event_date: form.eventDate || null,
        notes: form.notes || null,
        reference_images: imageUrls,
      });

      if (error) throw error;
      toast.success('Garment request submitted!');
      navigate('/dashboard/client/orders');
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-lg mx-auto">
        <h1 className="font-serif text-2xl font-bold text-foreground mb-1">New Garment Request</h1>
        <p className="text-sm text-muted-foreground mb-6">Tell us what you'd like us to create</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Category *</Label>
            <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
              <SelectTrigger><SelectValue placeholder="Select garment type" /></SelectTrigger>
              <SelectContent>
                {GARMENT_CATEGORIES.map(c => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              placeholder="Describe your garment in detail — style, fabric preferences, colors, etc."
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              required
              rows={4}
            />
          </div>

          <div>
            <Label htmlFor="eventDate">Event Date (if applicable)</Label>
            <Input
              id="eventDate"
              type="date"
              value={form.eventDate}
              onChange={e => setForm(f => ({ ...f, eventDate: e.target.value }))}
            />
          </div>

          <div>
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              placeholder="Budget range, urgency, special instructions..."
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              rows={2}
            />
          </div>

          {/* Image Upload */}
          <div>
            <Label>Reference Images (max 5)</Label>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {previews.map((p, i) => (
                <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-border">
                  <img src={p} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute top-1 right-1 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {images.length < 5 && (
                <label className="aspect-square rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors">
                  <Upload className="h-5 w-5 text-muted-foreground mb-1" />
                  <span className="text-xs text-muted-foreground">Upload</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageAdd} />
                </label>
              )}
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={loading || !form.category || !form.description}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Submit Request
          </Button>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default NewGarmentRequest;
