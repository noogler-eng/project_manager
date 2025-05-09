import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { useAuthStore } from "./store/authStore";

import AuthLayout from "./components/layouts/AuthLayout";
import DashboardLayout from "./components/layouts/DashboardLayout";

import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";

import StudentDashboard from "./pages/student/StudentDashboard";
import StudentProjectDetails from "./pages/student/StudentProjectDetails";
import StudentProfile from "./pages/student/StudentProfile";

import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminProjectsList from "./pages/admin/AdminProjectsList";
import AdminProjectDetails from "./pages/admin/AdminProjectDetails";
import AdminCreateProject from "./pages/admin/AdminCreateProject";
import AdminStudentsList from "./pages/admin/AdminStudentsList";

import NotFoundPage from "./pages/shared/NotFoundPage";

// Move LoadingScreen component outside of App component to avoid redefinition
const LoadingScreen: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-pulse-slow flex flex-col items-center">
        <div className="rounded-full bg-primary-600 h-16 w-16 flex items-center justify-center mb-4">
          <svg
            className="text-white h-8 w-8"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-700">Loading...</h3>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const { user, session, loading, initialized, getSession } = useAuthStore();

  useEffect(() => {
    // Only fetch session if not already initialized
    if (!initialized) {
      getSession();
    }
  }, [initialized, getSession]);

  // Don't render anything until initial auth check is complete
  if (!initialized) {
    return <LoadingScreen />;
  }

  // Route guards
  const AuthenticatedRoute = ({ children }: { children: React.ReactNode }) => {
    if (loading) return <LoadingScreen />;
    return session ? <>{children}</> : <Navigate to="/login" />;
  };

  const StudentRoute = ({ children }: { children: React.ReactNode }) => {
    if (loading) return <LoadingScreen />;
    return session && user?.role === "student" ? (
      <>{children}</>
    ) : (
      <Navigate to="/login" />
    );
  };

  const AdminRoute = ({ children }: { children: React.ReactNode }) => {
    if (loading) return <LoadingScreen />;
    return session && user?.role === "admin" ? (
      <>{children}</>
    ) : (
      <Navigate to="/login" />
    );
  };

  const GuestRoute = ({ children }: { children: React.ReactNode }) => {
    if (loading) return <LoadingScreen />;
    if (session) {
      return (
        <Navigate
          to={user?.role === "admin" ? "/admin/dashboard" : "/dashboard"}
        />
      );
    }
    return <>{children}</>;
  };

  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        {/* Auth Routes */}
        <Route path="/" element={<Navigate to="/login" />} />
        <Route
          path="/login"
          element={
            <GuestRoute>
              <AuthLayout
                title="Welcome back"
                subtitle="Sign in to your account to continue"
              >
                <LoginPage />
              </AuthLayout>
            </GuestRoute>
          }
        />
        <Route
          path="/register"
          element={
            <GuestRoute>
              <AuthLayout
                title="Create an account"
                subtitle="Fill in your details to get started"
              >
                <RegisterPage />
              </AuthLayout>
            </GuestRoute>
          }
        />

        {/* Student Routes */}
        <Route
          path="/dashboard"
          element={
            <StudentRoute>
              <DashboardLayout>
                <StudentDashboard />
              </DashboardLayout>
            </StudentRoute>
          }
        />
        <Route
          path="/projects/:id"
          element={
            <StudentRoute>
              <DashboardLayout>
                <StudentProjectDetails />
              </DashboardLayout>
            </StudentRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <StudentRoute>
              <DashboardLayout>
                <StudentProfile />
              </DashboardLayout>
            </StudentRoute>
          }
        />

        {/* Admin Routes */}
        <Route
          path="/admin/dashboard"
          element={
            <AdminRoute>
              <DashboardLayout>
                <AdminDashboard />
              </DashboardLayout>
            </AdminRoute>
          }
        />

        <Route
          path="/admin/projects"
          element={
            <AdminRoute>
              <DashboardLayout>
                <AdminProjectsList />
              </DashboardLayout>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/projects/new"
          element={
            <AdminRoute>
              <DashboardLayout>
                <AdminCreateProject />
              </DashboardLayout>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/projects/:id"
          element={
            <AdminRoute>
              <DashboardLayout>
                <AdminProjectDetails />
              </DashboardLayout>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/students"
          element={
            <AdminRoute>
              <DashboardLayout>
                <AdminStudentsList />
              </DashboardLayout>
            </AdminRoute>
          }
        />

        {/* 404 Page */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
