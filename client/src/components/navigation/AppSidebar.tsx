import { NavLink, useLocation } from "react-router-dom";
import { useEffect, useMemo } from "react";
import {
  Home,
  Users,
  Settings,
  LogOut,
  ChevronsUpDown,
  Building2,
  FileText,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useBusinessStore } from "../../stores/businessStore";
import logo from "../../assets/logo.png";

interface AppSidebarProps {
  user: any;
  canManageUsers: boolean;
  setLogoutModalOpen: (open: boolean) => void;
}

// Helper function to get user initials
const getInitials = (fullname: string): string => {
  if (!fullname) return "U";

  const names = fullname.trim().split(" ");
  if (names.length >= 2) {
    return `${names[0][0]}${names[1][0]}`.toUpperCase();
  }
  return names[0].substring(0, 2).toUpperCase();
};

export default function AppSidebar({
  user,
  canManageUsers,
  setLogoutModalOpen,
}: AppSidebarProps) {
  // Fetch business data so we can show logo + name (cached in store)
  const { fetchPublicBusiness, publicBusiness } = useBusinessStore();
  const { isMobile } = useSidebar();
  const location = useLocation();

  // Helper function to check if a menu item is active
  const isActiveRoute = (to: string, end?: boolean) => {
    if (end) {
      return location.pathname === to;
    }
    return location.pathname.startsWith(to);
  };

  useEffect(() => {
    const load = async () => {
      try {
        await fetchPublicBusiness();
      } catch (e) {
        // silent fail
      }
    };
    load();
  }, [fetchPublicBusiness]);

  // Navigation configuration
  interface NavItem {
    to: string;
    label: string;
    icon: any;
    show: boolean;
    end?: boolean;
  }

  const navItems: NavItem[] = useMemo(
    () => [
      {
        to: "/dashboard",
        label: "Dashboard",
        icon: Home,
        show: true,
        end: true,
      },
      {
        to: "/dashboard/clients",
        label: "Clientes",
        icon: Building2,
        show: canManageUsers,
      },
      {
        to: "/dashboard/quotes",
        label: "Cotizaciones",
        icon: FileText,
        show: canManageUsers,
      },
      {
        to: "/dashboard/invoices",
        label: "Cuentas de cobro",
        icon: FileText,
        show: canManageUsers,
      },
      {
        to: "/dashboard/users",
        label: "Usuarios",
        icon: Users,
        show: canManageUsers,
      },
      {
        to: "/dashboard/business",
        label: "Configuración",
        icon: Settings,
        show: canManageUsers,
      },
    ],
    [canManageUsers]
  );

  return (
    <Sidebar variant="inset" collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <NavLink to="/dashboard">
                <div className="flex items-center justify-center rounded-lg aspect-square size-8 bg-sidebar-primary text-sidebar-primary-foreground">
                  {publicBusiness?.logo_url ? (
                    <img
                      src={publicBusiness.logo_url}
                      alt={`Logo ${publicBusiness?.name || "Academy"}`}
                      className="size-4"
                    />
                  ) : (
                    <img src={logo} alt="Logo" className="size-4" />
                  )}
                </div>
                <div className="grid flex-1 text-sm leading-tight text-left">
                  <span className="font-semibold truncate">
                    {publicBusiness?.name || "Academy"}
                  </span>
                  <span className="text-xs truncate">Dashboard</span>
                </div>
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navegación</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems
                .filter((item) => item.show)
                .map((item) => {
                  const isActive = isActiveRoute(item.to, item.end);
                  return (
                    <SidebarMenuItem key={item.to}>
                      <SidebarMenuButton
                        asChild
                        tooltip={item.label}
                        isActive={isActive}
                      >
                        <NavLink to={item.to} end={item.end}>
                          <item.icon />
                          <span>{item.label}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="w-8 h-8 rounded-lg">
                    <AvatarFallback className="rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                      {getInitials(user.fullname)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-sm leading-tight text-left">
                    <span className="font-semibold truncate">
                      {user.fullname}
                    </span>
                    <span className="text-xs truncate">@{user.username}</span>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side={isMobile ? "bottom" : "right"}
                align="end"
                sideOffset={4}
              >
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <Avatar className="w-8 h-8 rounded-lg">
                      <AvatarFallback className="rounded-lg">
                        {getInitials(user.fullname)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-sm leading-tight text-left">
                      <span className="font-semibold truncate">
                        {user.fullname}
                      </span>
                      <span className="text-xs truncate">{user.email}</span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <NavLink to="/" className="flex items-center gap-2">
                    <Home className="size-4" />
                    Inicio
                  </NavLink>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setLogoutModalOpen(true)}
                  className="flex items-center gap-2 text-red-600"
                >
                  <LogOut className="size-4" />
                  Cerrar Sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
