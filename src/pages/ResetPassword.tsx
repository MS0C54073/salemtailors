import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { KeyRound, Loader2, ArrowLeft, CheckCircle2, Scissors, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [recoveryReady, setRecoveryReady] = useState(false);
  const [linkInvalid, setLinkInvalid] = useState(false);

  useEffect(() => {
    // Supabase fires PASSWORD_RECOVERY when the user lands here from the email link.
    // We must wait for that event before allowing a password update — otherwise
    // the user would be silently signed in without resetting their password.
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setRecoveryReady(true);
      }
    });

    // Detect missing or expired recovery token after a short wait
    const hash = window.location.hash;
    const isRecoveryHash = hash.includes('type=recovery');
    const errorInHash = hash.includes('error=') || hash.includes('error_description=');

    if (errorInHash) {
      setLinkInvalid(true);
    } else if (!isRecoveryHash) {
      // If user navigated here directly (no token), check for an existing session;
      // if none, mark link as invalid so they re-request.
      supabase.auth.getSession().then(({ data }) => {
        if (!data.session) setLinkInvalid(true);
        else setRecoveryReady(true);
      });
    }

    return () => sub.subscription.unsubscribe();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) return toast.error('Password must be at least 8 characters');
    if (password !== confirm) return toast.error('Passwords do not match');
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      toast.error(error.message || 'Could not update password');
    } else {
      setDone(true);
      toast.success('Password updated');
      // Sign out so the user re-authenticates with the new password
      setTimeout(async () => {
        await supabase.auth.signOut();
        navigate('/admin', { replace: true });
      }, 1500);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border p-4">
        <Link to="/admin" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm">Back to sign in</span>
        </Link>
      </header>

      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <Card className="w-full max-w-sm p-6">
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-full bg-primary/10 mx-auto mb-3 flex items-center justify-center">
              {done
                ? <CheckCircle2 className="h-7 w-7 text-accent" />
                : linkInvalid
                  ? <AlertTriangle className="h-7 w-7 text-destructive" />
                  : <KeyRound className="h-7 w-7 text-primary" />}
            </div>
            <h1 className="font-serif text-2xl font-bold text-foreground flex items-center justify-center gap-2">
              <Scissors className="h-5 w-5 text-primary" />
              {done ? 'Password updated' : linkInvalid ? 'Link expired' : 'Set new password'}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {done
                ? 'Redirecting you to sign in…'
                : linkInvalid
                  ? 'This reset link is invalid or has expired. Please request a new one.'
                  : 'Choose a strong password you\'ll remember.'}
            </p>
          </div>

          {linkInvalid ? (
            <Link to="/forgot-password" className="block">
              <Button className="w-full">Request a new link</Button>
            </Link>
          ) : !done ? (
            <form onSubmit={submit} className="space-y-4">
              <div>
                <Label htmlFor="password">New password</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  minLength={8}
                  required
                  disabled={!recoveryReady}
                />
              </div>
              <div>
                <Label htmlFor="confirm">Confirm password</Label>
                <Input
                  id="confirm"
                  type="password"
                  autoComplete="new-password"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  placeholder="Re-enter your password"
                  minLength={8}
                  required
                  disabled={!recoveryReady}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading || !recoveryReady}>
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {recoveryReady ? 'Update password' : 'Verifying link…'}
              </Button>
            </form>
          ) : null}
        </Card>
      </div>
    </div>
  );
};

export default ResetPassword;
