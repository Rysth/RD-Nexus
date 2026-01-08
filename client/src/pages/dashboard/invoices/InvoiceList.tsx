import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  useInvoiceStore,
  Invoice,
  InvoiceFilters,
} from "@/stores/invoiceStore";
import { useClientStore } from "@/stores/clientStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  FileText,
  DollarSign,
  Clock,
  AlertCircle,
  X,
  CheckCircle,
  XCircle,
  Ban,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import Pagination from "@/components/common/Pagination";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500",
  paid: "bg-green-500",
  overdue: "bg-red-500",
  voided: "bg-gray-500",
};

const statusIcons: Record<string, React.ReactNode> = {
  pending: <Clock className="w-3 h-3" />,
  paid: <CheckCircle className="w-3 h-3" />,
  overdue: <AlertCircle className="w-3 h-3" />,
  voided: <Ban className="w-3 h-3" />,
};

export default function InvoiceList() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const perPage = 25;

  const {
    invoices,
    invoicesLoading,
    invoicesPagination,
    invoiceStats,
    fetchInvoices,
    fetchInvoiceStats,
    deleteInvoice,
    voidInvoice,
  } = useInvoiceStore();

  const { clients, fetchClients } = useClientStore();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [voidDialogOpen, setVoidDialogOpen] = useState(false);
  const [invoiceToAction, setInvoiceToAction] = useState<Invoice | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>(
    searchParams.get("status") || ""
  );
  const [clientFilter, setClientFilter] = useState<string>(
    searchParams.get("client_id") || ""
  );

  useEffect(() => {
    const page = parseInt(searchParams.get("page") || "1");
    const filters: InvoiceFilters = {};
    if (statusFilter) filters.status = statusFilter;
    if (clientFilter) filters.client_id = parseInt(clientFilter);
    fetchInvoices(page, perPage, filters);
    fetchInvoiceStats();
  }, [
    fetchInvoices,
    fetchInvoiceStats,
    searchParams,
    statusFilter,
    clientFilter,
  ]);

  useEffect(() => {
    fetchClients(1, 100);
  }, [fetchClients]);

  const handlePageChange = (selectedItem: { selected: number }) => {
    const page = selectedItem.selected + 1;
    const newParams = new URLSearchParams(searchParams);
    newParams.set("page", String(page));
    setSearchParams(newParams);
  };

  const handleStatusChange = (value: string) => {
    setStatusFilter(value === "all" ? "" : value);
    const newParams = new URLSearchParams(searchParams);
    if (value && value !== "all") {
      newParams.set("status", value);
    } else {
      newParams.delete("status");
    }
    newParams.set("page", "1");
    setSearchParams(newParams);
  };

  const handleClientChange = (value: string) => {
    setClientFilter(value === "all" ? "" : value);
    const newParams = new URLSearchParams(searchParams);
    if (value && value !== "all") {
      newParams.set("client_id", value);
    } else {
      newParams.delete("client_id");
    }
    newParams.set("page", "1");
    setSearchParams(newParams);
  };

  const handleClearFilters = () => {
    setStatusFilter("");
    setClientFilter("");
    const newParams = new URLSearchParams();
    newParams.set("page", "1");
    setSearchParams(newParams);
  };

  const handleDelete = (invoice: Invoice) => {
    if (!invoice.is_editable) {
      return;
    }
    setInvoiceToAction(invoice);
    setDeleteDialogOpen(true);
  };

  const handleVoid = (invoice: Invoice) => {
    if (invoice.status === "paid" || invoice.status === "voided") {
      return;
    }
    setInvoiceToAction(invoice);
    setVoidDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!invoiceToAction) return;
    try {
      await deleteInvoice(invoiceToAction.id);
    } catch {
      // Toast is shown in the store
    } finally {
      setDeleteDialogOpen(false);
      setInvoiceToAction(null);
    }
  };

  const confirmVoid = async () => {
    if (!invoiceToAction) return;
    try {
      await voidInvoice(invoiceToAction.id);
    } catch {
      // Toast is shown in the store
    } finally {
      setVoidDialogOpen(false);
      setInvoiceToAction(null);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-EC", {
      style: "currency",
      currency: "USD",
    }).format(value);
  };

  const hasFilters = statusFilter !== "" || clientFilter !== "";

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
            <Clock className="w-4 h-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {invoiceStats?.pending_count || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(invoiceStats?.pending_total || 0)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Pagadas</CardTitle>
            <CheckCircle className="w-4 h-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {invoiceStats?.paid_count || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(invoiceStats?.paid_total || 0)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Vencidas</CardTitle>
            <AlertCircle className="w-4 h-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {invoiceStats?.overdue_count || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(invoiceStats?.overdue_total || 0)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">
              Total Ingresos
            </CardTitle>
            <DollarSign className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {formatCurrency(invoiceStats?.paid_total || 0)}
            </div>
            <p className="text-xs text-muted-foreground">cobros registrados</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={statusFilter || "all"}
          onValueChange={handleStatusChange}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="pending">Pendiente</SelectItem>
            <SelectItem value="paid">Pagada</SelectItem>
            <SelectItem value="overdue">Vencida</SelectItem>
            <SelectItem value="voided">Anulada</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={clientFilter || "all"}
          onValueChange={handleClientChange}
        >
          <SelectTrigger className="w-[250px]">
            <SelectValue placeholder="Cliente" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los clientes</SelectItem>
            {clients.map((client) => (
              <SelectItem key={client.id} value={String(client.id)}>
                {client.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
            className="h-8 px-2 lg:px-3"
          >
            <X className="w-4 h-4 mr-2" />
            Limpiar filtros
          </Button>
        )}
      </div>

      <Button onClick={() => navigate("/dashboard/invoices/new")}>
        <Plus className="w-4 h-4 mr-2" />
        Nueva Cuenta de Cobro
      </Button>

      {/* Table */}
      <Card className="p-0 rounded-xl">
        <CardContent className="p-0">
          {invoicesLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-gray-300 rounded-full animate-spin border-t-gray-600" />
              <span className="ml-2">Cargando cuentas de cobro...</span>
            </div>
          ) : invoices.length === 0 ? (
            <div className="py-8 text-center">
              <FileText className="w-12 h-12 mx-auto text-muted-foreground" />
              <h3 className="mt-2 text-sm font-semibold">
                No hay cuentas de cobro
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Crea tu primera cuenta de cobro o convierte una cotización
              </p>
              <Button
                className="mt-4"
                onClick={() => navigate("/dashboard/invoices/new")}
              >
                <Plus className="w-4 h-4 mr-2" />
                Nueva Cuenta de Cobro
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Origen</TableHead>
                  <TableHead>Emisión</TableHead>
                  <TableHead>Vencimiento</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-mono text-sm">
                      <Button
                        variant="link"
                        className="p-0 h-auto font-mono text-sm"
                        onClick={() =>
                          navigate(`/dashboard/invoices/${invoice.id}`)
                        }
                      >
                        {invoice.invoice_number}
                      </Button>
                    </TableCell>
                    <TableCell>{invoice.client?.name || "-"}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {invoice.source_label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {format(new Date(invoice.issue_date), "dd MMM yyyy", {
                        locale: es,
                      })}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {format(new Date(invoice.due_date), "dd MMM yyyy", {
                          locale: es,
                        })}
                        {invoice.is_overdue && invoice.status === "pending" && (
                          <AlertCircle className="w-4 h-4 text-red-500" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold">
                      {formatCurrency(invoice.total)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={`${statusColors[invoice.status]} text-white`}
                      >
                        <span className="mr-1">
                          {statusIcons[invoice.status]}
                        </span>
                        {invoice.status_label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="w-8 h-8 p-0">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() =>
                              navigate(`/dashboard/invoices/${invoice.id}`)
                            }
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Ver detalle
                          </DropdownMenuItem>
                          {invoice.is_editable && (
                            <DropdownMenuItem
                              onClick={() =>
                                navigate(
                                  `/dashboard/invoices/${invoice.id}/edit`
                                )
                              }
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />

                          {invoice.status === "pending" && (
                            <DropdownMenuItem
                              onClick={() =>
                                navigate(
                                  `/dashboard/invoices/${invoice.id}?action=pay`
                                )
                              }
                            >
                              <DollarSign className="w-4 h-4 mr-2 text-green-500" />
                              Registrar Pago
                            </DropdownMenuItem>
                          )}

                          {invoice.status !== "paid" &&
                            invoice.status !== "voided" && (
                              <DropdownMenuItem
                                onClick={() => handleVoid(invoice)}
                                className="text-orange-600"
                              >
                                <XCircle className="w-4 h-4 mr-2" />
                                Anular
                              </DropdownMenuItem>
                            )}

                          {invoice.is_editable && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleDelete(invoice)}
                                className="text-red-600"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Eliminar
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {invoicesPagination.last_page > 1 && (
        <Pagination
          currentPage={invoicesPagination.current_page - 1}
          pageCount={invoicesPagination.last_page}
          perPage={invoicesPagination.per_page}
          totalCount={invoicesPagination.total}
          onPageChange={handlePageChange}
        />
      )}

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar cuenta de cobro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente la
              cuenta de cobro "{invoiceToAction?.invoice_number}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Void Dialog */}
      <AlertDialog open={voidDialogOpen} onOpenChange={setVoidDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Anular cuenta de cobro?</AlertDialogTitle>
            <AlertDialogDescription>
              La cuenta de cobro "{invoiceToAction?.invoice_number}" será
              marcada como anulada. Esta acción no elimina la cuenta de cobro,
              solo cambia su estado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmVoid}
              className="bg-orange-600 hover:bg-orange-700"
            >
              Anular
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
