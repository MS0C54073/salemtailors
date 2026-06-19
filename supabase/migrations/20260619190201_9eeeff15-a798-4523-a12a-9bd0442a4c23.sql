
-- 1. Restrict app_settings reads to staff; expose member discount publicly via RPC
DROP POLICY IF EXISTS "Anyone authenticated reads settings" ON public.app_settings;
CREATE POLICY "Staff read settings" ON public.app_settings
  FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()));

CREATE OR REPLACE FUNCTION public.get_member_discount()
RETURNS numeric
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE((SELECT member_discount_percent FROM public.app_settings LIMIT 1), 0);
$$;
GRANT EXECUTE ON FUNCTION public.get_member_discount() TO anon, authenticated;

-- 2. Prevent appointment_slots privilege escalation: trigger blocks non-staff edits beyond booking columns
CREATE OR REPLACE FUNCTION public.prevent_slot_field_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.is_staff(auth.uid()) THEN
    RETURN NEW;
  END IF;
  IF NEW.slot_at IS DISTINCT FROM OLD.slot_at
     OR NEW.duration_minutes IS DISTINCT FROM OLD.duration_minutes
     OR NEW.notes IS DISTINCT FROM OLD.notes
     OR NEW.created_by IS DISTINCT FROM OLD.created_by
     OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'Non-staff users may only update booking fields on appointment_slots';
  END IF;
  -- Ensure clients can only assign themselves to the slot
  IF NEW.booked_by IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Clients may only book a slot for themselves';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS appointment_slots_prevent_escalation ON public.appointment_slots;
CREATE TRIGGER appointment_slots_prevent_escalation
  BEFORE UPDATE ON public.appointment_slots
  FOR EACH ROW EXECUTE FUNCTION public.prevent_slot_field_escalation();

-- 3. Realtime: allow non-staff authenticated users to subscribe only to topics scoped to their own uid
CREATE POLICY "Users subscribe to own user-scoped channels" ON realtime.messages
  FOR SELECT TO authenticated
  USING (
    realtime.topic() LIKE 'user:' || (SELECT auth.uid())::text || ':%'
  );
