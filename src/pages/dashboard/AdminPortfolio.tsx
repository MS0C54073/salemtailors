import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Plus, Star, Trash2, Image as ImageIcon, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { GARMENT_CATEGORIES, getCategoryLabel } from '@/lib/supabase-helpers';

const AdminPortfolio = () => {
  const [items, setItems] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState<any>({ title: '', description: '', category: 'casual_wear', is_featured: false, image_url: '' });

  const load = async () => {
    const { data } = await supabase.from('portfolio_items').select('*').order('display_order', { ascending: true }).order('created_at', { ascending: false });
    setItems(data || []);
  };

  useEffect(() => { load(); }, []);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const path = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const { error } = await supabase.storage.from('portfolio').upload(path, file);
    if (error) { toast.error(error.message); setUploading(false); return; }
    const { data } = supabase.storage.from('portfolio').getPublicUrl(path);
    setForm({ ...form, image_url: data.publicUrl });
    setUploading(false);
  };

  const save = async () => {
    if (!form.title.trim() || !form.image_url) return toast.error('Title and image required');
    const { error } = await supabase.from('portfolio_items').insert({
      title: form.title.trim(),
      description: form.description?.trim() || null,
      category: form.category,
      is_featured: form.is_featured,
      image_url: form.image_url,
    });
    if (error) return toast.error(error.message);
    toast.success('Added to portfolio');
    setOpen(false);
    setForm({ title: '', description: '', category: 'casual_wear', is_featured: false, image_url: '' });
    load();
  };

  const toggleFeatured = async (id: string, current: boolean) => {
    const { error } = await supabase.from('portfolio_items').update({ is_featured: !current }).eq('id', id);
    if (error) return toast.error(error.message);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this portfolio item?')) return;
    const { error } = await supabase.from('portfolio_items').delete().eq('id', id);
    if (error) return toast.error(error.message);
    toast.success('Deleted');
    load();
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h1 className="font-serif text-2xl font-bold text-foreground">Portfolio</h1>
            <p className="text-xs text-muted-foreground">Featured items appear on homepage</p>
          </div>
          <Button size="sm" onClick={() => setOpen(true)} className="gap-1">
            <Plus className="h-4 w-4" /> Add
          </Button>
        </div>

        {items.length === 0 ? (
          <Card className="p-10 text-center">
            <ImageIcon className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No portfolio items yet</p>
          </Card>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {items.map(item => (
              <Card key={item.id} className="overflow-hidden group">
                <div className="aspect-square relative bg-muted">
                  <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                  {item.is_featured && (
                    <div className="absolute top-1 left-1 bg-gold text-foreground text-[10px] px-1.5 py-0.5 rounded font-semibold flex items-center gap-0.5">
                      <Star className="h-2.5 w-2.5 fill-current" /> Featured
                    </div>
                  )}
                  <div className="absolute top-1 right-1 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button size="icon" variant="secondary" className="h-7 w-7" onClick={() => toggleFeatured(item.id, item.is_featured)}>
                      <Star className={`h-3 w-3 ${item.is_featured ? 'fill-current text-gold' : ''}`} />
                    </Button>
                    <Button size="icon" variant="destructive" className="h-7 w-7" onClick={() => remove(item.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div className="p-2">
                  <p className="text-xs font-semibold text-foreground truncate">{item.title}</p>
                  <p className="text-[10px] text-muted-foreground">{getCategoryLabel(item.category)}</p>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-serif">Add Portfolio Item</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Photo *</Label>
              {form.image_url ? (
                <div className="relative">
                  <img src={form.image_url} alt="preview" className="w-full aspect-square object-cover rounded-md border border-border" />
                  <Button size="sm" variant="secondary" className="absolute top-2 right-2" onClick={() => setForm({ ...form, image_url: '' })}>Replace</Button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full aspect-square rounded-md border-2 border-dashed border-border cursor-pointer hover:border-primary transition-colors">
                  {uploading ? <Loader2 className="h-6 w-6 animate-spin text-primary" /> : (
                    <>
                      <ImageIcon className="h-8 w-8 text-muted-foreground mb-1" />
                      <span className="text-xs text-muted-foreground">Tap to upload</span>
                    </>
                  )}
                  <input type="file" accept="image/*" onChange={handleFile} className="hidden" disabled={uploading} />
                </label>
              )}
            </div>
            <div>
              <Label>Title *</Label>
              <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
            </div>
            <div>
              <Label>Category</Label>
              <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                {GARMENT_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={form.is_featured} onChange={e => setForm({ ...form, is_featured: e.target.checked })} />
              <span>Show on homepage gallery</span>
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={uploading}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default AdminPortfolio;
