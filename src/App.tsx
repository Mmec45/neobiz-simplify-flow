
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { AuthGuard } from "@/components/AuthGuard";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Admin from "./pages/Admin";
import Invoices from "./pages/Invoices";
import Projects from "./pages/Projects";
import Finance from "./pages/Finance";
import NotFound from "./pages/NotFound";
import DashboardLayout from "@/components/DashboardLayout";
import AIAssistant from "./pages/AIAssistant";

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
            <Route path="/auth" element={<Auth />} />
            
            {/* Protected routes */}
            <Route path="/dashboard" element={
              <AuthGuard>
                <DashboardLayout>
                  <Dashboard />
                </DashboardLayout>
              </AuthGuard>
            } />
            
            <Route path="/admin" element={
              <AuthGuard requireAdmin>
                <DashboardLayout>
                  <Admin />
                </DashboardLayout>
              </AuthGuard>
            } />

            {/* AI Assistant route */}
            <Route path="/ai-assistant" element={
              <AuthGuard>
                <DashboardLayout>
                  <AIAssistant />
                </DashboardLayout>
              </AuthGuard>
            } />
            
            {/* Invoices route */}
            <Route path="/invoices" element={
              <AuthGuard>
                <DashboardLayout>
                  <Invoices />
                </DashboardLayout>
              </AuthGuard>
            } />

            {/* Projects route */}
            <Route path="/projects" element={
              <AuthGuard>
                <DashboardLayout>
                  <Projects />
                </DashboardLayout>
              </AuthGuard>
            } />

            {/* Finance route */}
            <Route path="/finances" element={
              <AuthGuard>
                <DashboardLayout>
                  <Finance />
                </DashboardLayout>
              </AuthGuard>
            } />

            {/* Placeholder routes - will be implemented in future updates */}
            <Route path="/tasks" element={
              <AuthGuard>
                <DashboardLayout>
                  <div className="p-6">
                    <h1 className="text-3xl font-bold mb-6">Gestion des tâches</h1>
                    <p>Cette fonctionnalité sera disponible prochainement.</p>
                  </div>
                </DashboardLayout>
              </AuthGuard>
            } />

            <Route path="/settings" element={
              <AuthGuard>
                <DashboardLayout>
                  <div className="p-6">
                    <h1 className="text-3xl font-bold mb-6">Paramètres</h1>
                    <p>Cette fonctionnalité sera disponible prochainement.</p>
                  </div>
                </DashboardLayout>
              </AuthGuard>
            } />

            <Route path="/support" element={
              <AuthGuard>
                <DashboardLayout>
                  <div className="p-6">
                    <h1 className="text-3xl font-bold mb-6">Support</h1>
                    <p>Cette fonctionnalité sera disponible prochainement.</p>
                  </div>
                </DashboardLayout>
              </AuthGuard>
            } />

            <Route path="/notifications" element={
              <AuthGuard>
                <DashboardLayout>
                  <div className="p-6">
                    <h1 className="text-3xl font-bold mb-6">Notifications</h1>
                    <p>Cette fonctionnalité sera disponible prochainement.</p>
                  </div>
                </DashboardLayout>
              </AuthGuard>
            } />

            {/* Catch-all route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
