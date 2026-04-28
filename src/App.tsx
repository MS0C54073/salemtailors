import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
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
import ClientProfile from "./pages/dashboard/ClientProfile";
import AdminDashboard from "./pages/dashboard/AdminDashboard";
import AdminOrders from "./pages/dashboard/AdminOrders";
import AdminAppointments from "./pages/dashboard/AdminAppointments";
import Messages from "./pages/dashboard/Messages";
import StaffManagement from "./pages/dashboard/StaffManagement";
import Settings from "./pages/dashboard/Settings";
import AdminLogin from "./pages/AdminLogin";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import AdminCustomers from "./pages/dashboard/AdminCustomers";
import AdminFinance from "./pages/dashboard/AdminFinance";
import AdminPortfolio from "./pages/dashboard/AdminPortfolio";
import AdminSlots from "./pages/dashboard/AdminSlots";
import AdminCatalogue from "./pages/dashboard/AdminCatalogue";
import Catalogue from "./pages/Catalogue";
import CatalogueItem from "./pages/CatalogueItem";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={true} storageKey="salem-theme">
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/book" element={<Book />} />
            <Route path="/catalogue" element={<Catalogue />} />
            <Route path="/catalogue/:slug" element={<CatalogueItem />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/admin" element={<AdminLogin />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Client Routes */}
            <Route path="/dashboard/client" element={<ProtectedRoute allowedRoles={['client']}><ClientDashboard /></ProtectedRoute>} />
            <Route path="/dashboard/client/orders" element={<ProtectedRoute allowedRoles={['client']}><ClientOrders /></ProtectedRoute>} />
            <Route path="/dashboard/client/new-request" element={<ProtectedRoute allowedRoles={['client']}><NewGarmentRequest /></ProtectedRoute>} />
            <Route path="/dashboard/client/appointments" element={<ProtectedRoute allowedRoles={['client']}><ClientAppointments /></ProtectedRoute>} />
            <Route path="/dashboard/client/messages" element={<ProtectedRoute allowedRoles={['client']}><Messages /></ProtectedRoute>} />
            <Route path="/dashboard/client/profile" element={<ProtectedRoute allowedRoles={['client']}><ClientProfile /></ProtectedRoute>} />

            {/* Admin/Staff Routes */}
            <Route path="/dashboard/admin" element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'sub_admin']}><AdminDashboard /></ProtectedRoute>} />
            <Route path="/dashboard/admin/orders" element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'sub_admin']}><AdminOrders /></ProtectedRoute>} />
            <Route path="/dashboard/admin/appointments" element={<ProtectedRoute allowedRoles={['super_admin', 'admin']}><AdminAppointments /></ProtectedRoute>} />
            <Route path="/dashboard/admin/slots" element={<ProtectedRoute allowedRoles={['super_admin', 'admin']}><AdminSlots /></ProtectedRoute>} />
            <Route path="/dashboard/admin/customers" element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'sub_admin']}><AdminCustomers /></ProtectedRoute>} />
            <Route path="/dashboard/admin/finance" element={<ProtectedRoute allowedRoles={['super_admin', 'admin']}><AdminFinance /></ProtectedRoute>} />
            <Route path="/dashboard/admin/portfolio" element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'sub_admin']}><AdminPortfolio /></ProtectedRoute>} />
            <Route path="/dashboard/admin/catalogue" element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'sub_admin']}><AdminCatalogue /></ProtectedRoute>} />
            <Route path="/dashboard/admin/messages" element={<ProtectedRoute allowedRoles={['super_admin', 'admin']}><Messages /></ProtectedRoute>} />
            <Route path="/dashboard/admin/staff" element={<ProtectedRoute allowedRoles={['super_admin']}><StaffManagement /></ProtectedRoute>} />
            <Route path="/dashboard/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
