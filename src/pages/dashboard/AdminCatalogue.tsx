import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Plus, Star, Trash2, Image as ImageIcon, Loader2, Package, X, Pencil } from 'lucide-react';
import { toast } from 'sonner';

type Category = { id: string; name: string; slug: string };
type Variant = { id?: string; name: string; sku?: string; price_override?: number | null; stock_status: 'in_stock' | 'low_stock' | 'out_of_stock' };
type Item = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category_id: string | null;
  base_price: number | null;
  currency: string;
  status: 'active' | 'draft' | 'sold_out';
  stock_status: 'in_stock' | 'low_stock' | 'out_of_stock';
  is_featured: boolean;
  primary_image_url: string | null;
};

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || `item-${Date.now()}`;

const emptyForm = () => ({
  id: '' as string,
  name: '',
  description: '',
  category_id: '' as string,
  base_price: '' as string,
  status: 'active' as Item['status'],
  stock_status: 'in_stock' as Item['stock_status'],
  is_featured: false,
  primary_image_url: '',
  gallery: [] as string[],
  variants: [] as Variant[],
});

const AdminCatalogue = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm());

  const load = async () => {
    const [{ data: it }, { data: cat }] = await Promise.all([
      supabase.from('catalogue_items').select('*').order('display_order').order('created_at', { ascending: false }),
      supabase.from('catalogue_categories').select('*').eq('is_active', true).order('display_order'),
    ]);
    setItems((it as Item[]) || []);
    setCategories((cat as Category[]) || []);
  };
  useEffect(() => { load(); }, []);

  const uploadFile = async (file: File): Promise<string | null> => {
    if (file.size > 15 * 1024 * 1024) {
      toast.error(`${file.name} is over 15MB. Please use a smaller image.`);
      return null;
    }
    if (!file.type.startsWith('image/')) {
      toast.error(`${file.name} is not an image.`);
      return null;
    }
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '');
    const path = `items/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await supabase.storage.from('catalogue').upload(path, file, {
      cacheControl: '3600',
      contentType: file.type,
      upsert: false,
    });
    if (error) {
      toast.error(`Upload failed: ${error.message}`);
      return null;
    }
    return supabase.storage.from('catalogue').getPublicUrl(path).data.publicUrl;
  };

  const handlePrimary = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const url = await uploadFile(file);
    if (url) setForm(f => ({ ...f, primary_image_url: url }));
    setUploading(false);
  };

  const handleGallery = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    const urls: string[] = [];
    for (const f of files) {
      const u = await uploadFile(f);
      if (u) urls.push(u);
    }
    setForm(f => ({ ...f, gallery: [...f.gallery, ...urls] }));
    setUploading(false);
    e.target.value = '';
  };

  const openNew = () => {
    setForm(emptyForm());
    setOpen(true);
  };

  const openEdit = async (item: Item) => {
    const [{ data: imgs }, { data: vars }] = await Promise.all([
      supabase.from('catalogue_item_images').select('*').eq('item_id', item.id).order('display_order'),
      supabase.from('catalogue_item_variants').select('*').eq('item_id', item.id).order('display_order'),
    ]);
    setForm({
      id: item.id,
      name: item.name,
      description: item.description || '',
      category_id: item.category_id || '',
      base_price: item.base_price != null ? String(item.base_price) : '',
      status: item.status,
      stock_status: item.stock_status,
      is_featured: item.is_featured,
      primary_image_url: item.primary_image_url || '',
      gallery: (imgs || []).map((i: any) => i.image_url),
      variants: (vars || []).map((v: any) => ({
        id: v.id, name: v.name, sku: v.sku, price_override: v.price_override, stock_status: v.stock_status,
      })),
    });
    setOpen(true);
  };

  const save = async () => {
    if (!form.name.trim()) return toast.error('Name required');
    if (!form.primary_image_url) return toast.error('Primary image required');
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      slug: form.id ? undefined : slugify(form.name) + '-' + Math.random().toString(36).slice(2, 6),
      description: form.description.trim() || null,
      category_id: form.category_id || null,
      base_price: form.base_price ? Number(form.base_price) : null,
      status: form.status,
      stock_status: form.stock_status,
      is_featured: form.is_featured,
      primary_image_url: form.primary_image_url,
    };

    let itemId = form.id;
    if (form.id) {
      const { error } = await supabase.from('catalogue_items').update(payload).eq('id', form.id);
      if (error) { setSaving(false); return toast.error(error.message); }
    } else {
      const { data, error } = await supabase.from('catalogue_items').insert(payload as any).select('id').single();
      if (error || !data) { setSaving(false); return toast.error(error?.message || 'Failed'); }
      itemId = data.id;
    }

    // Replace gallery
    await supabase.from('catalogue_item_images').delete().eq('item_id', itemId);
    if (form.gallery.length) {
      await supabase.from('catalogue_item_images').insert(
        form.gallery.map((url, i) => ({ item_id: itemId, image_url: url, display_order: i }))
      );
    }
    // Replace variants
    await supabase.from('catalogue_item_variants').delete().eq('item_id', itemId);
    if (form.variants.length) {
      await supabase.from('catalogue_item_variants').insert(
        form.variants.map((v, i) => ({
          item_id: itemId,
          name: v.name,
          sku: v.sku || null,
          price_override: v.price_override ?? null,
          stock_status: v.stock_status,
          display_order: i,
        }))
      );
    }

    setSaving(false);
    setOpen(false);
    toast.success(form.id ? 'Updated' : 'Created');
    load();
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this item permanently?')) return;
    const { error } = await supabase.from('catalogue_items').delete().eq('id', id);
    if (error) return toast.error(error.message);
    toast.success('Deleted');
    load();
  };

  const toggleFeatured = async (item: Item) => {
    await supabase.from('catalogue_items').update({ is_featured: !item.is_featured }).eq('id', item.id);
    load();
  };

  const addVariant = () => setForm(f => ({ ...f, variants: [...f.variants, { name: '', stock_status: 'in_stock' }] }));
  const updVariant = (i: number, patch: Partial<Variant>) =>
    setForm(f => ({ ...f, variants: f.variants.map((v, idx) => idx === i ? { ...v, ...patch } : v) }));
  const rmVariant = (i: number) => setForm(f => ({ ...f, variants: f.variants.filter((_, idx) => idx !== i) }));

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h1 className="font-serif text-2xl font-bold text-foreground">Catalogue</h1>
            <p className="text-xs text-muted-foreground">Bags, caps, fabrics & ready-to-wear</p>
          </div>
          <Button size="sm" onClick={openNew} className="gap-1">
            <Plus className="h-4 w-4" /> New item
          </Button>
        </div>

        {items.length === 0 ? (
          <Card className="p-10 text-center">
            <Package className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground mb-4">No catalogue items yet</p>
            <Button onClick={openNew} className="gap-1"><Plus className="h-4 w-4" /> Add your first item</Button>
          </Card>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {items.map(item => (
              <Card key={item.id} className="overflow-hidden group">
                <div className="aspect-square relative bg-muted">
                  {item.primary_image_url && (
                    <img src={item.primary_image_url} alt={item.name} className="w-full h-full object-cover" loading="lazy" />
                  )}
                  <div className="absolute top-1 left-1 flex flex-col gap-1">
                    {item.is_featured && (
                      <Badge className="bg-gold text-foreground text-[10px] gap-0.5"><Star className="h-2.5 w-2.5 fill-current" /> Featured</Badge>
                    )}
                    {item.status !== 'active' && (
                      <Badge variant="secondary" className="text-[10px] capitalize">{item.status.replace('_', ' ')}</Badge>
                    )}
                  </div>
                  <div className="absolute top-1 right-1 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button size="icon" variant="secondary" className="h-7 w-7" onClick={() => toggleFeatured(item)} title="Featured">
                      <Star className={`h-3 w-3 ${item.is_featured ? 'fill-current text-gold' : ''}`} />
                    </Button>
                    <Button size="icon" variant="secondary" className="h-7 w-7" onClick={() => openEdit(item)} title="Edit">
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button size="icon" variant="destructive" className="h-7 w-7" onClick={() => remove(item.id)} title="Delete">
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div className="p-2">
                  <p className="text-xs font-semibold text-foreground truncate">{item.name}</p>
                  <div className="flex items-center justify-between mt-0.5">
                    <p className="text-[10px] text-muted-foreground">
                      {item.base_price ? `${item.currency} ${Number(item.base_price).toLocaleString()}` : '—'}
                    </p>
                    <span className={`text-[10px] capitalize ${item.stock_status === 'in_stock' ? 'text-primary' : item.stock_status === 'low_stock' ? 'text-gold' : 'text-destructive'}`}>
                      {item.stock_status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif">{form.id ? 'Edit Item' : 'New Item'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Primary image */}
            <div>
              <Label>Primary image *</Label>
              {form.primary_image_url ? (
                <div className="relative w-40 h-40">
                  <img src={form.primary_image_url} alt="primary" className="w-full h-full object-cover rounded-md border border-border" />
                  <Button size="icon" variant="secondary" className="absolute top-1 right-1 h-7 w-7" onClick={() => setForm(f => ({ ...f, primary_image_url: '' }))}>
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-40 h-40 rounded-md border-2 border-dashed border-border cursor-pointer hover:border-primary transition-colors">
                  {uploading ? <Loader2 className="h-6 w-6 animate-spin text-primary" /> : (
                    <>
                      <ImageIcon className="h-8 w-8 text-muted-foreground mb-1" />
                      <span className="text-xs text-muted-foreground">Upload</span>
                    </>
                  )}
                  <input type="file" accept="image/*" onChange={handlePrimary} className="hidden" disabled={uploading} />
                </label>
              )}
            </div>

            {/* Gallery */}
            <div>
              <Label>Gallery (additional images)</Label>
              <div className="grid grid-cols-4 gap-2 mt-1">
                {form.gallery.map((url, i) => (
                  <div key={i} className="relative aspect-square">
                    <img src={url} alt="" className="w-full h-full object-cover rounded border border-border" />
                    <Button size="icon" variant="secondary" className="absolute top-0.5 right-0.5 h-5 w-5" onClick={() => setForm(f => ({ ...f, gallery: f.gallery.filter((_, idx) => idx !== i) }))}>
                      <X className="h-2.5 w-2.5" />
                    </Button>
                  </div>
                ))}
                <label className="aspect-square flex flex-col items-center justify-center rounded border-2 border-dashed border-border cursor-pointer hover:border-primary">
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin text-primary" /> : <Plus className="h-5 w-5 text-muted-foreground" />}
                  <input type="file" accept="image/*" multiple onChange={handleGallery} className="hidden" disabled={uploading} />
                </label>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label>Name *</Label>
                <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Chitenge Tote Bag" />
              </div>
              <div>
                <Label>Category</Label>
                <select
                  value={form.category_id}
                  onChange={e => setForm({ ...form, category_id: e.target.value })}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="">— Uncategorised —</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <Label>Price (ZMW)</Label>
                <Input type="number" inputMode="decimal" value={form.base_price} onChange={e => setForm({ ...form, base_price: e.target.value })} />
              </div>
              <div>
                <Label>Status</Label>
                <select
                  value={form.status}
                  onChange={e => setForm({ ...form, status: e.target.value as Item['status'] })}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="active">Active (visible)</option>
                  <option value="draft">Draft (hidden)</option>
                  <option value="sold_out">Sold out</option>
                </select>
              </div>
              <div>
                <Label>Stock</Label>
                <select
                  value={form.stock_status}
                  onChange={e => setForm({ ...form, stock_status: e.target.value as Item['stock_status'] })}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="in_stock">In stock</option>
                  <option value="low_stock">Low stock</option>
                  <option value="out_of_stock">Out of stock</option>
                </select>
              </div>
              <div className="col-span-2">
                <Label>Description</Label>
                <Textarea rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={form.is_featured} onChange={e => setForm({ ...form, is_featured: e.target.checked })} />
              <span>Feature on catalogue homepage</span>
            </label>

            {/* Variants */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Variants (size, color, etc.)</Label>
                <Button type="button" size="sm" variant="outline" onClick={addVariant} className="gap-1">
                  <Plus className="h-3 w-3" /> Add
                </Button>
              </div>
              {form.variants.length === 0 ? (
                <p className="text-xs text-muted-foreground">No variants — single product.</p>
              ) : (
                <div className="space-y-2">
                  {form.variants.map((v, i) => (
                    <div key={i} className="grid grid-cols-12 gap-2 items-end">
                      <div className="col-span-5">
                        <Input placeholder="e.g. Large / Black" value={v.name} onChange={e => updVariant(i, { name: e.target.value })} />
                      </div>
                      <div className="col-span-3">
                        <Input placeholder="Price" type="number" value={v.price_override ?? ''} onChange={e => updVariant(i, { price_override: e.target.value ? Number(e.target.value) : null })} />
                      </div>
                      <div className="col-span-3">
                        <select
                          value={v.stock_status}
                          onChange={e => updVariant(i, { stock_status: e.target.value as Variant['stock_status'] })}
                          className="w-full h-10 rounded-md border border-input bg-background px-2 text-xs"
                        >
                          <option value="in_stock">In stock</option>
                          <option value="low_stock">Low</option>
                          <option value="out_of_stock">Out</option>
                        </select>
                      </div>
                      <Button type="button" size="icon" variant="ghost" className="h-9 w-9" onClick={() => rmVariant(i)}>
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving || uploading}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default AdminCatalogue;
