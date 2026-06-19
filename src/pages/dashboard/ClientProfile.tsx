import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Crown, ShieldCheck, Ruler, Save, Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { ALL_TEMPLATES, MEASUREMENT_FIELDS, MeasurementTemplate, TEMPLATE_LABEL } from '@/lib/measurements';
import { formatDate } from '@/lib/admin-helpers';

const ClientProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [discount, setDiscount] = useState(10);
  const [measurements, setMeasurements] = useState<Record<MeasurementTemplate, any | null>>({ male: null, female: null, child: null });
  const [activeTpl, setActiveTpl] = useState<MeasurementTemplate>('male');
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const [{ data: p }, { data: m }, { data: s }] = await Promise.all([
        supabase.from('profiles').select('*').eq('user_id', user.id).maybeSingle(),
        supabase.from('customer_measurements').select('*').eq('profile_user_id', user.id),
        supabase.rpc('get_member_discount'),
      ]);
      setProfile(p);
      const grouped: any = { male: null, female: null, child: null };
      (m || []).forEach((row: any) => { grouped[row.template as MeasurementTemplate] = row; });
      setMeasurements(grouped);
      setDiscount((s as number | null) ?? 10);
      setLoading(false);
    })();
  }, [user]);

  // Sync draft when active template or saved data changes
  useEffect(() => {
    const existing = measurements[activeTpl]?.measurements || {};
    const next: Record<string, string> = {};
    MEASUREMENT_FIELDS[activeTpl].forEach(f => {
      next[f.key] = existing[f.key] != null ? String(existing[f.key]) : '';
    });
    setDraft(next);
  }, [activeTpl, measurements]);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const numeric: Record<string, number> = {};
    Object.entries(draft).forEach(([k, v]) => { if (v.trim()) numeric[k] = Number(v); });

    const existing = measurements[activeTpl];
    const { error } = existing
      ? await supabase.from('customer_measurements').update({ measurements: numeric }).eq('id', existing.id)
      : await supabase.from('customer_measurements').insert({
          profile_user_id: user.id,
          template: activeTpl,
          measurements: numeric,
        });

    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(`${TEMPLATE_LABEL[activeTpl]} measurements saved`);
    // refresh
    const { data: m } = await supabase.from('customer_measurements').select('*').eq('profile_user_id', user.id);
    const grouped: any = { male: null, female: null, child: null };
    (m || []).forEach((row: any) => { grouped[row.template as MeasurementTemplate] = row; });
    setMeasurements(grouped);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      </DashboardLayout>
    );
  }

  const isMember = profile?.tier === 'member';

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-5">
        <div>
          <h1 className="font-serif text-2xl font-bold text-foreground">My Profile</h1>
          <p className="text-sm text-muted-foreground">Your measurements speed up future orders</p>
        </div>

        {/* Tier card */}
        <Card className={`p-5 ${isMember ? 'border-gold/40 bg-gold/5' : ''}`}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-serif text-lg font-semibold text-foreground">{profile?.full_name}</h2>
                {isMember
                  ? <Badge className="gap-1 bg-gold/20 text-earth border-gold/40 hover:bg-gold/30"><Crown className="h-3 w-3" /> Member</Badge>
                  : <Badge variant="secondary" className="gap-1"><ShieldCheck className="h-3 w-3" /> Regular</Badge>}
              </div>
              <p className="text-xs text-muted-foreground mt-1">{profile?.email}</p>
              <p className="text-xs text-muted-foreground">{profile?.phone}</p>
            </div>
            {isMember && (
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Member since</p>
                <p className="text-xs font-medium text-foreground">{formatDate(profile?.tier_since)}</p>
              </div>
            )}
          </div>

          {isMember ? (
            <div className="mt-4 p-3 rounded-md bg-gold/10 flex gap-2">
              <Sparkles className="h-4 w-4 text-earth shrink-0 mt-0.5" />
              <div className="text-xs text-foreground/80">
                <p className="font-semibold text-earth mb-1">Member benefits</p>
                <ul className="space-y-0.5">
                  <li>• {discount}% off on every order</li>
                  <li>• Priority handling on fittings and pickup</li>
                  <li>• Early access to new collections</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="mt-4 p-3 rounded-md bg-muted/50 text-xs text-muted-foreground">
              Place orders consistently and our team will upgrade you to <span className="font-semibold text-foreground">Member</span> for {discount}% off and priority service.
            </div>
          )}
        </Card>

        {/* Measurements */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <Ruler className="h-5 w-5 text-primary" />
            <h2 className="font-serif text-lg font-semibold text-foreground">Measurement Profile</h2>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            Select a template, fill in what you know (in centimetres). Our tailors confirm these at your first fitting.
          </p>

          <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
            {ALL_TEMPLATES.map(t => (
              <Button
                key={t}
                size="sm"
                variant={activeTpl === t ? 'default' : 'outline'}
                onClick={() => setActiveTpl(t)}
                className="shrink-0"
              >
                {TEMPLATE_LABEL[t]} {measurements[t] && '✓'}
              </Button>
            ))}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {MEASUREMENT_FIELDS[activeTpl].map(f => (
              <div key={f.key}>
                <Label className="text-xs">{f.label}</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={draft[f.key] || ''}
                  onChange={e => setDraft(d => ({ ...d, [f.key]: e.target.value }))}
                  placeholder="cm"
                />
              </div>
            ))}
          </div>

          <Button onClick={save} disabled={saving} className="mt-4 gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save {TEMPLATE_LABEL[activeTpl]} measurements
          </Button>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ClientProfile;
