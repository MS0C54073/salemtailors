import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/DashboardLayout';
import { Card } from '@/components/ui/card';
import { getStatusInfo, getCategoryLabel, ORDER_STATUSES } from '@/lib/supabase-helpers';
import { ShoppingBag, Calendar, AlertTriangle, Clock } from 'lucide-react';

const AdminDashboard = () => {
  const { user, role } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, new: 0, inProgress: 0, urgent: 0 });

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      // For sub_admin, only fetch assigned orders
      let query = supabase.from('garment_requests').select('*').order('created_at', { ascending: false });
      if (role === 'sub_admin') {
        query = query.eq('assigned_to', user.id);
      }
      const { data: ordersData } = await query;
      const allOrders = ordersData || [];
      setOrders(allOrders);

      const today = new Date();
      const urgentDate = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
      setStats({
        total: allOrders.length,
        new: allOrders.filter(o => o.status === 'request_submitted').length,
        inProgress: allOrders.filter(o => ['in_progress', 'ready_for_fitting', 'adjustments_ongoing'].includes(o.status)).length,
        urgent: allOrders.filter(o => o.event_date && new Date(o.event_date) <= urgentDate && !['completed', 'ready_for_pickup'].includes(o.status)).length,
      });

      const { data: aptsData } = await supabase.from('appointments').select('*')
        .gte('scheduled_at', new Date().toISOString())
        .order('scheduled_at', { ascending: true }).limit(5);
      setAppointments(aptsData || []);
    };

    fetchData();
  }, [user, role]);

  return (
    <DashboardLayout>
      <div className="max-w-lg mx-auto space-y-6">
        <div>
          <h1 className="font-serif text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground capitalize">{role?.replace('_', ' ')} view</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Total Orders', value: stats.total, icon: ShoppingBag, color: 'text-primary' },
            { label: 'New Requests', value: stats.new, icon: Clock, color: 'text-gold' },
            { label: 'In Progress', value: stats.inProgress, icon: Calendar, color: 'text-accent' },
            { label: 'Urgent', value: stats.urgent, icon: AlertTriangle, color: 'text-destructive' },
          ].map(s => (
            <Card key={s.label} className="p-3">
              <s.icon className={`h-5 w-5 ${s.color} mb-1`} />
              <p className="text-2xl font-bold text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </Card>
          ))}
        </div>

        {/* New Requests */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-serif text-lg font-semibold text-foreground">New Requests</h2>
            <Link to="/dashboard/admin/orders" className="text-xs text-primary font-medium">View all</Link>
          </div>
          <div className="space-y-2">
            {orders.filter(o => o.status === 'request_submitted').slice(0, 3).map(order => (
              <Card key={order.id} className="p-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-foreground">{getCategoryLabel(order.category)}</p>
                    <p className="text-xs text-muted-foreground line-clamp-1">{order.description}</p>
                  </div>
                  {order.event_date && (
                    <span className="text-xs text-primary">📅 {new Date(order.event_date).toLocaleDateString()}</span>
                  )}
                </div>
              </Card>
            ))}
            {orders.filter(o => o.status === 'request_submitted').length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No new requests</p>
            )}
          </div>
        </div>

        {/* Upcoming Appointments */}
        {appointments.length > 0 && (
          <div>
            <h2 className="font-serif text-lg font-semibold text-foreground mb-3">Upcoming Appointments</h2>
            <div className="space-y-2">
              {appointments.map(apt => (
                <Card key={apt.id} className="p-3 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                    <Calendar className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground capitalize">{apt.appointment_type}</p>
                    <p className="text-xs text-muted-foreground">{new Date(apt.scheduled_at).toLocaleString()}</p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
