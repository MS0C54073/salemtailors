import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { lazy, Suspense } from "react";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { queryClient } from "@/lib/queryClient";

// Public routes stay eagerly loaded — they're the landing surface.
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import AdminLogin from "./pages/AdminLogin";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

// Everything else lazy-loaded to shrink the initial JS bundle on 3G/4G.
const Book = lazy(() => import("./pages/Book"));
const Catalogue = lazy(() => import("./pages/Catalogue"));
const CatalogueItem = lazy(() => import("./pages/CatalogueItem"));
const TrackOrder = lazy(() => import("./pages/TrackOrder"));
const ClientDashboard = lazy(() => import("./pages/dashboard/ClientDashboard"));
const ClientOrders = lazy(() => import("./pages/dashboard/ClientOrders"));
const NewGarmentRequest = lazy(() => import("./pages/dashboard/NewGarmentRequest"));
const ClientAppointments = lazy(() => import("./pages/dashboard/ClientAppointments"));
const ClientProfile = lazy(() => import("./pages/dashboard/ClientProfile"));
const AdminDashboard = lazy(() => import("./pages/dashboard/AdminDashboard"));
const AdminOrders = lazy(() => import("./pages/dashboard/AdminOrders"));
const AdminAppointments = lazy(() => import("./pages/dashboard/AdminAppointments"));
const Messages = lazy(() => import("./pages/dashboard/Messages"));
const StaffManagement = lazy(() => import("./pages/dashboard/StaffManagement"));
const Settings = lazy(() => import("./pages/dashboard/Settings"));
const AdminCustomers = lazy(() => import("./pages/dashboard/AdminCustomers"));
const AdminFinance = lazy(() => import("./pages/dashboard/AdminFinance"));
const AdminPortfolio = lazy(() => import("./pages/dashboard/AdminPortfolio"));
const AdminSlots = lazy(() => import("./pages/dashboard/AdminSlots"));
const AdminCatalogue = lazy(() => import("./pages/dashboard/AdminCatalogue"));
const AdminShopOrders = lazy(() => import("./pages/dashboard/AdminShopOrders"));

import { CartProvider } from "./contexts/CartContext";
import CartDrawer from "./components/CartDrawer";

const RouteFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
  </div>
);

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem={true} storageKey="salem-theme">
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AuthProvider>
              <CartProvider>
                <CartDrawer />
                <Suspense fallback={<RouteFallback />}>
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/book" element={<Book />} />
                    <Route path="/catalogue" element={<Catalogue />} />
                    <Route path="/catalogue/:slug" element={<CatalogueItem />} />
                    <Route path="/track" element={<TrackOrder />} />

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
                    <Route path="/dashboard/admin/shop-orders" element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'sub_admin']}><AdminShopOrders /></ProtectedRoute>} />
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
                </Suspense>
              </CartProvider>
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
