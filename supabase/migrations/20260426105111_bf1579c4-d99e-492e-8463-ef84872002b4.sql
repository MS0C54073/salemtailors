-- Catalogue categories
CREATE TABLE public.catalogue_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  display_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Catalogue item status
CREATE TYPE public.catalogue_status AS ENUM ('active', 'draft', 'sold_out');
CREATE TYPE public.stock_status AS ENUM ('in_stock', 'low_stock', 'out_of_stock');

-- Catalogue items
CREATE TABLE public.catalogue_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  category_id UUID REFERENCES public.catalogue_categories(id) ON DELETE SET NULL,
  base_price NUMERIC(12,2),
  currency TEXT NOT NULL DEFAULT 'ZMW',
  status public.catalogue_status NOT NULL DEFAULT 'active',
  stock_status public.stock_status NOT NULL DEFAULT 'in_stock',
  is_featured BOOLEAN NOT NULL DEFAULT false,
  primary_image_url TEXT,
  display_order INT NOT NULL DEFAULT 0,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_catalogue_items_status ON public.catalogue_items(status);
CREATE INDEX idx_catalogue_items_category ON public.catalogue_items(category_id);

-- Item images (gallery)
CREATE TABLE public.catalogue_item_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES public.catalogue_items(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  alt_text TEXT,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_catalogue_item_images_item ON public.catalogue_item_images(item_id);

-- Item variants
CREATE TABLE public.catalogue_item_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES public.catalogue_items(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sku TEXT,
  price_override NUMERIC(12,2),
  stock_status public.stock_status NOT NULL DEFAULT 'in_stock',
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_catalogue_item_variants_item ON public.catalogue_item_variants(item_id);

-- Triggers for updated_at
CREATE TRIGGER trg_catalogue_categories_updated BEFORE UPDATE ON public.catalogue_categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_catalogue_items_updated BEFORE UPDATE ON public.catalogue_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_catalogue_item_variants_updated BEFORE UPDATE ON public.catalogue_item_variants
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.catalogue_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalogue_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalogue_item_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalogue_item_variants ENABLE ROW LEVEL SECURITY;

-- Categories: public read active, staff manage
CREATE POLICY "Anyone view active categories" ON public.catalogue_categories
  FOR SELECT USING (is_active = true OR public.is_staff(auth.uid()));
CREATE POLICY "Staff manage categories" ON public.catalogue_categories
  FOR ALL USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- Items: public read non-draft, staff manage
CREATE POLICY "Anyone view active items" ON public.catalogue_items
  FOR SELECT USING (status <> 'draft' OR public.is_staff(auth.uid()));
CREATE POLICY "Staff manage items" ON public.catalogue_items
  FOR ALL USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- Images: public read if item visible, staff manage
CREATE POLICY "Anyone view item images" ON public.catalogue_item_images
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.catalogue_items i
            WHERE i.id = item_id AND (i.status <> 'draft' OR public.is_staff(auth.uid())))
  );
CREATE POLICY "Staff manage item images" ON public.catalogue_item_images
  FOR ALL USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- Variants: public read if item visible, staff manage
CREATE POLICY "Anyone view item variants" ON public.catalogue_item_variants
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.catalogue_items i
            WHERE i.id = item_id AND (i.status <> 'draft' OR public.is_staff(auth.uid())))
  );
CREATE POLICY "Staff manage item variants" ON public.catalogue_item_variants
  FOR ALL USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- Storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('catalogue', 'catalogue', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Catalogue images public read" ON storage.objects
  FOR SELECT USING (bucket_id = 'catalogue');
CREATE POLICY "Staff upload catalogue images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'catalogue' AND public.is_staff(auth.uid()));
CREATE POLICY "Staff update catalogue images" ON storage.objects
  FOR UPDATE USING (bucket_id = 'catalogue' AND public.is_staff(auth.uid()));
CREATE POLICY "Staff delete catalogue images" ON storage.objects
  FOR DELETE USING (bucket_id = 'catalogue' AND public.is_staff(auth.uid()));

-- Seed categories
INSERT INTO public.catalogue_categories (name, slug, display_order) VALUES
  ('Bags', 'bags', 1),
  ('Caps & Hats', 'caps-hats', 2),
  ('Accessories', 'accessories', 3),
  ('Fabrics', 'fabrics', 4),
  ('Ready-to-Wear', 'ready-to-wear', 5);