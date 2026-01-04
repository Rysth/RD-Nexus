import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Eye, Pencil, Trash2 } from "lucide-react";
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
import { Client } from "../../../stores/clientStore";

interface ColumnsProps {
  onView: (client: Client) => void;
  onEdit: (client: Client) => void;
  onDelete: (client: Client) => void;
}

const idTypeConfig: Record<string, { label: string; className: string }> = {
  "04": { label: "RUC", className: "bg-blue-100 text-blue-800" },
  "05": { label: "Cédula", className: "bg-green-100 text-green-800" },
  "06": { label: "Pasaporte", className: "bg-purple-100 text-purple-800" },
};

export const createClientsColumns = ({
  onView,
  onEdit,
  onDelete,
}: ColumnsProps): ColumnDef<Client>[] => [
  {
    accessorKey: "name",
    header: "Cliente",
    cell: ({ row }) => {
      const client = row.original;
      const idCfg = idTypeConfig[client.identification_type] ?? {
        label: client.identification_type,
        className: "bg-gray-100 text-gray-800",
      };

      return (
        <div className="flex flex-col gap-1">
          <div className="font-medium leading-tight">{client.name}</div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground"></div>
        </div>
      );
    },
  },
  {
    accessorKey: "identification",
    header: "Cédula",
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {row.original.identification}
      </span>
    ),
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {row.original.email || "—"}
      </span>
    ),
  },
  {
    accessorKey: "phone",
    header: "Teléfono",
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {row.original.phone || "—"}
      </span>
    ),
  },
  {
    id: "actions",
    header: "Acciones",
    cell: ({ row }) => {
      const client = row.original;
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
            <DropdownMenuItem onClick={() => onView(client)}>
              <Eye className="mr-2 h-4 w-4" /> Ver detalle
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(client)}>
              <Pencil className="mr-2 h-4 w-4" /> Editar
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onDelete(client)}
              className="text-red-600"
            >
              <Trash2 className="mr-2 h-4 w-4" /> Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
