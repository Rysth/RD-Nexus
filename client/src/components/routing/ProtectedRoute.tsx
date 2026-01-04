import { Navigate } from "react-router-dom";
import { useAuthStore } from "../../stores/authStore";
import { ReactNode, useEffect } from "react";
import toast from "react-hot-toast";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRoles: string[];
}

export default function ProtectedRoute({
  children,
  requiredRoles,
}: ProtectedRouteProps) {
  const { user } = useAuthStore();

  // If no user, redirect to login
  if (!user) {
    return <Navigate to="/auth/signin" />;
  }

  // Check if user has at least one of the required roles
  const hasRequiredRole = user.roles.some((role) =>
    requiredRoles.includes(role)
  );

  useEffect(() => {
    if (!hasRequiredRole) {
      toast.error("No tienes permisos para acceder a esta sección");
    }
  }, [hasRequiredRole]);

  if (!hasRequiredRole) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
