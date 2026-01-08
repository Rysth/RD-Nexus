import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";
import { useState } from "react";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import LogoutModal from "../components/shared/LogoutModal";
import AppSidebar from "../components/navigation/AppSidebar";

const ALLOWED_ROLES = ["admin", "manager", "operator"];
const USER_MANAGEMENT_ROLES = ["admin", "manager"];

export default function DashboardLayout() {
  const { user } = useAuthStore();
  const location = useLocation();
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);

  const hasAccess = user?.roles.some((role) => ALLOWED_ROLES.includes(role));
  const canManageUsers =
    user?.roles.some((role) => USER_MANAGEMENT_ROLES.includes(role)) ?? false;

  // Generate breadcrumbs based on current path
  const getBreadcrumbs = () => {
    const path = location.pathname;
    if (path === "/dashboard") {
      return { section: "Dashboard", page: "Panel de Control" };
    } else if (path === "/dashboard/users") {
      return { section: "Dashboard", page: "Usuarios" };
    } else if (path === "/dashboard/business") {
      return { section: "Dashboard", page: "Configuración" };
    } else if (path === "/dashboard/clients") {
      return { section: "Dashboard", page: "Clientes" };
    } else if (path.startsWith("/dashboard/clients/")) {
      return { section: "Clientes", page: "Detalle" };
    } else if (path.startsWith("/dashboard/projects/")) {
      return { section: "Proyectos", page: "Detalle" };
    } else if (path === "/dashboard/quotes") {
      return { section: "Dashboard", page: "Cotizaciones" };
    } else if (path === "/dashboard/quotes/new") {
      return { section: "Cotizaciones", page: "Nueva" };
    } else if (path.match(/\/dashboard\/quotes\/\d+\/edit/)) {
      return { section: "Cotizaciones", page: "Editar" };
    } else if (path.startsWith("/dashboard/quotes/")) {
      return { section: "Cotizaciones", page: "Detalle" };
    } else if (path === "/dashboard/invoices") {
      return { section: "Dashboard", page: "Comprobantes" };
    } else if (path === "/dashboard/invoices/new") {
      return { section: "Comprobantes", page: "Nuevo" };
    } else if (path.match(/\/dashboard\/invoices\/\d+\/edit/)) {
      return { section: "Comprobantes", page: "Editar" };
    } else if (path.startsWith("/dashboard/invoices/")) {
      return { section: "Comprobantes", page: "Detalle" };
    }
    return { section: "Dashboard", page: "Panel de Control" };
  };

  const breadcrumbs = getBreadcrumbs();

  if (!user) {
    return <Navigate to="/auth/signin" />;
  }

  if (!hasAccess) {
    return <Navigate to="/" />;
  }

  return (
    <SidebarProvider>
      <AppSidebar
        user={user}
        canManageUsers={canManageUsers}
        setLogoutModalOpen={setLogoutModalOpen}
      />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/dashboard">
                    {breadcrumbs.section}
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>{breadcrumbs.page}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <Outlet />
        </div>
      </SidebarInset>
      {/* Logout Modal */}
      <LogoutModal
        isOpen={logoutModalOpen}
        onClose={() => setLogoutModalOpen(false)}
      />
    </SidebarProvider>
  );
}
