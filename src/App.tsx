// src/App.tsx

import { useEffect, useState, ReactNode } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/firebase";
import { GoogleOAuthProvider } from '@react-oauth/google';

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
import AdminDashboard from "./components/AdminDashboard";
import StudentRegister from "@/components/StudentRegister";
import TeacherPortal from "./components/TeacherPortal";
import StudentReport from "./components/StudentReport"; // <-- 1. IMPORT THE NEW COMPONENT

const queryClient = new QueryClient();

// Helper component (same as before)
const ProtectedRoute = ({ user, children, redirectTo = "/student-login" }: { user: User | null; children: ReactNode; redirectTo?: string }) => {
  if (!user) {
    return <Navigate to={redirectTo} replace />;
  }
  return <>{children}</>;
};

// App routing logic (same as before)
const AppRoutes = () => {
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [googleToken, setGoogleToken] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setAuthUser(user);
      setAuthLoading(false);
      
      if (user && (location.pathname === "/student-login" || location.pathname === "/student-register")) {
        navigate("/student-dashboard");
      }
    });
    const storedToken = sessionStorage.getItem('googleAccessToken');
    if (storedToken) {
        setGoogleToken(storedToken);
    }
    return () => unsubscribe();
  }, [navigate, location.pathname]);

  const handleGoogleLoginSuccess = (token: string) => {
    setGoogleToken(token);
    sessionStorage.setItem('googleAccessToken', token);
    navigate("/student-dashboard");
  };

  if (authLoading) {
    return <div className="flex h-screen w-full items-center justify-center">Authenticating...</div>;
  }

  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/student-login" element={<StudentLogin onGoogleLoginSuccess={handleGoogleLoginSuccess} />} />
      <Route path="/teacher-login" element={<TeacherLogin />} />
      <Route path="/student-register" element={<StudentRegister />} />
      
      <Route
        path="/student-dashboard"
        element={
          <ProtectedRoute user={authUser} redirectTo="/student-login">
            {authUser && <StudentDashboard user={authUser} googleAccessToken={googleToken} />}
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher-dashboard"
        element={
          <ProtectedRoute user={authUser} redirectTo="/teacher-login">
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
       <Route
        path="/teacher-portal"
        element={
          <ProtectedRoute user={authUser} redirectTo="/teacher-login">
            <TeacherPortal />
          </ProtectedRoute>
        }
      />
       <Route
        path="/admin-dashboard"
        element={
          <ProtectedRoute user={authUser} redirectTo="/teacher-login">
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      
      {/* --- 2. ADD THE NEW REPORT ROUTE --- */}
      <Route
        path="/report/:studentId"
        element={
          <ProtectedRoute user={authUser} redirectTo="/teacher-login">
            <StudentReport />
          </ProtectedRoute>
        }
      />
      
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

// Main App component (same as before)
const App = () => (
  <GoogleOAuthProvider clientId="162276798485-j874m3oenarvot0qpemr4k14to8kd0fh.apps.googleusercontent.com">
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </GoogleOAuthProvider>
);

export default App;