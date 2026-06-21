import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/DashboardLayout';
import { Card } from '@/components/ui/card';
import { getStatusInfo, getCategoryLabel } from '@/lib/supabase-helpers';
import { ShoppingBag } from 'lucide-react';
import { formatDate } from '@/lib/admin-helpers';
import SignedImage from '@/components/SignedImage';

const ClientOrders = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase.from('garment_requests').select('*').eq('client_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => setOrders(data || []));
  }, [user]);

  return (
    <DashboardLayout>
      <div className="max-w-lg mx-auto">
        <h1 className="font-serif text-2xl font-bold text-foreground mb-4">My Orders</h1>
        {orders.length === 0 ? (
          <Card className="p-8 text-center">
            <ShoppingBag className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No orders yet</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {orders.map(order => {
              const status = getStatusInfo(order.status);
              return (
                <Card key={order.id} className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold text-foreground">{getCategoryLabel(order.category)}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(order.created_at)}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${status.color}`}>{status.label}</span>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">{order.description}</p>
                  {order.event_date && (
                    <p className="text-xs text-primary mt-2">📅 Event: {formatDate(order.event_date)}</p>
                  )}
                  {order.reference_images?.length > 0 && (
                    <div className="flex gap-1 mt-2">
                      {order.reference_images.slice(0, 3).map((img: string, i: number) => (
                        <SignedImage key={i} src={img} alt="" className="w-12 h-12 rounded object-cover border border-border" />
                      ))}
                      {order.reference_images.length > 3 && (
                        <div className="w-12 h-12 rounded bg-muted flex items-center justify-center text-xs text-muted-foreground">
                          +{order.reference_images.length - 3}
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ClientOrders;
