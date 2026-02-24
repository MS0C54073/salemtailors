import { supabase } from "@/integrations/supabase/client";

export type AppRole = 'super_admin' | 'admin' | 'sub_admin' | 'client';

export async function getUserRole(userId: string): Promise<AppRole | null> {
  const { data, error } = await supabase.rpc('get_user_role', { _user_id: userId });
  if (error || !data) return null;
  return data as AppRole;
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function getUserProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single();
  if (error) return null;
  return data;
}

export const GARMENT_CATEGORIES = [
  { value: 'chitenge_men', label: 'Chitenge (Men)' },
  { value: 'chitenge_women', label: 'Chitenge (Women)' },
  { value: 'wedding_bride', label: 'Wedding (Bride)' },
  { value: 'wedding_groom', label: 'Wedding (Groom)' },
  { value: 'bridesmaids_groomsmen', label: 'Bridesmaids / Groomsmen' },
  { value: 'casual_wear', label: 'Casual Wear' },
  { value: 'formal_wear', label: 'Formal Wear' },
  { value: 'alterations', label: 'Alterations' },
  { value: 'custom_designs', label: 'Custom Designs' },
] as const;

export const ORDER_STATUSES = [
  { value: 'request_submitted', label: 'Request Submitted', color: 'bg-muted text-muted-foreground' },
  { value: 'consultation_scheduled', label: 'Consultation Scheduled', color: 'bg-secondary text-secondary-foreground' },
  { value: 'measurement_taken', label: 'Measurement Taken', color: 'bg-secondary text-secondary-foreground' },
  { value: 'in_progress', label: 'In Progress', color: 'bg-primary/20 text-primary' },
  { value: 'ready_for_fitting', label: 'Ready for Fitting', color: 'bg-gold/20 text-earth' },
  { value: 'adjustments_ongoing', label: 'Adjustments Ongoing', color: 'bg-terracotta/20 text-terracotta' },
  { value: 'completed', label: 'Completed', color: 'bg-accent/20 text-accent' },
  { value: 'ready_for_pickup', label: 'Ready for Pickup', color: 'bg-accent text-accent-foreground' },
] as const;

export function getStatusInfo(status: string) {
  return ORDER_STATUSES.find(s => s.value === status) || ORDER_STATUSES[0];
}

export function getCategoryLabel(category: string) {
  return GARMENT_CATEGORIES.find(c => c.value === category)?.label || category;
}
