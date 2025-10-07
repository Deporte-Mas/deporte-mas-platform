import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { StripeProvider } from "@/lib/stripe-provider";
import { AuthProvider } from "@/contexts/AuthContext";
import { DevModeRibbon } from "@/components/DevModeRibbon";
import Index from "./pages/Index";
import Gracias from "./pages/Gracias";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <StripeProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <DevModeRibbon />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/gracias" element={<Gracias />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </StripeProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
