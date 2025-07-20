import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import Auth from "@/components/Auth";
import Navbar from "@/components/Navbar";
import Index from "./pages/Index";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import { GoogleOAuthProvider } from "@react-oauth/google";

const queryClient = new QueryClient();

const App = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <h2 className="text-2xl font-semibold mb-2">Loading...</h2>
          <p className="text-muted-foreground">Initializing Professor Connect</p>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <GoogleOAuthProvider clientId={import.meta.env.VITE_CLIENT_ID}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          {!user ? (
            <Auth />
          ) : (
            <>
              <Navbar />
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </>
          )}
        </BrowserRouter>
      </TooltipProvider>
      </GoogleOAuthProvider>
    </QueryClientProvider>
  );
};

export default App;
