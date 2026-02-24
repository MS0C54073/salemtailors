import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getStatusInfo, getCategoryLabel, ORDER_STATUSES } from '@/lib/supabase-helpers';
import { toast } from 'sonner';

const AdminOrders = () => {
  const { user, role } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [filter, setFilter] = useState('all');

  const fetchOrders = async () => {
    if (!user) return;
    let query = supabase.from('garment_requests').select('*').order('created_at', { ascending: false });
    if (role === 'sub_admin') query = query.eq('assigned_to', user.id);
    const { data } = await query;
    setOrders(data || []);
  };

  useEffect(() => { fetchOrders(); }, [user, role]);

  const updateStatus = async (orderId: string, newStatus: string) => {
    const { error } = await supabase.from('garment_requests')
      .update({ status: newStatus as any })
      .eq('id', orderId);
    if (error) { toast.error('Failed to update'); return; }
    toast.success('Status updated');
    fetchOrders();
  };

  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter);

  return (
    <DashboardLayout>
      <div className="max-w-lg mx-auto space-y-4">
        <h1 className="font-serif text-2xl font-bold text-foreground">Orders</h1>

        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger><SelectValue placeholder="Filter by status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Orders</SelectItem>
            {ORDER_STATUSES.map(s => (
              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="space-y-3">
          {filtered.map(order => {
            const status = getStatusInfo(order.status);
            return (
              <Card key={order.id} className="p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-foreground">{getCategoryLabel(order.category)}</p>
                    <p className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleDateString()}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${status.color}`}>{status.label}</span>
                </div>
                <p className="text-sm text-muted-foreground">{order.description}</p>
                {order.event_date && (
                  <p className="text-xs text-primary">📅 Event: {new Date(order.event_date).toLocaleDateString()}</p>
                )}
                {order.reference_images?.length > 0 && (
                  <div className="flex gap-1">
                    {order.reference_images.slice(0, 4).map((img: string, i: number) => (
                      <img key={i} src={img} alt="" className="w-14 h-14 rounded object-cover border border-border" />
                    ))}
                  </div>
                )}
                {(role === 'admin' || role === 'super_admin') && (
                  <Select value={order.status} onValueChange={v => updateStatus(order.id, v)}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ORDER_STATUSES.map(s => (
                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </Card>
            );
          })}
          {filtered.length === 0 && (
            <p className="text-center text-muted-foreground py-8">No orders found</p>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminOrders;
