import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Calendar, Clock } from 'lucide-react';

const ClientAppointments = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase.from('appointments').select('*').eq('client_id', user.id)
      .order('scheduled_at', { ascending: true })
      .then(({ data }) => setAppointments(data || []));
  }, [user]);

  const statusColors: Record<string, string> = {
    pending: 'bg-gold/20 text-earth',
    confirmed: 'bg-accent/20 text-accent',
    completed: 'bg-muted text-muted-foreground',
    cancelled: 'bg-destructive/20 text-destructive',
    rescheduled: 'bg-primary/20 text-primary',
  };

  return (
    <DashboardLayout>
      <div className="max-w-lg mx-auto">
        <h1 className="font-serif text-2xl font-bold text-foreground mb-4">Appointments</h1>
        {appointments.length === 0 ? (
          <Card className="p-8 text-center">
            <Calendar className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No appointments yet</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {appointments.map(apt => (
              <Card key={apt.id} className="p-4 flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Clock className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <p className="text-sm font-semibold text-foreground capitalize">{apt.appointment_type}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${statusColors[apt.status] || ''}`}>
                      {apt.status}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{new Date(apt.scheduled_at).toLocaleString()}</p>
                  {apt.notes && <p className="text-xs text-muted-foreground mt-1">{apt.notes}</p>}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ClientAppointments;
