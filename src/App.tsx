import { useEffect, useState, ReactNode } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/firebase";

// UI and Provider Imports
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Page Imports
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import StudentLogin from "./components/StudentLogin";
import TeacherLogin from "./components/TeacherLogin";
import StudentDashboard from "./components/StudentDashboard";
import TeacherDashboard from "./components/TeacherDashboard";
import StudentRegister from "@/components/StudentRegister";

const queryClient = new QueryClient();

// Helper component to protect routes
const ProtectedRoute = ({ user, children }: { user: User | null; children: ReactNode }) => {
  if (!user) {
    return <Navigate to="/student-login" replace />;
  }
  return <>{children}</>;
};

// This new component contains our routing and auth logic
const AppRoutes = () => {
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // This is the listener that detects logins, logouts, and registrations.
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setAuthUser(user);
      setAuthLoading(false);
      
      // If a user has just logged in or registered, redirect them to the dashboard.
      if (user && (location.pathname === "/student-login" || location.pathname === "/student-register")) {
        navigate("/student-dashboard");
      }
    });

    return () => unsubscribe();
  }, [navigate, location.pathname]); // Re-run if navigation or location changes

  if (authLoading) {
    return <div className="flex h-screen w-full items-center justify-center">Authenticating...</div>;
  }

  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/student-login" element={<StudentLogin />} />
      <Route path="/teacher-login" element={<TeacherLogin />} />
      <Route path="/student-register" element={<StudentRegister />} />
      
      <Route
        path="/student-dashboard"
        element={
          <ProtectedRoute user={authUser}>
            {authUser && <StudentDashboard user={authUser} />}
          </ProtectedRoute>
        }
      />

      <Route path="/teacher-dashboard" element={<TeacherDashboard />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

// Main App component now just sets up the providers and router
const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;