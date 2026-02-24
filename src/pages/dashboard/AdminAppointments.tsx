import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Calendar, Clock } from 'lucide-react';

const AdminAppointments = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase.from('appointments').select('*')
      .order('scheduled_at', { ascending: true })
      .then(({ data }) => setAppointments(data || []));
  }, [user]);

  return (
    <DashboardLayout>
      <div className="max-w-lg mx-auto">
        <h1 className="font-serif text-2xl font-bold text-foreground mb-4">Appointments</h1>
        {appointments.length === 0 ? (
          <Card className="p-8 text-center">
            <Calendar className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No appointments scheduled</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {appointments.map(apt => (
              <Card key={apt.id} className="p-4 flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                  <Clock className="h-6 w-6 text-accent" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground capitalize">{apt.appointment_type}</p>
                  <p className="text-xs text-muted-foreground">{new Date(apt.scheduled_at).toLocaleString()}</p>
                  <p className="text-xs capitalize text-primary mt-0.5">{apt.status}</p>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminAppointments;
