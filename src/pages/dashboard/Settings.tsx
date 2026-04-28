import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2, User, Lock, Save, Palette, Sun, Moon, Monitor } from 'lucide-react';
import { toast } from 'sonner';

const Settings = () => {
  const { user } = useAuth();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const currentTheme = theme || 'light';
  const [profile, setProfile] = useState({ full_name: '', phone: '', email: '' });
  const [password, setPassword] = useState({ current: '', next: '', confirm: '' });
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from('profiles')
        .select('full_name, phone, email')
        .eq('user_id', user.id)
        .maybeSingle();
      if (data) setProfile({ full_name: data.full_name || '', phone: data.phone || '', email: data.email || user.email || '' });
      else setProfile(p => ({ ...p, email: user.email || '' }));
      setFetching(false);
    })();
  }, [user]);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoadingProfile(true);
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: profile.full_name, phone: profile.phone })
      .eq('user_id', user.id);
    setLoadingProfile(false);
    if (error) toast.error(error.message);
    else toast.success('Profile updated');
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.next.length < 6) return toast.error('Password must be at least 6 characters');
    if (password.next !== password.confirm) return toast.error('Passwords do not match');
    setLoadingPassword(true);

    // Verify current password by re-authenticating
    const { error: signInErr } = await supabase.auth.signInWithPassword({
      email: profile.email,
      password: password.current,
    });
    if (signInErr) {
      setLoadingPassword(false);
      return toast.error('Current password is incorrect');
    }

    const { error } = await supabase.auth.updateUser({ password: password.next });
    setLoadingPassword(false);
    if (error) toast.error(error.message);
    else {
      toast.success('Password updated successfully');
      setPassword({ current: '', next: '', confirm: '' });
    }
  };

  if (fetching) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="font-serif text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-sm text-muted-foreground">Manage your profile and password</p>
        </div>

        {/* Profile */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <User className="h-5 w-5 text-primary" />
            <h2 className="font-serif text-lg font-semibold text-foreground">Profile</h2>
          </div>
          <form onSubmit={saveProfile} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={profile.email} disabled className="bg-muted" />
              <p className="text-xs text-muted-foreground mt-1">Email cannot be changed here</p>
            </div>
            <div>
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                id="full_name"
                value={profile.full_name}
                onChange={e => setProfile(p => ({ ...p, full_name: e.target.value }))}
                placeholder="Your full name"
                required
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={profile.phone}
                onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))}
                placeholder="+260 97X XXX XXX"
                required
              />
            </div>
            <Button type="submit" disabled={loadingProfile} className="w-full sm:w-auto gap-2">
              {loadingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Profile
            </Button>
          </form>
        </Card>

        {/* Password */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Lock className="h-5 w-5 text-primary" />
            <h2 className="font-serif text-lg font-semibold text-foreground">Change Password</h2>
          </div>
          <form onSubmit={changePassword} className="space-y-4">
            <div>
              <Label htmlFor="current">Current Password</Label>
              <Input
                id="current"
                type="password"
                value={password.current}
                onChange={e => setPassword(p => ({ ...p, current: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="next">New Password</Label>
              <Input
                id="next"
                type="password"
                value={password.next}
                onChange={e => setPassword(p => ({ ...p, next: e.target.value }))}
                minLength={6}
                required
              />
            </div>
            <div>
              <Label htmlFor="confirm">Confirm New Password</Label>
              <Input
                id="confirm"
                type="password"
                value={password.confirm}
                onChange={e => setPassword(p => ({ ...p, confirm: e.target.value }))}
                minLength={6}
                required
              />
            </div>
            <Button type="submit" disabled={loadingPassword} className="w-full sm:w-auto gap-2">
              {loadingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
              Update Password
            </Button>
          </form>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Settings;
