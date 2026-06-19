
GRANT SELECT ON public.catalogue_categories TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.catalogue_categories TO authenticated;
GRANT ALL ON public.catalogue_categories TO service_role;

GRANT SELECT ON public.catalogue_items TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.catalogue_items TO authenticated;
GRANT ALL ON public.catalogue_items TO service_role;

GRANT SELECT ON public.catalogue_item_images TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.catalogue_item_images TO authenticated;
GRANT ALL ON public.catalogue_item_images TO service_role;

GRANT SELECT ON public.catalogue_item_variants TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.catalogue_item_variants TO authenticated;
GRANT ALL ON public.catalogue_item_variants TO service_role;
