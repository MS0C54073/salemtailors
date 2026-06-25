
-- 1) Appointment slot notes: restrict column-level read, expose via SECURITY DEFINER RPC
REVOKE SELECT ON public.appointment_slots FROM authenticated, anon;
GRANT SELECT (id, slot_at, duration_minutes, is_available, booked_by, appointment_id, created_by, created_at, updated_at)
  ON public.appointment_slots TO authenticated;
GRANT SELECT (id, slot_at, duration_minutes, is_available, booked_by, appointment_id, created_by, created_at, updated_at)
  ON public.appointment_slots TO anon;
GRANT ALL ON public.appointment_slots TO service_role;

CREATE OR REPLACE FUNCTION public.get_appointment_slots_with_notes()
RETURNS SETOF public.appointment_slots
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT *
  FROM public.appointment_slots
  WHERE public.is_staff(auth.uid())
     OR booked_by = auth.uid()
  ORDER BY slot_at ASC
$$;

REVOKE ALL ON FUNCTION public.get_appointment_slots_with_notes() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_appointment_slots_with_notes() TO authenticated, service_role;

-- 2) booking-images: allow owners to UPDATE their own files
DROP POLICY IF EXISTS "Users update own booking images" ON storage.objects;
CREATE POLICY "Users update own booking images"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'booking-images'
    AND (auth.uid())::text = (storage.foldername(name))[1]
  )
  WITH CHECK (
    bucket_id = 'booking-images'
    AND (auth.uid())::text = (storage.foldername(name))[1]
  );

-- 3) shop_orders: remove from realtime publication so order data isn't broadcast
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'shop_orders'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime DROP TABLE public.shop_orders';
  END IF;
END $$;
