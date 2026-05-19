
CREATE TYPE public.shop_order_status AS ENUM ('new','contacted','confirmed','fulfilled','cancelled');

CREATE TABLE public.shop_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  customer_email text,
  notes text,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  subtotal numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'ZMW',
  status public.shop_order_status NOT NULL DEFAULT 'new',
  user_id uuid,
  whatsapp_sent boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.shop_orders ENABLE ROW LEVEL SECURITY;

-- Anyone can submit an order (guest checkout)
CREATE POLICY "Anyone can submit shop orders"
ON public.shop_orders FOR INSERT
TO anon, authenticated
WITH CHECK (
  length(customer_name) BETWEEN 1 AND 120
  AND length(customer_phone) BETWEEN 5 AND 30
  AND (customer_email IS NULL OR length(customer_email) <= 255)
  AND (notes IS NULL OR length(notes) <= 2000)
  AND jsonb_typeof(items) = 'array'
);

-- Staff manage all
CREATE POLICY "Staff manage shop orders"
ON public.shop_orders FOR ALL
TO authenticated
USING (public.is_staff(auth.uid()))
WITH CHECK (public.is_staff(auth.uid()));

-- Signed-in users can see their own orders
CREATE POLICY "Users see own shop orders"
ON public.shop_orders FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE TRIGGER shop_orders_updated_at
BEFORE UPDATE ON public.shop_orders
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX shop_orders_status_idx ON public.shop_orders (status, created_at DESC);
