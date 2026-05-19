import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Scissors, ArrowLeft, MessageCircle, ShoppingBag, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import Seo from '@/components/Seo';
import { CartButton } from '@/components/CartDrawer';
import { useCart } from '@/contexts/CartContext';

const ADMIN_WHATSAPP = '260979287496';

const stockLabel = (s: string) =>
  s === 'in_stock' ? 'In stock' : s === 'low_stock' ? 'Low stock — order soon' : 'Out of stock';

const CatalogueItem = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { add: addToCart } = useCart();
  const [item, setItem] = useState<any>(null);
  const [images, setImages] = useState<any[]>([]);
  const [variants, setVariants] = useState<any[]>([]);
  const [activeImg, setActiveImg] = useState<string>('');
  const [activeVariant, setActiveVariant] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [inquiryOpen, setInquiryOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      const { data: it } = await supabase.from('catalogue_items').select('*').eq('slug', slug).neq('status', 'draft').maybeSingle();
      if (!it) { setLoading(false); return; }
      setItem(it);
      setActiveImg(it.primary_image_url || '');
      const [{ data: imgs }, { data: vars }] = await Promise.all([
        supabase.from('catalogue_item_images').select('*').eq('item_id', it.id).order('display_order'),
        supabase.from('catalogue_item_variants').select('*').eq('item_id', it.id).order('display_order'),
      ]);
      setImages(imgs || []);
      setVariants(vars || []);
      if (vars && vars.length) setActiveVariant(vars[0].id);
      setLoading(false);
    })();
  }, [slug]);

  const allImages = item?.primary_image_url
    ? [{ image_url: item.primary_image_url }, ...images.filter(i => i.image_url !== item.primary_image_url)]
    : images;

  const variant = variants.find(v => v.id === activeVariant);
  const price = variant?.price_override ?? item?.base_price;

  const sendInquiry = async () => {
    if (!user) {
      navigate(`/auth?redirect=/catalogue/${slug}`);
      return;
    }
    if (!message.trim()) return toast.error('Add a short message');
    setSending(true);
    // Find a staff member to send to
    const { data: staff } = await supabase.from('user_roles').select('user_id').in('role', ['super_admin', 'admin']).limit(1).maybeSingle();
    if (!staff) {
      setSending(false);
      return toast.error('No admin available — try WhatsApp');
    }
    const variantTxt = variant ? ` (${variant.name})` : '';
    const body = `📦 Catalogue inquiry: ${item.name}${variantTxt}\n\n${message.trim()}`;
    const { error } = await supabase.from('messages').insert({
      sender_id: user.id,
      receiver_id: staff.user_id,
      content: body,
    });
    setSending(false);
    if (error) return toast.error(error.message);
    toast.success('Inquiry sent! Check Messages.');
    setInquiryOpen(false);
    setMessage('');
  };

  const whatsappLink = item ? `https://wa.me/${ADMIN_WHATSAPP}?text=${encodeURIComponent(`Hi Salem Tailors, I'm interested in: ${item.name}${variant ? ` (${variant.name})` : ''}`)}` : '#';

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
        <p className="text-muted-foreground mb-4">Item not found.</p>
        <Link to="/catalogue"><Button>Browse catalogue</Button></Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Seo
        title={`${item.name} — Salem Tailors`}
        description={(item.description || `${item.name} handcrafted by Salem Tailors in Lusaka.`).slice(0, 160)}
        path={`/catalogue/${item.slug}`}
        type="product"
        image={item.primary_image_url || activeImg || undefined}
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: item.name,
          description: item.description || undefined,
          image: item.primary_image_url || undefined,
          brand: { '@type': 'Brand', name: 'Salem Tailors' },
          offers: item.base_price ? {
            '@type': 'Offer',
            price: Number(item.base_price),
            priceCurrency: item.currency || 'ZMW',
            availability: item.stock_status === 'out_of_stock'
              ? 'https://schema.org/OutOfStock'
              : 'https://schema.org/InStock',
            url: `https://salemtailors.lovable.app/catalogue/${item.slug}`,
          } : undefined,
        }}
      />
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container flex items-center justify-between h-14 px-4">
          <Link to="/catalogue" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            <Scissors className="h-5 w-5 text-primary" />
            <span className="font-serif text-lg font-bold text-foreground">Catalogue</span>
          </Link>
          <CartButton />
        </div>
      </header>

      <main className="container px-4 py-6 md:py-10">
        <div className="grid md:grid-cols-2 gap-6 md:gap-10 max-w-5xl mx-auto">
          {/* Gallery */}
          <div>
            <motion.div
              key={activeImg}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="aspect-square rounded-xl overflow-hidden bg-muted border border-border"
            >
              {activeImg && <img src={activeImg} alt={item.name} className="w-full h-full object-cover" />}
            </motion.div>
            {allImages.length > 1 && (
              <div className="grid grid-cols-5 gap-2 mt-3">
                {allImages.slice(0, 5).map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImg(img.image_url)}
                    className={`aspect-square rounded-md overflow-hidden border-2 transition-colors ${activeImg === img.image_url ? 'border-primary' : 'border-transparent'}`}
                  >
                    <img src={img.image_url} alt="" className="w-full h-full object-cover" loading="lazy" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-3">
              <h1 className="font-serif text-2xl md:text-3xl font-bold text-foreground">{item.name}</h1>
              {item.is_featured && <Badge className="bg-gold text-foreground shrink-0">Featured</Badge>}
            </div>
            <div className="flex items-center gap-3">
              <p className="text-2xl font-bold text-primary">
                {price ? `${item.currency} ${Number(price).toLocaleString()}` : 'Price on inquiry'}
              </p>
              <Badge variant="outline" className={
                item.stock_status === 'in_stock' ? 'border-primary/30 text-primary' :
                item.stock_status === 'low_stock' ? 'border-gold/30 text-gold' :
                'border-destructive/30 text-destructive'
              }>{stockLabel(item.stock_status)}</Badge>
            </div>

            {item.description && (
              <Card className="p-4 bg-card/50">
                <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{item.description}</p>
              </Card>
            )}

            {variants.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">Choose option</p>
                <div className="flex flex-wrap gap-2">
                  {variants.map(v => (
                    <button
                      key={v.id}
                      onClick={() => setActiveVariant(v.id)}
                      disabled={v.stock_status === 'out_of_stock'}
                      className={`px-3 py-2 rounded-md border text-sm transition-colors ${
                        activeVariant === v.id
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border bg-background hover:border-primary'
                      } ${v.stock_status === 'out_of_stock' ? 'opacity-50 cursor-not-allowed line-through' : ''}`}
                    >
                      {v.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <Button
                size="lg"
                disabled={item.status === 'sold_out' || item.stock_status === 'out_of_stock' || (variant && variant.stock_status === 'out_of_stock')}
                onClick={() => {
                  addToCart({
                    id: variant ? `${item.id}:${variant.id}` : item.id,
                    itemId: item.id,
                    variantId: variant?.id || null,
                    slug: item.slug,
                    name: item.name,
                    variantName: variant?.name || null,
                    price: price != null ? Number(price) : null,
                    currency: item.currency || 'ZMW',
                    image: item.primary_image_url || activeImg || null,
                  });
                  toast.success('Added to cart');
                }}
                className="gap-2 w-full sm:w-auto"
              >
                <ShoppingBag className="h-4 w-4" />
                {item.status === 'sold_out' ? 'Sold out' : 'Add to cart'}
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => setInquiryOpen(true)}
                className="gap-2 w-full sm:w-auto"
              >
                Request custom
              </Button>
              <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                <Button size="lg" variant="outline" className="gap-2 w-full sm:w-auto bg-[#25D366]/10 border-[#25D366]/30 hover:bg-[#25D366]/20">
                  <MessageCircle className="h-4 w-4 text-[#25D366]" />
                  WhatsApp
                </Button>
              </a>
            </div>
          </div>
        </div>
      </main>

      <Dialog open={inquiryOpen} onOpenChange={setInquiryOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-serif">Request "{item.name}"</DialogTitle>
            <DialogDescription>
              {user ? 'We\'ll send your message to our team and reply in chat.' : 'Sign in to send a request, or use WhatsApp instead.'}
            </DialogDescription>
          </DialogHeader>
          {user ? (
            <Textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder={`Hi! I'd like to order ${item.name}${variant ? ` (${variant.name})` : ''}. Please confirm availability and pickup options.`}
              rows={5}
            />
          ) : (
            <p className="text-sm text-muted-foreground">You can chat directly via WhatsApp without signing in.</p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setInquiryOpen(false)}>Cancel</Button>
            {user ? (
              <Button onClick={sendInquiry} disabled={sending}>
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send inquiry'}
              </Button>
            ) : (
              <Button onClick={() => navigate(`/auth?redirect=/catalogue/${slug}`)}>Sign in</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CatalogueItem;
