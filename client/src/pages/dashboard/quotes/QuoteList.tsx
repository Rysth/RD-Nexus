import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuoteStore, Quote, QuoteFilters } from "@/stores/quoteStore";
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
  Copy,
  Send,
  CheckCircle,
  XCircle,
  FileText,
  DollarSign,
  Clock,
  AlertCircle,
  X,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import toast from "react-hot-toast";
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
  draft: "bg-gray-500",
  sent: "bg-blue-500",
  approved: "bg-green-500",
  rejected: "bg-red-500",
};

const statusIcons: Record<string, React.ReactNode> = {
  draft: <FileText className="w-3 h-3" />,
  sent: <Send className="w-3 h-3" />,
  approved: <CheckCircle className="w-3 h-3" />,
  rejected: <XCircle className="w-3 h-3" />,
};

export default function QuoteList() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const perPage = 25;

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
    const filters: QuoteFilters = {};
    if (statusFilter) filters.status = statusFilter;
    if (clientFilter) filters.client_id = parseInt(clientFilter);
    fetchQuotes(page, perPage, filters);
  }, [fetchQuotes, searchParams, statusFilter, clientFilter]);

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
      // Toast is shown in the store
    } catch {
      // Toast is shown in the store
    } finally {
      setDeleteDialogOpen(false);
      setQuoteToDelete(null);
    }
  };

  const handleStatusUpdate = async (quote: Quote, newStatus: string) => {
    try {
      await updateQuoteStatus(quote.id, newStatus);
      // Toast is shown in the store
    } catch {
      // Toast is shown in the store
    }
  };

  const handleDuplicate = async (quote: Quote) => {
    try {
      const newQuote = await duplicateQuote(quote.id);
      navigate(`/dashboard/quotes/${newQuote.id}`);
    } catch {
      // Toast is shown in the store
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-EC", {
      style: "currency",
      currency: "USD",
    }).format(value);
  };

  // Stats
  const totalQuotes = quotesPagination.total;
  const draftQuotes = quotes.filter((q) => q.status === "draft").length;
  const sentQuotes = quotes.filter((q) => q.status === "sent").length;
  const approvedQuotes = quotes.filter((q) => q.status === "approved").length;
  const totalApprovedValue = quotes
    .filter((q) => q.status === "approved")
    .reduce((acc, q) => acc + q.total, 0);

  const hasFilters = statusFilter !== "" || clientFilter !== "";

  return (
    <div className="space-y-6">
      {/* Header */}

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <FileText className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalQuotes}</div>
            <p className="text-xs text-muted-foreground">cotizaciones</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Borradores</CardTitle>
            <Clock className="w-4 h-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{draftQuotes}</div>
            <p className="text-xs text-muted-foreground">pendientes</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Enviadas</CardTitle>
            <Send className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sentQuotes}</div>
            <p className="text-xs text-muted-foreground">esperando respuesta</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Aprobadas</CardTitle>
            <DollarSign className="w-4 h-4 text-green-500" />
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

      <Button onClick={() => navigate("/dashboard/quotes/new")}>
        <Plus className="w-4 h-4 mr-2" />
        Nueva Cotización
      </Button>

      {/* Table */}
      <Card className="p-0 rounded-xl">
        <CardContent className="p-0">
          {quotesLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-gray-300 rounded-full animate-spin border-t-gray-600" />
              <span className="ml-2">Cargando cotizaciones...</span>
            </div>
          ) : quotes.length === 0 ? (
            <div className="py-8 text-center">
              <FileText className="w-12 h-12 mx-auto text-muted-foreground" />
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
                <Plus className="w-4 h-4 mr-2" />
                Nueva Cotización
              </Button>
            </div>
          ) : (
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
                      <Button
                        variant="link"
                        className="p-0 h-auto font-mono text-sm"
                        onClick={() =>
                          navigate(`/dashboard/quotes/${quote.id}`)
                        }
                      >
                        {quote.quote_number}
                      </Button>
                    </TableCell>
                    <TableCell className="font-medium">{quote.title}</TableCell>
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
                          <AlertCircle className="w-4 h-4 text-red-500" />
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
                          <Button variant="ghost" className="w-8 h-8 p-0">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() =>
                              navigate(`/dashboard/quotes/${quote.id}`)
                            }
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Ver detalle
                          </DropdownMenuItem>
                          {quote.is_editable && (
                            <DropdownMenuItem
                              onClick={() =>
                                navigate(`/dashboard/quotes/${quote.id}/edit`)
                              }
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => handleDuplicate(quote)}
                          >
                            <Copy className="w-4 h-4 mr-2" />
                            Duplicar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />

                          {/* Status actions */}
                          {quote.status === "draft" && (
                            <DropdownMenuItem
                              onClick={() => handleStatusUpdate(quote, "sent")}
                            >
                              <Send className="w-4 h-4 mr-2" />
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
                                <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                                Marcar como Aprobada
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  handleStatusUpdate(quote, "rejected")
                                }
                              >
                                <XCircle className="w-4 h-4 mr-2 text-red-500" />
                                Marcar como Rechazada
                              </DropdownMenuItem>
                            </>
                          )}
                          {(quote.status === "sent" ||
                            quote.status === "rejected") && (
                            <DropdownMenuItem
                              onClick={() => handleStatusUpdate(quote, "draft")}
                            >
                              <FileText className="w-4 h-4 mr-2" />
                              Regresar a Borrador
                            </DropdownMenuItem>
                          )}

                          <DropdownMenuSeparator />
                          {quote.is_editable && (
                            <DropdownMenuItem
                              onClick={() => handleDelete(quote)}
                              className="text-red-600"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
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
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {quotesPagination.last_page > 1 && (
        <Pagination
          currentPage={quotesPagination.current_page - 1}
          pageCount={quotesPagination.last_page}
          perPage={quotesPagination.per_page}
          totalCount={quotesPagination.total}
          onPageChange={handlePageChange}
        />
      )}

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
