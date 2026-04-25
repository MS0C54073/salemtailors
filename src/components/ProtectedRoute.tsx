import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { AppRole } from '@/lib/supabase-helpers';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: AppRole[];
}

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;
  // Deny access when role is unknown (null) for any role-gated route — prevents bypass
  // when the role lookup fails or is still in flight.
  if (allowedRoles) {
    if (!role) return <Navigate to="/auth" replace />;
    if (!allowedRoles.includes(role)) {
      return <Navigate to={role === 'client' ? '/dashboard/client' : '/dashboard/admin'} replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
