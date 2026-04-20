import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Book from "./pages/Book";
import NotFound from "./pages/NotFound";
import ClientDashboard from "./pages/dashboard/ClientDashboard";
import ClientOrders from "./pages/dashboard/ClientOrders";
import NewGarmentRequest from "./pages/dashboard/NewGarmentRequest";
import ClientAppointments from "./pages/dashboard/ClientAppointments";
import AdminDashboard from "./pages/dashboard/AdminDashboard";
import AdminOrders from "./pages/dashboard/AdminOrders";
import AdminAppointments from "./pages/dashboard/AdminAppointments";
import Messages from "./pages/dashboard/Messages";
import StaffManagement from "./pages/dashboard/StaffManagement";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/book" element={<Book />} />
            <Route path="/auth" element={<Auth />} />

            {/* Client Routes */}
            <Route path="/dashboard/client" element={<ProtectedRoute allowedRoles={['client']}><ClientDashboard /></ProtectedRoute>} />
            <Route path="/dashboard/client/orders" element={<ProtectedRoute allowedRoles={['client']}><ClientOrders /></ProtectedRoute>} />
            <Route path="/dashboard/client/new-request" element={<ProtectedRoute allowedRoles={['client']}><NewGarmentRequest /></ProtectedRoute>} />
            <Route path="/dashboard/client/appointments" element={<ProtectedRoute allowedRoles={['client']}><ClientAppointments /></ProtectedRoute>} />
            <Route path="/dashboard/client/messages" element={<ProtectedRoute allowedRoles={['client']}><Messages /></ProtectedRoute>} />

            {/* Admin/Staff Routes */}
            <Route path="/dashboard/admin" element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'sub_admin']}><AdminDashboard /></ProtectedRoute>} />
            <Route path="/dashboard/admin/orders" element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'sub_admin']}><AdminOrders /></ProtectedRoute>} />
            <Route path="/dashboard/admin/appointments" element={<ProtectedRoute allowedRoles={['super_admin', 'admin']}><AdminAppointments /></ProtectedRoute>} />
            <Route path="/dashboard/admin/messages" element={<ProtectedRoute allowedRoles={['super_admin', 'admin']}><Messages /></ProtectedRoute>} />
            <Route path="/dashboard/admin/staff" element={<ProtectedRoute allowedRoles={['super_admin']}><StaffManagement /></ProtectedRoute>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
