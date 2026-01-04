import { createBrowserRouter, RouterProvider } from "react-router-dom";
import RootLayout from "../layouts/RootLayout";
import AuthLayout from "../layouts/AuthLayout";
import DashboardLayout from "../layouts/DashboardLayout";
import Dashboard from "../pages/dashboard/Dashboard";
import UsersIndex from "../pages/dashboard/users/UsersIndex";
import BusinessSettings from "../pages/dashboard/business/BusinessSettings";
import {
  ClientsIndex,
  ClientDetail,
  ProjectDetail,
} from "../pages/dashboard/clients";
import AuthSignIn from "../pages/auth/AuthSignIn";
import AuthSignUp from "../pages/auth/AuthSignUp";
import AuthConfirm from "../pages/auth/AuthConfirm";
import AuthForgotPassword from "../pages/auth/AuthForgotPassword";
import AuthResetPassword from "../pages/auth/AuthResetPassword";
import AuthVerifyEmail from "../pages/auth/AuthVerifyEmail";
import ProtectedRoute from "../components/routing/ProtectedRoute";
import Home from "../pages/root/Home";
import NotFound from "../pages/errors/NotFound";
import ErrorBoundary from "../components/errors/ErrorBoundary";

// Exportar la variable router para que pueda ser importada directamente
export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    errorElement: <ErrorBoundary />,
    children: [{ index: true, element: <Home /> }],
  },
  {
    path: "auth",
    element: <AuthLayout />,
    errorElement: <ErrorBoundary />,
    children: [
      { path: "signin", element: <AuthSignIn /> },
      { path: "signup", element: <AuthSignUp /> },
      { path: "confirm", element: <AuthConfirm /> },
      { path: "verify-email", element: <AuthVerifyEmail /> },
      { path: "forgot-password", element: <AuthForgotPassword /> },
      { path: "reset-password", element: <AuthResetPassword /> },
      { path: "reset-password/:token", element: <AuthResetPassword /> },
    ],
  },
  {
    path: "identity",
    element: <AuthLayout />,
    errorElement: <ErrorBoundary />,
    children: [{ path: "email_verification", element: <AuthVerifyEmail /> }],
  },
  {
    path: "dashboard",
    element: <DashboardLayout />,
    errorElement: <ErrorBoundary />,
    children: [
      { index: true, element: <Dashboard /> },
      {
        path: "users",
        element: (
          <ProtectedRoute requiredRoles={["admin", "manager"]}>
            <UsersIndex />
          </ProtectedRoute>
        ),
      },
      {
        path: "business",
        element: (
          <ProtectedRoute requiredRoles={["admin", "manager"]}>
            <BusinessSettings />
          </ProtectedRoute>
        ),
      },
      {
        path: "clients",
        element: (
          <ProtectedRoute requiredRoles={["admin", "manager"]}>
            <ClientsIndex />
          </ProtectedRoute>
        ),
      },
      {
        path: "clients/:id",
        element: (
          <ProtectedRoute requiredRoles={["admin", "manager"]}>
            <ClientDetail />
          </ProtectedRoute>
        ),
      },
      {
        path: "projects/:id",
        element: (
          <ProtectedRoute requiredRoles={["admin", "manager"]}>
            <ProjectDetail />
          </ProtectedRoute>
        ),
      },
      // Add a catch-all route for 404

      // Add more dashboard routes here
    ],
  },
  {
    path: "*",
    element: <NotFound />,
  },
]);

export default function AppRoutes() {
  return <RouterProvider router={router} />;
}
