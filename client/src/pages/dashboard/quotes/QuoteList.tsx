import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuoteStore, Quote } from "@/stores/quoteStore";
import { useClientStore } from "@/stores/clientStore";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  Copy,
  Send,
  CheckCircle,
  XCircle,
  FileText,
  DollarSign,
  Clock,
  AlertCircle,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
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
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

const statusColors: Record<string, string> = {
  draft: "bg-gray-500",
  sent: "bg-blue-500",
  approved: "bg-green-500",
  rejected: "bg-red-500",
};

const statusIcons: Record<string, React.ReactNode> = {
  draft: <FileText className="h-3 w-3" />,
  sent: <Send className="h-3 w-3" />,
  approved: <CheckCircle className="h-3 w-3" />,
  rejected: <XCircle className="h-3 w-3" />,
};

export default function QuoteList() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const {
    quotes,
    quotesLoading,
    quotesPagination,
    fetchQuotes,
    deleteQuote,
    updateQuoteStatus,
    duplicateQuote,
  } = useQuoteStore();

  const { clients, fetchClients } = useClientStore();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [quoteToDelete, setQuoteToDelete] = useState<Quote | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>(
    searchParams.get("status") || ""
  );
  const [clientFilter, setClientFilter] = useState<string>(
    searchParams.get("client_id") || ""
  );

  useEffect(() => {
    const page = parseInt(searchParams.get("page") || "1");
    const filters: any = {};
    if (statusFilter) filters.status = statusFilter;
    if (clientFilter) filters.client_id = parseInt(clientFilter);
    fetchQuotes(page, 25, filters);
  }, [fetchQuotes, searchParams, statusFilter, clientFilter]);

  useEffect(() => {
    fetchClients(1, 100); // Load clients for filter
  }, [fetchClients]);

  const handlePageChange = (page: number) => {
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

  const handleDelete = (quote: Quote) => {
    if (!quote.is_editable) {
      toast.error("Solo se pueden eliminar cotizaciones en borrador");
      return;
    }
    setQuoteToDelete(quote);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!quoteToDelete) return;
    try {
      await deleteQuote(quoteToDelete.id);
      toast.success("Cotización eliminada exitosamente");
    } catch {
      toast.error("Error al eliminar cotización");
    } finally {
      setDeleteDialogOpen(false);
      setQuoteToDelete(null);
    }
  };

  const handleStatusUpdate = async (quote: Quote, newStatus: string) => {
    try {
      const updated = await updateQuoteStatus(quote.id, newStatus);
      toast.success(`Estado cambiado a ${updated.status_label}`);
      // Refetch to update the list
      const page = parseInt(searchParams.get("page") || "1");
      const filters: any = {};
      if (statusFilter) filters.status = statusFilter;
      if (clientFilter) filters.client_id = parseInt(clientFilter);
      fetchQuotes(page, 25, filters);
    } catch {
      toast.error("Error al cambiar estado");
    }
  };

  const handleDuplicate = async (quote: Quote) => {
    try {
      const newQuote = await duplicateQuote(quote.id);
      toast.success("Cotización duplicada exitosamente");
      navigate(`/dashboard/quotes/${newQuote.id}`);
    } catch {
      toast.error("Error al duplicar cotización");
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-EC", {
      style: "currency",
      currency: "USD",
    }).format(value);
  };

  // Stats
  const totalQuotes = quotes.length;
  const draftQuotes = quotes.filter((q) => q.status === "draft").length;
  const sentQuotes = quotes.filter((q) => q.status === "sent").length;
  const approvedQuotes = quotes.filter((q) => q.status === "approved").length;
  const totalApprovedValue = quotes
    .filter((q) => q.status === "approved")
    .reduce((acc, q) => acc + q.total, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Cotizaciones</h2>
          <p className="text-muted-foreground">
            Gestiona las cotizaciones para tus clientes
          </p>
        </div>
        <Button onClick={() => navigate("/dashboard/quotes/new")}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Cotización
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalQuotes}</div>
            <p className="text-xs text-muted-foreground">cotizaciones</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Borradores</CardTitle>
            <Clock className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{draftQuotes}</div>
            <p className="text-xs text-muted-foreground">pendientes</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Enviadas</CardTitle>
            <Send className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sentQuotes}</div>
            <p className="text-xs text-muted-foreground">esperando respuesta</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aprobadas</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{approvedQuotes}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(totalApprovedValue)} total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4">
          <Select
            value={statusFilter || "all"}
            onValueChange={handleStatusChange}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              <SelectItem value="draft">Borrador</SelectItem>
              <SelectItem value="sent">Enviada</SelectItem>
              <SelectItem value="approved">Aprobada</SelectItem>
              <SelectItem value="rejected">Rechazada</SelectItem>
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
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Cotizaciones</CardTitle>
          <CardDescription>
            {quotesPagination.total} cotizaciones encontradas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {quotesLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : quotes.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-semibold">
                No hay cotizaciones
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Crea tu primera cotización para comenzar
              </p>
              <Button
                className="mt-4"
                onClick={() => navigate("/dashboard/quotes/new")}
              >
                <Plus className="mr-2 h-4 w-4" />
                Nueva Cotización
              </Button>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número</TableHead>
                    <TableHead>Título</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Válida Hasta</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {quotes.map((quote) => (
                    <TableRow key={quote.id}>
                      <TableCell className="font-mono text-sm">
                        {quote.quote_number}
                      </TableCell>
                      <TableCell className="font-medium">
                        {quote.title}
                      </TableCell>
                      <TableCell>{quote.client?.name || "-"}</TableCell>
                      <TableCell>
                        {format(new Date(quote.issue_date), "dd MMM yyyy", {
                          locale: es,
                        })}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {format(new Date(quote.valid_until), "dd MMM yyyy", {
                            locale: es,
                          })}
                          {quote.is_expired && (
                            <AlertCircle className="h-4 w-4 text-red-500" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold">
                        {formatCurrency(quote.total)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={`${statusColors[quote.status]} text-white`}
                        >
                          <span className="mr-1">
                            {statusIcons[quote.status]}
                          </span>
                          {quote.status_label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() =>
                                navigate(`/dashboard/quotes/${quote.id}`)
                              }
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              Ver detalle
                            </DropdownMenuItem>
                            {quote.is_editable && (
                              <DropdownMenuItem
                                onClick={() =>
                                  navigate(`/dashboard/quotes/${quote.id}/edit`)
                                }
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Editar
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() => handleDuplicate(quote)}
                            >
                              <Copy className="mr-2 h-4 w-4" />
                              Duplicar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />

                            {/* Status actions */}
                            {quote.status === "draft" && (
                              <DropdownMenuItem
                                onClick={() =>
                                  handleStatusUpdate(quote, "sent")
                                }
                              >
                                <Send className="mr-2 h-4 w-4" />
                                Marcar como Enviada
                              </DropdownMenuItem>
                            )}
                            {quote.status === "sent" && (
                              <>
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleStatusUpdate(quote, "approved")
                                  }
                                >
                                  <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                                  Marcar como Aprobada
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleStatusUpdate(quote, "rejected")
                                  }
                                >
                                  <XCircle className="mr-2 h-4 w-4 text-red-500" />
                                  Marcar como Rechazada
                                </DropdownMenuItem>
                              </>
                            )}
                            {(quote.status === "sent" ||
                              quote.status === "rejected") && (
                              <DropdownMenuItem
                                onClick={() =>
                                  handleStatusUpdate(quote, "draft")
                                }
                              >
                                <FileText className="mr-2 h-4 w-4" />
                                Regresar a Borrador
                              </DropdownMenuItem>
                            )}

                            <DropdownMenuSeparator />
                            {quote.is_editable && (
                              <DropdownMenuItem
                                onClick={() => handleDelete(quote)}
                                className="text-red-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Eliminar
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {quotesPagination.last_page > 1 && (
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Mostrando{" "}
                    {(quotesPagination.current_page - 1) *
                      quotesPagination.per_page +
                      1}{" "}
                    a{" "}
                    {Math.min(
                      quotesPagination.current_page * quotesPagination.per_page,
                      quotesPagination.total
                    )}{" "}
                    de {quotesPagination.total} resultados
                  </p>
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() =>
                            handlePageChange(quotesPagination.current_page - 1)
                          }
                          className={
                            quotesPagination.current_page === 1
                              ? "pointer-events-none opacity-50"
                              : "cursor-pointer"
                          }
                        />
                      </PaginationItem>
                      {Array.from(
                        { length: Math.min(5, quotesPagination.last_page) },
                        (_, i) => {
                          const page = i + 1;
                          return (
                            <PaginationItem key={page}>
                              <PaginationLink
                                onClick={() => handlePageChange(page)}
                                isActive={
                                  quotesPagination.current_page === page
                                }
                                className="cursor-pointer"
                              >
                                {page}
                              </PaginationLink>
                            </PaginationItem>
                          );
                        }
                      )}
                      <PaginationItem>
                        <PaginationNext
                          onClick={() =>
                            handlePageChange(quotesPagination.current_page + 1)
                          }
                          className={
                            quotesPagination.current_page ===
                            quotesPagination.last_page
                              ? "pointer-events-none opacity-50"
                              : "cursor-pointer"
                          }
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar cotización?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente la
              cotización "{quoteToDelete?.quote_number}" y todos sus elementos.
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
    </div>
  );
}
