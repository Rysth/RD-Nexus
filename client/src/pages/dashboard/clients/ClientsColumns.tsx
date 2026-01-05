import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ColumnDef } from "@tanstack/react-table";
import {
  Eye,
  MessageCircle,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";
import { Client } from "../../../stores/clientStore";

interface ColumnsProps {
  onView: (client: Client) => void;
  onEdit: (client: Client) => void;
  onDelete: (client: Client) => void;
}

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

      const buildWhatsAppUrl = (phone: string) => {
        const digits = phone.replace(/\D/g, "");
        if (!digits) return null;
        return `https://wa.me/${digits}`;
      };

      const canWhatsApp = Boolean(
        client.phone && buildWhatsAppUrl(client.phone)
      );
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-8 h-8 p-0">
              <span className="sr-only">Abrir menú</span>
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onView(client)}>
              <Eye className="w-4 h-4 mr-2" /> Ver detalle
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(client)}>
              <Pencil className="w-4 h-4 mr-2" /> Editar
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={!canWhatsApp}
              onClick={() => {
                if (!client.phone) return;
                const url = buildWhatsAppUrl(client.phone);
                if (!url) return;
                window.open(url, "_blank", "noopener,noreferrer");
              }}
            >
              <MessageCircle className="w-4 h-4 mr-2" /> WhatsApp
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onDelete(client)}
              className="text-red-600"
            >
              <Trash2 className="w-4 h-4 mr-2" /> Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
