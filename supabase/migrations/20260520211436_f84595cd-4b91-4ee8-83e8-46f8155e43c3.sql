
-- 1) Drop the broad SELECT policies on public buckets (public buckets still serve files via URL)
DROP POLICY IF EXISTS "Anyone can view garment images" ON storage.objects;
DROP POLICY IF EXISTS "Catalogue images public read" ON storage.objects;
DROP POLICY IF EXISTS "Public read portfolio storage" ON storage.objects;

-- 2) Lock down SECURITY DEFINER helpers (used only inside RLS / triggers)
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_staff(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_user_role(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_user_role(uuid) TO authenticated;

-- 3) Public order-tracking lookup — limited columns, exact-phone match (digits only)
CREATE OR REPLACE FUNCTION public.track_shop_orders(_phone text)
RETURNS TABLE (
  id uuid,
  status public.shop_order_status,
  subtotal numeric,
  currency text,
  items jsonb,
  created_at timestamptz,
  updated_at timestamptz,
  whatsapp_sent boolean,
  customer_name text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT o.id, o.status, o.subtotal, o.currency, o.items,
         o.created_at, o.updated_at, o.whatsapp_sent, o.customer_name
  FROM public.shop_orders o
  WHERE length(regexp_replace(_phone, '[^0-9]', '', 'g')) >= 5
    AND regexp_replace(o.customer_phone, '[^0-9]', '', 'g')
        = regexp_replace(_phone,           '[^0-9]', '', 'g')
  ORDER BY o.created_at DESC
  LIMIT 50;
$$;

REVOKE EXECUTE ON FUNCTION public.track_shop_orders(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.track_shop_orders(text) TO anon, authenticated;
