import { useEffect, useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Scissors, Search, Package, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import Seo from '@/components/Seo';

type Item = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category_id: string | null;
  base_price: number | null;
  currency: string;
  status: string;
  stock_status: string;
  is_featured: boolean;
  primary_image_url: string | null;
};
type Category = { id: string; name: string; slug: string };

const stockBadge = (s: string) => {
  if (s === 'in_stock') return <Badge className="bg-primary/10 text-primary border-primary/20" variant="outline">In stock</Badge>;
  if (s === 'low_stock') return <Badge className="bg-gold/10 text-gold border-gold/30" variant="outline">Low stock</Badge>;
  return <Badge variant="outline" className="text-destructive border-destructive/30">Out of stock</Badge>;
};

const Catalogue = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [params, setParams] = useSearchParams();
  const activeCat = params.get('cat') || 'all';
  const q = params.get('q') || '';

  useEffect(() => {
    (async () => {
      const [{ data: it }, { data: cat }] = await Promise.all([
        supabase.from('catalogue_items').select('*').neq('status', 'draft').order('is_featured', { ascending: false }).order('display_order'),
        supabase.from('catalogue_categories').select('*').eq('is_active', true).order('display_order'),
      ]);
      setItems((it as Item[]) || []);
      setCategories((cat as Category[]) || []);
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    return items.filter(it => {
      if (activeCat !== 'all' && it.category_id !== activeCat) return false;
      if (q && !it.name.toLowerCase().includes(q.toLowerCase()) && !(it.description || '').toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [items, activeCat, q]);

  const setParam = (key: string, val: string) => {
    const next = new URLSearchParams(params);
    if (!val || val === 'all') next.delete(key); else next.set(key, val);
    setParams(next, { replace: true });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container flex items-center justify-between h-14 px-4">
          <Link to="/" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            <Scissors className="h-5 w-5 text-primary" />
            <span className="font-serif text-lg font-bold text-foreground">Salem Tailors</span>
          </Link>
          <Link to="/book"><Button size="sm">Book</Button></Link>
        </div>
      </header>

      <section className="border-b border-border bg-card/30">
        <div className="container px-4 py-8 md:py-10">
          <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-2">Shop the Catalogue</h1>
          <p className="text-muted-foreground text-sm md:text-base">Bags, caps, fabrics & ready-to-wear handcrafted by Salem Tailors.</p>
          <div className="mt-5 relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={q}
              onChange={e => setParam('q', e.target.value)}
              placeholder="Search items..."
              className="pl-9"
            />
          </div>
        </div>
      </section>

      <section className="container px-4 py-6">
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 mb-5 scrollbar-none">
          <Button
            size="sm"
            variant={activeCat === 'all' ? 'default' : 'outline'}
            onClick={() => setParam('cat', 'all')}
            className="shrink-0"
          >All</Button>
          {categories.map(c => (
            <Button
              key={c.id}
              size="sm"
              variant={activeCat === c.id ? 'default' : 'outline'}
              onClick={() => setParam('cat', c.id)}
              className="shrink-0"
            >{c.name}</Button>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-square rounded-lg bg-muted animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <Card className="p-10 text-center">
            <Package className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No items match your filters.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {filtered.map((it, i) => (
              <motion.div
                key={it.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.03, 0.3) }}
              >
                <Link to={`/catalogue/${it.slug}`}>
                  <Card className="overflow-hidden group hover:shadow-warm transition-shadow h-full">
                    <div className="aspect-square relative bg-muted overflow-hidden">
                      {it.primary_image_url && (
                        <img src={it.primary_image_url} alt={it.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                      )}
                      {it.is_featured && (
                        <Badge className="absolute top-2 left-2 bg-gold text-foreground text-[10px]">Featured</Badge>
                      )}
                      {it.status === 'sold_out' && (
                        <div className="absolute inset-0 bg-foreground/60 flex items-center justify-center">
                          <Badge variant="destructive">Sold Out</Badge>
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <p className="font-serif font-semibold text-foreground text-sm md:text-base truncate">{it.name}</p>
                      <div className="flex items-center justify-between mt-1.5 gap-2">
                        <p className="text-sm font-semibold text-primary">
                          {it.base_price ? `${it.currency} ${Number(it.base_price).toLocaleString()}` : 'Inquire'}
                        </p>
                        {stockBadge(it.stock_status)}
                      </div>
                    </div>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Catalogue;
