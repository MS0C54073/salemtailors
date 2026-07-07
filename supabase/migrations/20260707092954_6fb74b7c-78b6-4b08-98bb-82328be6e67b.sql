
CREATE INDEX IF NOT EXISTS idx_catalogue_items_status_order
  ON public.catalogue_items (status, display_order);
CREATE INDEX IF NOT EXISTS idx_catalogue_items_featured
  ON public.catalogue_items (is_featured) WHERE is_featured;
CREATE INDEX IF NOT EXISTS idx_catalogue_item_images_item
  ON public.catalogue_item_images (item_id, display_order);
CREATE INDEX IF NOT EXISTS idx_catalogue_item_variants_item
  ON public.catalogue_item_variants (item_id, display_order);
CREATE INDEX IF NOT EXISTS idx_shop_orders_status_created
  ON public.shop_orders (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_appointment_slots_slot_at
  ON public.appointment_slots (slot_at);
CREATE INDEX IF NOT EXISTS idx_garment_requests_status_created
  ON public.garment_requests (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_request_created
  ON public.messages (garment_request_id, created_at);

CREATE OR REPLACE FUNCTION public.upsert_catalogue_item(
  _item jsonb,
  _images jsonb,
  _variants jsonb
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _item_id uuid;
  _is_insert boolean;
  _slug text;
BEGIN
  IF NOT public.is_staff(auth.uid()) THEN
    RAISE EXCEPTION 'Only staff can modify catalogue items';
  END IF;

  _item_id := NULLIF(_item->>'id','')::uuid;
  _is_insert := _item_id IS NULL;

  IF _is_insert THEN
    _slug := COALESCE(NULLIF(_item->>'slug',''),
              regexp_replace(lower(_item->>'name'), '[^a-z0-9]+', '-', 'g'))
             || '-' || substr(md5(random()::text), 1, 6);

    INSERT INTO public.catalogue_items
      (name, slug, description, category_id, base_price, currency,
       status, stock_status, is_featured, primary_image_url)
    VALUES (
      _item->>'name',
      _slug,
      NULLIF(_item->>'description',''),
      NULLIF(_item->>'category_id','')::uuid,
      NULLIF(_item->>'base_price','')::numeric,
      COALESCE(NULLIF(_item->>'currency',''), 'ZMW'),
      COALESCE(_item->>'status','active')::catalogue_item_status,
      COALESCE(_item->>'stock_status','in_stock')::catalogue_stock_status,
      COALESCE((_item->>'is_featured')::boolean, false),
      NULLIF(_item->>'primary_image_url','')
    )
    RETURNING id INTO _item_id;
  ELSE
    UPDATE public.catalogue_items SET
      name = _item->>'name',
      description = NULLIF(_item->>'description',''),
      category_id = NULLIF(_item->>'category_id','')::uuid,
      base_price = NULLIF(_item->>'base_price','')::numeric,
      status = COALESCE(_item->>'status','active')::catalogue_item_status,
      stock_status = COALESCE(_item->>'stock_status','in_stock')::catalogue_stock_status,
      is_featured = COALESCE((_item->>'is_featured')::boolean, false),
      primary_image_url = NULLIF(_item->>'primary_image_url',''),
      updated_at = now()
    WHERE id = _item_id;
  END IF;

  DELETE FROM public.catalogue_item_images WHERE item_id = _item_id;
  IF jsonb_array_length(COALESCE(_images,'[]'::jsonb)) > 0 THEN
    INSERT INTO public.catalogue_item_images (item_id, image_url, display_order)
    SELECT _item_id,
           elem->>'image_url',
           COALESCE((elem->>'display_order')::int, (ord - 1)::int)
    FROM jsonb_array_elements(_images) WITH ORDINALITY AS t(elem, ord);
  END IF;

  DELETE FROM public.catalogue_item_variants WHERE item_id = _item_id;
  IF jsonb_array_length(COALESCE(_variants,'[]'::jsonb)) > 0 THEN
    INSERT INTO public.catalogue_item_variants
      (item_id, name, sku, price_override, stock_status, display_order)
    SELECT _item_id,
           elem->>'name',
           NULLIF(elem->>'sku',''),
           NULLIF(elem->>'price_override','')::numeric,
           COALESCE(elem->>'stock_status','in_stock')::catalogue_stock_status,
           COALESCE((elem->>'display_order')::int, (ord - 1)::int)
    FROM jsonb_array_elements(_variants) WITH ORDINALITY AS t(elem, ord);
  END IF;

  RETURN _item_id;
END;
$$;

REVOKE ALL ON FUNCTION public.upsert_catalogue_item(jsonb, jsonb, jsonb) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.upsert_catalogue_item(jsonb, jsonb, jsonb) TO authenticated, service_role;
