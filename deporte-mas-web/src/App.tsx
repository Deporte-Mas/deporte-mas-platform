import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { StripeProvider } from "@/lib/stripe-provider";
import { AuthProvider } from "@/contexts/AuthContext";
import { AdminAuthProvider } from "@/contexts/AdminAuthContext";
import { DevModeRibbon } from "@/components/DevModeRibbon";
import Index from "./pages/Index";
import Gracias from "./pages/Gracias";
import NotFound from "./pages/NotFound";
import AdminLayout from "./components/admin/AdminLayout";
import AdminAuthGuard from "./components/admin/AdminAuthGuard";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminAuthVerify from "./pages/admin/AdminAuthVerify";
import AdminDashboard from "./pages/admin/AdminDashboard";
import UserManagement from "./pages/admin/UserManagement";
import CourseManagement from "./pages/admin/CourseManagement";
import CourseDetail from "./pages/admin/CourseDetail";
import VideoManagement from "./pages/admin/VideoManagement";
import LivestreamManagement from "./pages/admin/LivestreamManagement";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <AdminAuthProvider>
        <StripeProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <DevModeRibbon />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/gracias" element={<Gracias />} />

                {/* Admin Auth Routes (Public) */}
                <Route path="/admin/auth/login" element={<AdminLogin />} />
                <Route path="/admin/auth/verify" element={<AdminAuthVerify />} />

                {/* Protected Admin Routes */}
                <Route path="/admin" element={
                  <AdminAuthGuard>
                    <AdminLayout />
                  </AdminAuthGuard>
                }>
                  <Route index element={<AdminDashboard />} />
                  <Route path="users" element={<UserManagement />} />
                  <Route path="courses" element={<CourseManagement />} />
                  <Route path="courses/:courseId" element={<CourseDetail />} />
                  <Route path="videos" element={<VideoManagement />} />
                  <Route path="livestreams" element={<LivestreamManagement />} />
                </Route>

                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </StripeProvider>
      </AdminAuthProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
