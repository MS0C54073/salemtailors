-- 1. Customer tier enum
CREATE TYPE public.customer_tier AS ENUM ('regular', 'member');

-- 2. Tier on profiles (registered clients)
ALTER TABLE public.profiles
  ADD COLUMN tier public.customer_tier NOT NULL DEFAULT 'regular',
  ADD COLUMN tier_since timestamptz;

-- 3. Tier on customers (walk-in / admin-managed)
ALTER TABLE public.customers
  ADD COLUMN tier public.customer_tier NOT NULL DEFAULT 'regular',
  ADD COLUMN tier_since timestamptz;

-- 4. App-wide settings (single row)
CREATE TABLE public.app_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_discount_percent numeric NOT NULL DEFAULT 10 CHECK (member_discount_percent >= 0 AND member_discount_percent <= 100),
  member_priority_enabled boolean NOT NULL DEFAULT true,
  notification_email text,
  notification_whatsapp text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);

INSERT INTO public.app_settings (member_discount_percent) VALUES (10);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated reads settings"
  ON public.app_settings FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins update settings"
  ON public.app_settings FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins insert settings"
  ON public.app_settings FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_app_settings_updated_at
  BEFORE UPDATE ON public.app_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. Measurement profiles per customer (one per template type)
CREATE TYPE public.measurement_template AS ENUM ('male', 'female', 'child');

CREATE TABLE public.customer_measurements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- exactly one of these references will be set
  profile_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES public.customers(id) ON DELETE CASCADE,
  template public.measurement_template NOT NULL,
  measurements jsonb NOT NULL DEFAULT '{}'::jsonb,
  notes text,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT customer_measurements_owner_chk CHECK (
    (profile_user_id IS NOT NULL AND customer_id IS NULL) OR
    (profile_user_id IS NULL AND customer_id IS NOT NULL)
  ),
  CONSTRAINT customer_measurements_unique_profile UNIQUE (profile_user_id, template),
  CONSTRAINT customer_measurements_unique_customer UNIQUE (customer_id, template)
);

ALTER TABLE public.customer_measurements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients view own measurements"
  ON public.customer_measurements FOR SELECT
  USING (auth.uid() = profile_user_id OR public.is_staff(auth.uid()));

CREATE POLICY "Clients insert own measurements"
  ON public.customer_measurements FOR INSERT
  WITH CHECK (
    (auth.uid() = profile_user_id) OR public.is_staff(auth.uid())
  );

CREATE POLICY "Clients update own measurements"
  ON public.customer_measurements FOR UPDATE
  USING (auth.uid() = profile_user_id OR public.is_staff(auth.uid()))
  WITH CHECK (auth.uid() = profile_user_id OR public.is_staff(auth.uid()));

CREATE POLICY "Staff delete measurements"
  ON public.customer_measurements FOR DELETE
  USING (public.is_staff(auth.uid()));

CREATE TRIGGER update_customer_measurements_updated_at
  BEFORE UPDATE ON public.customer_measurements
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 6. Order preferences and member fields on garment_requests
ALTER TABLE public.garment_requests
  ADD COLUMN preferences jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN discount_percent numeric NOT NULL DEFAULT 0 CHECK (discount_percent >= 0 AND discount_percent <= 100),
  ADD COLUMN is_member_priority boolean NOT NULL DEFAULT false;

-- 7. Helpful index for member-priority sorting
CREATE INDEX idx_garment_requests_priority ON public.garment_requests (is_member_priority DESC, created_at DESC);
