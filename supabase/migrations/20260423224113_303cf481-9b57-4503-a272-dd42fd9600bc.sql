-- ============ ENUMS ============
DO $$ BEGIN
  CREATE TYPE public.payment_type AS ENUM ('deposit', 'balance', 'full', 'refund');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.payment_status AS ENUM ('not_paid', 'deposit_paid', 'fully_paid');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.expense_category AS ENUM ('fabric', 'supplies', 'rent', 'utilities', 'transport', 'salaries', 'other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============ CUSTOMERS (walk-ins managed by staff) ============
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  notes TEXT,
  measurements JSONB DEFAULT '{}'::jsonb,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff manage customers"
  ON public.customers FOR ALL
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_customers_phone ON public.customers(phone);
CREATE INDEX idx_customers_name ON public.customers(full_name);

-- ============ PAYMENTS ============
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  garment_request_id UUID,
  customer_id UUID,
  amount NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
  payment_type public.payment_type NOT NULL DEFAULT 'deposit',
  payment_method TEXT,
  notes TEXT,
  recorded_by UUID,
  paid_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff manage payments"
  ON public.payments FOR ALL
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

CREATE INDEX idx_payments_garment_request ON public.payments(garment_request_id);
CREATE INDEX idx_payments_paid_at ON public.payments(paid_at);

-- ============ EXPENSES ============
CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category public.expense_category NOT NULL DEFAULT 'other',
  description TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  recorded_by UUID,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff manage expenses"
  ON public.expenses FOR ALL
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

CREATE INDEX idx_expenses_date ON public.expenses(expense_date);

-- ============ PORTFOLIO ITEMS ============
CREATE TABLE IF NOT EXISTS public.portfolio_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  image_url TEXT NOT NULL,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  display_order INT NOT NULL DEFAULT 0,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.portfolio_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view portfolio"
  ON public.portfolio_items FOR SELECT
  USING (true);

CREATE POLICY "Staff manage portfolio"
  ON public.portfolio_items FOR INSERT
  WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "Staff update portfolio"
  ON public.portfolio_items FOR UPDATE
  USING (public.is_staff(auth.uid()));

CREATE POLICY "Staff delete portfolio"
  ON public.portfolio_items FOR DELETE
  USING (public.is_staff(auth.uid()));

CREATE TRIGGER update_portfolio_updated_at
  BEFORE UPDATE ON public.portfolio_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_portfolio_featured ON public.portfolio_items(is_featured, display_order);

-- ============ EXTEND garment_requests ============
ALTER TABLE public.garment_requests
  ADD COLUMN IF NOT EXISTS customer_id UUID,
  ADD COLUMN IF NOT EXISTS customer_name TEXT,
  ADD COLUMN IF NOT EXISTS customer_phone TEXT,
  ADD COLUMN IF NOT EXISTS service_type TEXT,
  ADD COLUMN IF NOT EXISTS due_date DATE,
  ADD COLUMN IF NOT EXISTS total_price NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS payment_status public.payment_status DEFAULT 'not_paid';

-- Allow staff to insert orders directly (for walk-ins, no client_id needed in their flow)
DO $$ BEGIN
  CREATE POLICY "Staff can create orders"
    ON public.garment_requests FOR INSERT
    WITH CHECK (public.is_staff(auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Make client_id nullable for walk-in orders (orders not tied to a registered user)
ALTER TABLE public.garment_requests ALTER COLUMN client_id DROP NOT NULL;

-- Storage bucket for portfolio
INSERT INTO storage.buckets (id, name, public)
VALUES ('portfolio', 'portfolio', true)
ON CONFLICT (id) DO NOTHING;

DO $$ BEGIN
  CREATE POLICY "Public read portfolio storage"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'portfolio');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Staff upload portfolio storage"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'portfolio' AND public.is_staff(auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Staff update portfolio storage"
    ON storage.objects FOR UPDATE
    USING (bucket_id = 'portfolio' AND public.is_staff(auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Staff delete portfolio storage"
    ON storage.objects FOR DELETE
    USING (bucket_id = 'portfolio' AND public.is_staff(auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;