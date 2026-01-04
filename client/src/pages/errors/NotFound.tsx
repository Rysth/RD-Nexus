import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../stores/authStore";
import logo from "../../assets/logo.svg";

const DASHBOARD_ROLES = ["admin", "manager", "operator"];

export default function NotFound() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  useEffect(() => {
    const timer = setTimeout(() => {
      // Check if we're in a known layout path
      const isAuthPath = location.pathname.startsWith("/auth");
      const isDashboardPath = location.pathname.startsWith("/dashboard");
      const isRootPath = !isAuthPath && !isDashboardPath;

      if (user) {
        const canAccessDashboard = user.roles.some((role) =>
          DASHBOARD_ROLES.includes(role)
        );

        if (isDashboardPath && canAccessDashboard) {
          // If we're in dashboard but with wrong path, go to main dashboard
          navigate("/dashboard");
        } else if (isAuthPath) {
          // If user is logged in and trying to access auth paths, redirect
          if (canAccessDashboard) {
            navigate("/dashboard");
          } else {
            navigate("/");
          }
        } else {
          // For root layout or unknown paths
          if (isRootPath && location.pathname !== "/") {
            // If it's a non-existent path in root layout
            navigate("/");
          } else if (canAccessDashboard) {
            navigate("/dashboard");
          } else {
            navigate("/");
          }
        }
      } else {
        // User is not logged in
        if (isDashboardPath) {
          // Trying to access dashboard without login
          navigate("/auth/signin");
        } else if (isRootPath && location.pathname !== "/") {
          // Not logged in, trying to access non-existent root path
          navigate("/");
        } else {
          // Default for not logged in users
          navigate("/auth/signin");
        }
      }
    }, 3000); // Redirect after 3 seconds

    return () => clearTimeout(timer);
  }, [navigate, location.pathname, user]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-4 text-center">
      <div className="flex items-center gap-3 mb-8">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-2 shadow-sm">
          <img src={logo} alt="Logo MicroStock" className="w-8 h-8" />
        </div>
        <h1 className="font-bold text-2xl bg-gradient-to-r from-blue-700 to-blue-500 bg-clip-text text-transparent">
          MicroStock
        </h1>
      </div>

      <h2 className="text-6xl font-bold text-slate-800 mb-4">404</h2>
      <p className="text-2xl font-semibold text-slate-700 mb-2">
        Página no encontrada
      </p>
      <p className="text-slate-500 mb-8">
        La página que buscas no existe o ha sido movida.
      </p>

      <div className="h-12 w-12 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin"></div>
      <p className="text-sm text-slate-500 mt-4">
        Serás redirigido automáticamente en unos segundos...
      </p>
    </div>
  );
}
