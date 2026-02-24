import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShoppingBag, Plus, Calendar, Clock } from 'lucide-react';
import { getStatusInfo, getCategoryLabel } from '@/lib/supabase-helpers';

const ClientDashboard = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    if (!user) return;
    
    supabase.from('profiles').select('*').eq('user_id', user.id).single()
      .then(({ data }) => setProfile(data));
    
    supabase.from('garment_requests').select('*').eq('client_id', user.id)
      .order('created_at', { ascending: false }).limit(5)
      .then(({ data }) => setOrders(data || []));

    supabase.from('appointments').select('*').eq('client_id', user.id)
      .order('scheduled_at', { ascending: true }).limit(3)
      .then(({ data }) => setAppointments(data || []));
  }, [user]);

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-lg mx-auto">
        {/* Greeting */}
        <div>
          <h1 className="font-serif text-2xl font-bold text-foreground">
            Hello, {profile?.full_name?.split(' ')[0] || 'there'} 👋
          </h1>
          <p className="text-sm text-muted-foreground">What would you like today?</p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Link to="/dashboard/client/new-request">
            <Card className="p-4 hover:shadow-warm transition-shadow cursor-pointer border-primary/20">
              <Plus className="h-6 w-6 text-primary mb-2" />
              <h3 className="font-semibold text-sm text-foreground">New Request</h3>
              <p className="text-xs text-muted-foreground">Submit a garment order</p>
            </Card>
          </Link>
          <Link to="/dashboard/client/appointments">
            <Card className="p-4 hover:shadow-warm transition-shadow cursor-pointer">
              <Calendar className="h-6 w-6 text-accent mb-2" />
              <h3 className="font-semibold text-sm text-foreground">Appointments</h3>
              <p className="text-xs text-muted-foreground">Book or view</p>
            </Card>
          </Link>
        </div>

        {/* Recent Orders */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-serif text-lg font-semibold text-foreground">Recent Orders</h2>
            <Link to="/dashboard/client/orders" className="text-xs text-primary font-medium">View all</Link>
          </div>
          {orders.length === 0 ? (
            <Card className="p-6 text-center">
              <ShoppingBag className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No orders yet</p>
              <Link to="/dashboard/client/new-request">
                <Button size="sm" className="mt-3">Submit your first request</Button>
              </Link>
            </Card>
          ) : (
            <div className="space-y-2">
              {orders.map(order => {
                const status = getStatusInfo(order.status);
                return (
                  <Card key={order.id} className="p-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">{getCategoryLabel(order.category)}</p>
                      <p className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleDateString()}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${status.color}`}>
                      {status.label}
                    </span>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Upcoming Appointments */}
        {appointments.length > 0 && (
          <div>
            <h2 className="font-serif text-lg font-semibold text-foreground mb-3">Upcoming</h2>
            <div className="space-y-2">
              {appointments.map(apt => (
                <Card key={apt.id} className="p-3 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                    <Clock className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground capitalize">{apt.appointment_type}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(apt.scheduled_at).toLocaleString()}
                    </p>
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

export default ClientDashboard;
