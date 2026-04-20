import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getStatusInfo, getCategoryLabel, ORDER_STATUSES, GARMENT_CATEGORIES } from '@/lib/supabase-helpers';
import {
  ShoppingBag, Calendar, AlertTriangle, Clock, TrendingUp, Users, DollarSign,
  Activity, CheckCircle2, ArrowUpRight, Sparkles
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';

const CATEGORY_COLORS = ['#D97706', '#F59E0B', '#EA580C', '#DC2626', '#92400E', '#B45309', '#78350F', '#451A03', '#7C2D12'];

const AdminDashboard = () => {
  const { user, role } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [recentMessages, setRecentMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      setLoading(true);
      let query = supabase.from('garment_requests').select('*').order('created_at', { ascending: false });
      if (role === 'sub_admin') {
        query = query.eq('assigned_to', user.id);
      }

      const [ordersRes, aptsRes, profilesRes, msgsRes] = await Promise.all([
        query,
        supabase.from('appointments').select('*').order('scheduled_at', { ascending: false }).limit(50),
        supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(20),
        supabase.from('messages').select('*').order('created_at', { ascending: false }).limit(10),
      ]);

      setOrders(ordersRes.data || []);
      setAppointments(aptsRes.data || []);
      setProfiles(profilesRes.data || []);
      setRecentMessages(msgsRes.data || []);
      setLoading(false);
    };

    fetchData();
  }, [user, role]);

  // === Stats calculations ===
  const stats = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const urgentDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const todayOrders = orders.filter(o => new Date(o.created_at) >= today);
    const weekOrders = orders.filter(o => new Date(o.created_at) >= weekStart);
    const totalRevenue = orders.reduce((sum, o) => sum + (Number(o.estimated_cost) || 0), 0);
    const completedRevenue = orders
      .filter(o => ['completed', 'ready_for_pickup'].includes(o.status))
      .reduce((sum, o) => sum + (Number(o.estimated_cost) || 0), 0);

    return {
      total: orders.length,
      today: todayOrders.length,
      week: weekOrders.length,
      newRequests: orders.filter(o => o.status === 'request_submitted').length,
      inProgress: orders.filter(o => ['in_progress', 'ready_for_fitting', 'adjustments_ongoing'].includes(o.status)).length,
      completed: orders.filter(o => ['completed', 'ready_for_pickup'].includes(o.status)).length,
      urgent: orders.filter(o => o.event_date && new Date(o.event_date) <= urgentDate && !['completed', 'ready_for_pickup'].includes(o.status)).length,
      clients: profiles.length,
      upcomingApts: appointments.filter(a => new Date(a.scheduled_at) >= now).length,
      totalRevenue,
      completedRevenue,
    };
  }, [orders, appointments, profiles]);

  // === Bookings over time (last 14 days) ===
  const bookingsTimeSeries = useMemo(() => {
    const days: Record<string, number> = {};
    const labels: string[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString('en', { month: 'short', day: 'numeric' });
      days[key] = 0;
      labels.push(label);
    }
    orders.forEach(o => {
      const key = new Date(o.created_at).toISOString().slice(0, 10);
      if (key in days) days[key]++;
    });
    return Object.entries(days).map(([key, count], i) => ({ date: labels[i], orders: count }));
  }, [orders]);

  // === Service popularity ===
  const servicePopularity = useMemo(() => {
    const counts: Record<string, number> = {};
    orders.forEach(o => {
      counts[o.category] = (counts[o.category] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([category, count]) => ({ name: getCategoryLabel(category), value: count }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [orders]);

  // === Pipeline by status ===
  const pipeline = useMemo(() => {
    return ORDER_STATUSES.map(s => ({
      name: s.label.replace(' ', '\n'),
      shortName: s.label.split(' ')[0],
      count: orders.filter(o => o.status === s.value).length,
    }));
  }, [orders]);

  // === Activity feed ===
  const activityFeed = useMemo(() => {
    const events: { type: string; label: string; time: Date; icon: any; color: string }[] = [];

    orders.slice(0, 10).forEach(o => events.push({
      type: 'order',
      label: `New ${getCategoryLabel(o.category)} request`,
      time: new Date(o.created_at),
      icon: ShoppingBag,
      color: 'text-primary',
    }));
    appointments.slice(0, 10).forEach(a => events.push({
      type: 'appointment',
      label: `${a.appointment_type} appointment ${a.status}`,
      time: new Date(a.created_at),
      icon: Calendar,
      color: 'text-accent',
    }));
    profiles.slice(0, 5).forEach(p => events.push({
      type: 'client',
      label: `New client: ${p.full_name || 'Unknown'}`,
      time: new Date(p.created_at),
      icon: Users,
      color: 'text-gold',
    }));

    return events.sort((a, b) => b.time.getTime() - a.time.getTime()).slice(0, 12);
  }, [orders, appointments, profiles]);

  const formatTime = (date: Date) => {
    const diff = Date.now() - date.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="font-serif text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-gold" />
              Admin Dashboard
            </h1>
            <p className="text-sm text-muted-foreground capitalize">
              {role?.replace('_', ' ')} · Live analytics & insights
            </p>
          </div>
          <Badge variant="outline" className="gap-1.5">
            <Activity className="h-3 w-3 text-accent animate-pulse" />
            <span className="text-xs">Live</span>
          </Badge>
        </div>

        {/* Top KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Total Orders', value: stats.total, sub: `+${stats.today} today`, icon: ShoppingBag, color: 'text-primary', bg: 'bg-primary/10' },
            { label: 'This Week', value: stats.week, sub: `${stats.newRequests} new requests`, icon: TrendingUp, color: 'text-accent', bg: 'bg-accent/10' },
            { label: 'In Progress', value: stats.inProgress, sub: `${stats.completed} completed`, icon: Clock, color: 'text-gold', bg: 'bg-gold/10' },
            { label: 'Urgent', value: stats.urgent, sub: 'Event ≤ 7 days', icon: AlertTriangle, color: 'text-destructive', bg: 'bg-destructive/10' },
          ].map(s => (
            <Card key={s.label} className="p-4 hover:shadow-warm transition-shadow">
              <div className={`w-9 h-9 rounded-lg ${s.bg} flex items-center justify-center mb-2`}>
                <s.icon className={`h-5 w-5 ${s.color}`} />
              </div>
              <p className="text-2xl md:text-3xl font-bold text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground font-medium">{s.label}</p>
              <p className="text-[10px] text-muted-foreground/70 mt-1">{s.sub}</p>
            </Card>
          ))}
        </div>

        {/* Revenue & Clients row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Card className="p-4 bg-gradient-to-br from-primary/10 to-gold/5 border-primary/20">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Estimated Revenue</p>
                <p className="text-2xl font-bold text-foreground mt-1">
                  K{stats.totalRevenue.toLocaleString()}
                </p>
                <p className="text-xs text-accent mt-1">K{stats.completedRevenue.toLocaleString()} from completed</p>
              </div>
              <DollarSign className="h-5 w-5 text-primary" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Total Clients</p>
                <p className="text-2xl font-bold text-foreground mt-1">{stats.clients}</p>
                <p className="text-xs text-muted-foreground mt-1">Registered customers</p>
              </div>
              <Users className="h-5 w-5 text-gold" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Upcoming Appointments</p>
                <p className="text-2xl font-bold text-foreground mt-1">{stats.upcomingApts}</p>
                <Link to="/dashboard/admin/appointments" className="text-xs text-primary mt-1 inline-flex items-center gap-1 hover:underline">
                  View schedule <ArrowUpRight className="h-3 w-3" />
                </Link>
              </div>
              <Calendar className="h-5 w-5 text-accent" />
            </div>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {/* Bookings over time */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-serif text-base font-semibold text-foreground">Bookings Trend</h3>
                <p className="text-xs text-muted-foreground">Orders over the last 14 days</p>
              </div>
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={bookingsTimeSeries}>
                <defs>
                  <linearGradient id="orderGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    background: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Area type="monotone" dataKey="orders" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#orderGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </Card>

          {/* Service popularity */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-serif text-base font-semibold text-foreground">Popular Services</h3>
                <p className="text-xs text-muted-foreground">Top categories by orders</p>
              </div>
              <Sparkles className="h-4 w-4 text-gold" />
            </div>
            {servicePopularity.length === 0 ? (
              <div className="h-[220px] flex items-center justify-center text-sm text-muted-foreground">
                No data yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={servicePopularity}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {servicePopularity.map((_, i) => (
                      <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </Card>
        </div>

        {/* Pipeline */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-serif text-base font-semibold text-foreground">Order Pipeline</h3>
              <p className="text-xs text-muted-foreground">Orders by workflow stage</p>
            </div>
            <Link to="/dashboard/admin/orders" className="text-xs text-primary hover:underline inline-flex items-center gap-1">
              Manage <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={pipeline}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
              <XAxis dataKey="shortName" stroke="hsl(var(--muted-foreground))" fontSize={10} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  background: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
              <Bar dataKey="count" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Activity feed + New requests */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-serif text-base font-semibold text-foreground">Activity Log</h3>
              <Activity className="h-4 w-4 text-accent" />
            </div>
            <div className="space-y-2 max-h-[320px] overflow-y-auto">
              {activityFeed.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No activity yet</p>
              )}
              {activityFeed.map((event, i) => (
                <div key={i} className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 transition-colors">
                  <div className={`w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0`}>
                    <event.icon className={`h-4 w-4 ${event.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground truncate">{event.label}</p>
                    <p className="text-[10px] text-muted-foreground">{formatTime(event.time)}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-serif text-base font-semibold text-foreground">New Requests</h3>
              <Link to="/dashboard/admin/orders" className="text-xs text-primary hover:underline">View all</Link>
            </div>
            <div className="space-y-2 max-h-[320px] overflow-y-auto">
              {orders.filter(o => o.status === 'request_submitted').slice(0, 6).map(order => {
                const statusInfo = getStatusInfo(order.status);
                return (
                  <div key={order.id} className="p-3 rounded-md border border-border hover:border-primary/40 transition-colors">
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground truncate">
                          {getCategoryLabel(order.category)}
                        </p>
                        <p className="text-xs text-muted-foreground line-clamp-1">{order.description}</p>
                      </div>
                      {order.event_date && (
                        <Badge variant="outline" className="text-[10px] shrink-0">
                          📅 {new Date(order.event_date).toLocaleDateString()}
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}
              {orders.filter(o => o.status === 'request_submitted').length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No new requests 🎉</p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
