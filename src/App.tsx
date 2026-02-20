import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import PasscodeGate from "@/components/PasscodeGate";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Lawyers from "./pages/Lawyers";
import LawyerProfile from "./pages/LawyerProfile";
import BookConsultation from "./pages/BookConsultation";
import Admin from "./pages/Admin";
import LawyerDashboard from "./pages/LawyerDashboard";
import ClientDashboard from "./pages/ClientDashboard";
import ClientOnboarding from "./pages/ClientOnboarding";
import LawyerOnboarding from "./pages/LawyerOnboarding";
import Welcome from "./pages/Welcome";
import SearchResults from "./pages/SearchResults";
import PracticeArea from "./pages/PracticeArea";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <PasscodeGate>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/welcome" element={<Welcome />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/lawyers" element={<Lawyers />} />
            <Route path="/lawyers/:id" element={<LawyerProfile />} />
            <Route path="/practice-areas/:id" element={<PracticeArea />} />
            <Route path="/search-results" element={<SearchResults />} />
            <Route 
              path="/onboarding/client" 
              element={
                <ProtectedRoute>
                  <ClientOnboarding />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/onboarding/lawyer" 
              element={
                <ProtectedRoute>
                  <LawyerOnboarding />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/book-consultation/:lawyerId" 
              element={
                <ProtectedRoute>
                  <BookConsultation />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/*" 
              element={
                <ProtectedRoute requireRole="admin">
                  <Admin />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/lawyer-dashboard" 
              element={
                <ProtectedRoute requireRole="lawyer">
                  <LawyerDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <ClientDashboard />
                </ProtectedRoute>
              } 
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </PasscodeGate>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
