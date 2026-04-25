import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Mail, Loader2, ArrowLeft, CheckCircle2, Scissors } from 'lucide-react';
import { toast } from 'sonner';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      toast.error(error.message || 'Could not send reset email');
    } else {
      setSent(true);
      toast.success('Reset link sent — check your inbox');
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
              {sent ? <CheckCircle2 className="h-7 w-7 text-accent" /> : <Mail className="h-7 w-7 text-primary" />}
            </div>
            <h1 className="font-serif text-2xl font-bold text-foreground flex items-center justify-center gap-2">
              <Scissors className="h-5 w-5 text-primary" />
              {sent ? 'Check your email' : 'Forgot password'}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {sent
                ? `We've sent a reset link to ${email}. Open it on this device to choose a new password.`
                : 'Enter your account email and we\'ll send you a secure reset link.'}
            </p>
          </div>

          {!sent && (
            <form onSubmit={submit} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Send reset link
              </Button>
            </form>
          )}

          {sent && (
            <div className="space-y-3">
              <Button variant="outline" className="w-full" onClick={() => { setSent(false); setEmail(''); }}>
                Send to a different email
              </Button>
              <Link to="/admin" className="block">
                <Button variant="ghost" className="w-full">Back to sign in</Button>
              </Link>
            </div>
          )}

          <p className="text-[11px] text-muted-foreground/70 text-center mt-6 leading-relaxed">
            For your security, the link expires after a short time. If it expires, request a new one.
          </p>
        </Card>
      </div>
    </div>
  );
};

export default ForgotPassword;
