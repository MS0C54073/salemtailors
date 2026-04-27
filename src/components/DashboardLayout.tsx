import { ReactNode, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Scissors, LayoutDashboard, ShoppingBag, Calendar, MessageCircle, Users, LogOut, ArrowLeft, Settings as SettingsIcon, Wallet, Image as ImageIcon, UserCircle, Package, MoreHorizontal, Ruler } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

const DashboardLayout = ({ children }: { children: ReactNode }) => {
  const [moreOpen, setMoreOpen] = useState(false);
  const { role, signOut, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isStaff = role === 'super_admin' || role === 'admin' || role === 'sub_admin';

  const clientLinks = [
    { to: '/dashboard/client', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/dashboard/client/orders', icon: ShoppingBag, label: 'My Orders' },
    { to: '/dashboard/client/new-request', icon: Scissors, label: 'New Request' },
    { to: '/dashboard/client/appointments', icon: Calendar, label: 'Appointments' },
    { to: '/dashboard/client/profile', icon: Ruler, label: 'Profile' },
    { to: '/dashboard/client/messages', icon: MessageCircle, label: 'Messages' },
  ];

  const staffLinks = [
    { to: '/dashboard/admin', icon: LayoutDashboard, label: 'Home' },
    { to: '/dashboard/admin/orders', icon: ShoppingBag, label: 'Orders' },
    { to: '/dashboard/admin/catalogue', icon: Package, label: 'Catalogue' },
    { to: '/dashboard/admin/appointments', icon: Calendar, label: 'Calendar' },
    { to: '/dashboard/admin/customers', icon: UserCircle, label: 'Customers' },
    { to: '/dashboard/admin/finance', icon: Wallet, label: 'Finance' },
    { to: '/dashboard/admin/portfolio', icon: ImageIcon, label: 'Portfolio' },
    { to: '/dashboard/admin/messages', icon: MessageCircle, label: 'Messages' },
    ...(role === 'super_admin' ? [{ to: '/dashboard/admin/staff', icon: Users, label: 'Staff' }] : []),
  ];

  const links = isStaff ? staffLinks : clientLinks;
  const dashboardHome = isStaff ? '/dashboard/admin' : '/dashboard/client';
  const isOnDashboardHome = location.pathname === dashboardHome;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {!isOnDashboardHome && (
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Scissors className="h-5 w-5 text-primary" />
            <span className="font-serif text-lg font-bold text-foreground">Salem</span>
          </Link>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground capitalize hidden sm:inline">{role?.replace('_', ' ')}</span>
          <Link to="/dashboard/settings">
            <Button variant="ghost" size="icon" title="Settings">
              <SettingsIcon className="h-4 w-4" />
            </Button>
          </Link>
          <Button variant="ghost" size="icon" onClick={signOut} title="Sign out">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 pb-20 px-4 py-4">
        {children}
      </main>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border px-2 py-1 flex justify-around z-40">
        {links.slice(0, 4).map(link => {
          const active = location.pathname === link.to;
          return (
            <Link
              key={link.to}
              to={link.to}
              className={`flex flex-col items-center py-1.5 px-2 rounded-md transition-colors ${
                active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <link.icon className="h-5 w-5" />
              <span className="text-[10px] mt-0.5 font-medium">{link.label}</span>
            </Link>
          );
        })}
        {links.length > 4 && (
          <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
            <SheetTrigger asChild>
              <button className="flex flex-col items-center py-1.5 px-2 rounded-md text-muted-foreground hover:text-foreground transition-colors">
                <MoreHorizontal className="h-5 w-5" />
                <span className="text-[10px] mt-0.5 font-medium">More</span>
              </button>
            </SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-2xl">
              <SheetHeader><SheetTitle className="font-serif text-left">All sections</SheetTitle></SheetHeader>
              <div className="grid grid-cols-3 gap-2 mt-4 pb-4">
                {links.slice(4).map(link => {
                  const active = location.pathname === link.to;
                  return (
                    <Link
                      key={link.to}
                      to={link.to}
                      onClick={() => setMoreOpen(false)}
                      className={`flex flex-col items-center justify-center gap-1 p-4 rounded-lg border ${
                        active ? 'border-primary bg-primary/5 text-primary' : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <link.icon className="h-5 w-5" />
                      <span className="text-xs font-medium">{link.label}</span>
                    </Link>
                  );
                })}
              </div>
            </SheetContent>
          </Sheet>
        )}
      </nav>
    </div>
  );
};

export default DashboardLayout;
