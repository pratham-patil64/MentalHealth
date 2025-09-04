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

// Helper component to protect routes, now with a customizable redirect path
const ProtectedRoute = ({ user, children, redirectTo = "/student-login" }: { user: User | null; children: ReactNode; redirectTo?: string }) => {
  if (!user) {
    return <Navigate to={redirectTo} replace />;
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
    // This listener detects logins, logouts, and registrations globally.
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setAuthUser(user);
      setAuthLoading(false);
      
      // If a user has just logged in or registered as a student, redirect them.
      // Teacher redirection is handled within TeacherLogin to allow for role verification first.
      if (user && (location.pathname === "/student-login" || location.pathname === "/student-register")) {
        navigate("/student-dashboard");
      }
    });

    // Cleanup the listener when the component unmounts
    return () => unsubscribe();
  }, [navigate, location.pathname]);

  if (authLoading) {
    return <div className="flex h-screen w-full items-center justify-center">Authenticating...</div>;
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Index />} />
      <Route path="/student-login" element={<StudentLogin />} />
      <Route path="/teacher-login" element={<TeacherLogin />} />
      <Route path="/student-register" element={<StudentRegister />} />
      
      {/* Protected Student Route */}
      <Route
        path="/student-dashboard"
        element={
          <ProtectedRoute user={authUser} redirectTo="/student-login">
            {/* We must ensure authUser is not null before passing it as a prop */}
            {authUser && <StudentDashboard user={authUser} />}
          </ProtectedRoute>
        }
      />

      {/* Protected Teacher Route */}
      <Route
        path="/teacher-dashboard"
        element={
          <ProtectedRoute user={authUser} redirectTo="/teacher-login">
            <TeacherDashboard />
          </ProtectedRoute>
        }
      />
      
      {/* Catch-all Not Found Route */}
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
