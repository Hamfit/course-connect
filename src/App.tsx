import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import AdminRoute from "@/components/AdminRoute";
import { Loader2 } from "lucide-react";
import AuthenticationGuard from "./components/AuthenticationGuard";
import ScrollToTop from "./components/ScrollToTop";

const Index = lazy(() => import("./pages/Index"));
const Explore = lazy(() => import("./pages/Explore"));
const Upload = lazy(() => import("./pages/Upload"));
const Auth = lazy(() => import("./pages/Auth"));
const Admin = lazy(() => import("./pages/Admin"));
const Profile = lazy(() => import("./pages/Profile"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const CommunityGuidelines = lazy(() => import("./pages/CommunityGuidelines"));
const Copyright = lazy(() => import("./pages/Copyright"));
const VerifySuccess = lazy(() => import("./pages/VerifySuccess"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const RouteFallback = () => (
  <div className="flex min-h-screen items-center justify-center bg-background">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              {/* Public routes */}
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/community-guidelines" element={<CommunityGuidelines />} />
              <Route path="/copyright" element={<Copyright />} />
              <Route path="/verify-success" element={<VerifySuccess />} />

              <Route path="/" element={<Index />} />
              <Route path="/explore" element={<Explore />} />
              <Route path="/auth" element={<Auth />} />

              {/* Authenticated routes */}
              <Route element={<AuthenticationGuard />}>
                <Route path="/upload" element={<Upload />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/profile/:userId" element={<Profile />} />
                <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
