"use client";

import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { User } from "../../../stores/userStore";

interface ColumnsProps {
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
  onToggleConfirmation: (user: User) => void;
  onUpdatePassword: (user: User) => void;
  canManageUsers: boolean;
  currentUserId?: number;
  confirmingUserId: number | null;
}

const getRoleConfig = (roleName: string) => {
  const roleConfig: Record<string, any> = {
    admin: {
      label: "Administrador",
      variant: "default",
    },
    manager: {
      label: "Gerente",
      variant: "secondary",
    },
    user: {
      label: "Usuario",
      variant: "outline",
    },
  };
  return roleConfig[roleName] || roleConfig.user;
};

const getInitials = (fullname: string): string => {
  if (!fullname) return "U";
  const names = fullname.trim().split(" ");
  if (names.length >= 2) {
    return `${names[0][0]}${names[1][0]}`.toUpperCase();
  }
  return names[0].substring(0, 2).toUpperCase();
};

export const createUsersColumns = ({
  onEdit,
  onDelete,
  onToggleConfirmation,
  onUpdatePassword,
  canManageUsers,
  currentUserId,
  confirmingUserId,
}: ColumnsProps): ColumnDef<User>[] => [
  {
    accessorKey: "fullname",
    header: "Usuario",
    cell: ({ row }) => {
      const user = row.original;
      return (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs font-medium">
              {getInitials(user.fullname)}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-medium">{user.fullname}</span>
            <span className="text-xs text-muted-foreground">
              @{user.username}
            </span>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => <span className="text-sm">{row.getValue("email")}</span>,
  },
  {
    accessorKey: "roles",
    header: "Rol",
    cell: ({ row }) => {
      const user = row.original;
      const userRole = user.roles[0];
      const roleData = getRoleConfig(userRole);
      return <Badge variant={roleData.variant as any}>{roleData.label}</Badge>;
    },
  },
  {
    accessorKey: "verified",
    header: "Estado",
    cell: ({ row }) => {
      const user = row.original;
      return user.verified ? (
        <Badge
          variant="default"
          className="bg-green-100 text-green-800 hover:bg-green-100"
        >
          Verificado
        </Badge>
      ) : (
        <Badge
          variant="secondary"
          className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
        >
          Pendiente
        </Badge>
      );
    },
  },
  ...(canManageUsers
    ? [
        {
          id: "actions",
          header: "Acciones",
          cell: ({ row }: { row: any }) => {
            const user = row.original;
            const isCurrentUser = user.id === currentUserId;
            const isConfirming = confirmingUserId === user.id;
            const isAdminUser = user.roles.includes("admin");

            return (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Abrir menú</span>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onEdit(user)}>
                    Editar usuario
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onToggleConfirmation(user)}
                    disabled={isConfirming || isAdminUser}
                  >
                    {user.verified ? "Desconfirmar" : "Confirmar"}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onUpdatePassword(user)}>
                    Cambiar contraseña
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => onDelete(user)}
                    disabled={isCurrentUser}
                    className="text-red-600"
                  >
                    Eliminar usuario
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            );
          },
        } as ColumnDef<User>,
      ]
    : []),
];
