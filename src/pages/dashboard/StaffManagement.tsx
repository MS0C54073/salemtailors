import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Users, Plus, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface StaffMember {
  user_id: string;
  role: string;
  full_name: string;
  phone: string;
  email: string | null;
}

const StaffManagement = () => {
  const { user } = useAuth();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ fullName: '', phone: '', email: '', password: '', role: 'admin' });

  const fetchStaff = async () => {
    const { data: roles } = await supabase.from('user_roles').select('user_id, role')
      .in('role', ['admin', 'sub_admin']);
    if (!roles || roles.length === 0) { setStaff([]); return; }

    const userIds = roles.map(r => r.user_id);
    const { data: profiles } = await supabase.from('profiles').select('*').in('user_id', userIds);

    const staffList: StaffMember[] = roles.map(r => {
      const p = profiles?.find(p => p.user_id === r.user_id);
      return {
        user_id: r.user_id,
        role: r.role,
        full_name: p?.full_name || 'Unknown',
        phone: p?.phone || '',
        email: p?.email || null,
      };
    });
    setStaff(staffList);
  };

  useEffect(() => { fetchStaff(); }, []);

  const createStaffAccount = async () => {
    if (!form.email || !form.password || !form.fullName) return;
    setLoading(true);

    try {
      // Create user via edge function
      const { data, error } = await supabase.functions.invoke('create-staff', {
        body: {
          email: form.email,
          password: form.password,
          full_name: form.fullName,
          phone: form.phone,
          role: form.role,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success(`${form.role === 'admin' ? 'Admin' : 'Sub-Admin'} account created!`);
      setOpen(false);
      setForm({ fullName: '', phone: '', email: '', password: '', role: 'admin' });
      fetchStaff();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create staff account');
    } finally {
      setLoading(false);
    }
  };

  const updateRole = async (userId: string, newRole: string) => {
    const { error } = await supabase.from('user_roles').update({ role: newRole as any }).eq('user_id', userId);
    if (error) { toast.error('Failed to update role'); return; }
    toast.success('Role updated');
    fetchStaff();
  };

  return (
    <DashboardLayout>
      <div className="max-w-lg mx-auto">
        <div className="flex justify-between items-center mb-4">
          <h1 className="font-serif text-2xl font-bold text-foreground">Staff Management</h1>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Add Staff</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="font-serif">Create Staff Account</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                <div>
                  <Label>Full Name *</Label>
                  <Input value={form.fullName} onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))} placeholder="Staff full name" />
                </div>
                <div>
                  <Label>Email *</Label>
                  <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="staff@example.com" />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+260 97X XXX XXX" />
                </div>
                <div>
                  <Label>Password *</Label>
                  <Input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Minimum 6 characters" minLength={6} />
                </div>
                <div>
                  <Label>Role *</Label>
                  <Select value={form.role} onValueChange={v => setForm(f => ({ ...f, role: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin (Manager)</SelectItem>
                      <SelectItem value="sub_admin">Sub-Admin (Assistant)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button className="w-full" onClick={createStaffAccount} disabled={loading || !form.email || !form.password || !form.fullName}>
                  {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Create Account
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {staff.length === 0 ? (
          <Card className="p-8 text-center">
            <Users className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No staff members yet</p>
            <p className="text-xs text-muted-foreground mt-1">Add your first staff member above</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {staff.map(s => (
              <Card key={s.user_id} className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-semibold text-foreground">{s.full_name}</p>
                    <p className="text-xs text-muted-foreground">{s.email}</p>
                    {s.phone && <p className="text-xs text-muted-foreground">{s.phone}</p>}
                  </div>
                </div>
                <Select value={s.role} onValueChange={v => updateRole(s.user_id, v)}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="sub_admin">Sub-Admin</SelectItem>
                  </SelectContent>
                </Select>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default StaffManagement;
