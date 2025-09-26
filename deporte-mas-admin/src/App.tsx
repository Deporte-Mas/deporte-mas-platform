import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import Dashboard from '@/pages/Dashboard';
import Users from '@/pages/Users';
import Subscriptions from '@/pages/Subscriptions';
import Payments from '@/pages/Payments';
import Layout from '@/components/Layout';

function App() {
  return (
    <TooltipProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/users" element={<Users />} />
            <Route path="/subscriptions" element={<Subscriptions />} />
            <Route path="/payments" element={<Payments />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Layout>
        <Toaster />
      </BrowserRouter>
    </TooltipProvider>
  );
}

export default App;