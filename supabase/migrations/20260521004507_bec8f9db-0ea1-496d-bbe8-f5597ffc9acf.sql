-- Restore EXECUTE on security-definer helpers used inside RLS policies.
-- These functions are SECURITY DEFINER and only return booleans, so granting
-- EXECUTE to authenticated/anon roles does not expose data — it just lets
-- RLS policies that call them run successfully.

GRANT EXECUTE ON FUNCTION public.is_staff(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_role(uuid) TO authenticated;