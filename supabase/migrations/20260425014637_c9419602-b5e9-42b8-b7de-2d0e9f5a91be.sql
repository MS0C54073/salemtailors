-- 1. Remove broad realtime SELECT policy from public.messages
DROP POLICY IF EXISTS "Authenticated can receive realtime" ON public.messages;
DROP POLICY IF EXISTS "Staff can subscribe to staff channels" ON public.messages;

-- 2. Remove broad realtime SELECT policy from realtime.messages
DROP POLICY IF EXISTS "Authenticated can receive realtime" ON realtime.messages;
-- Keep "Staff can subscribe to staff channels" on realtime.messages since it's already scoped by is_staff()

-- 3. Tighten get_user_role to prevent enumeration of other users' roles
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles
  WHERE user_id = _user_id
    AND (_user_id = auth.uid() OR public.is_staff(auth.uid()))
  LIMIT 1
$$;