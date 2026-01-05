import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuoteStore } from "@/stores/quoteStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Copy,
  Send,
  CheckCircle,
  XCircle,
  FileText,
  MoreVertical,
  Building2,
  User,
  Calendar,
  Download,
  Eye,
  AlertCircle,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useReactToPrint } from "react-to-print";
import { useBusinessStore } from "@/stores/businessStore";
import QuotePrintTemplate from "@/components/quotes/QuotePrintTemplate";

const statusColors: Record<string, string> = {
  draft: "bg-gray-500",
  sent: "bg-blue-500",
  approved: "bg-green-500",
  rejected: "bg-red-500",
};

const statusIcons: Record<string, React.ReactNode> = {
  draft: <FileText className="h-4 w-4" />,
  sent: <Send className="h-4 w-4" />,
  approved: <CheckCircle className="h-4 w-4" />,
  rejected: <XCircle className="h-4 w-4" />,
};

export default function QuoteDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const printRef = useRef<HTMLDivElement>(null);

  const {
    currentQuote,
    quotesLoading,
    fetchQuote,
    deleteQuote,
    updateQuoteStatus,
    duplicateQuote,
    clearCurrentQuote,
  } = useQuoteStore();

  const { business, fetchBusiness } = useBusinessStore();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    if (id) {
      fetchQuote(parseInt(id));
      fetchBusiness();
    }
    return () => {
      clearCurrentQuote();
    };
  }, [id, fetchQuote, fetchBusiness, clearCurrentQuote]);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: currentQuote?.quote_number || "Cotizacion",
  });

  const handleDelete = async () => {
    if (!currentQuote) return;
    try {
      await deleteQuote(currentQuote.id);
      navigate("/dashboard/quotes");
    } catch {
      // Toast is shown in the store
    } finally {
      setDeleteDialogOpen(false);
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    if (!currentQuote) return;
    try {
      await updateQuoteStatus(currentQuote.id, newStatus);
      // Toast is shown in the store
    } catch {
      // Toast is shown in the store
    }
  };

  const handleDuplicate = async () => {
    if (!currentQuote) return;
    try {
      const newQuote = await duplicateQuote(currentQuote.id);
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

  if (quotesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!currentQuote) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Cotización no encontrada</p>
        <Button variant="link" onClick={() => navigate("/dashboard/quotes")}>
          Volver a cotizaciones
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/dashboard/quotes")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-3xl font-bold tracking-tight">
                {currentQuote.quote_number}
              </h2>
              <Badge
                className={`${statusColors[currentQuote.status]} text-white`}
              >
                <span className="mr-1">{statusIcons[currentQuote.status]}</span>
                {currentQuote.status_label}
              </Badge>
              {currentQuote.is_expired && (
                <Badge variant="destructive">
                  <AlertCircle className="mr-1 h-3 w-3" />
                  Expirada
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground">{currentQuote.title}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setPreviewOpen(true)}>
            <Eye className="mr-2 h-4 w-4" />
            Vista Previa
          </Button>
          <Button onClick={() => handlePrint()}>
            <Download className="mr-2 h-4 w-4" />
            Descargar PDF
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {currentQuote.is_editable && (
                <DropdownMenuItem
                  onClick={() =>
                    navigate(`/dashboard/quotes/${currentQuote.id}/edit`)
                  }
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Editar
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={handleDuplicate}>
                <Copy className="mr-2 h-4 w-4" />
                Duplicar
              </DropdownMenuItem>
              <DropdownMenuSeparator />

              {/* Status actions */}
              {currentQuote.status === "draft" && (
                <DropdownMenuItem onClick={() => handleStatusUpdate("sent")}>
                  <Send className="mr-2 h-4 w-4" />
                  Marcar como Enviada
                </DropdownMenuItem>
              )}
              {currentQuote.status === "sent" && (
                <>
                  <DropdownMenuItem
                    onClick={() => handleStatusUpdate("approved")}
                  >
                    <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                    Marcar como Aprobada
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleStatusUpdate("rejected")}
                  >
                    <XCircle className="mr-2 h-4 w-4 text-red-500" />
                    Marcar como Rechazada
                  </DropdownMenuItem>
                </>
              )}
              {(currentQuote.status === "sent" ||
                currentQuote.status === "rejected") && (
                <DropdownMenuItem onClick={() => handleStatusUpdate("draft")}>
                  <FileText className="mr-2 h-4 w-4" />
                  Regresar a Borrador
                </DropdownMenuItem>
              )}

              {currentQuote.is_editable && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setDeleteDialogOpen(true)}
                    className="text-red-600"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Eliminar
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Info Cards - Visible in app */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Client Info */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <User className="h-4 w-4" />
              Cliente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-semibold">{currentQuote.client?.name}</div>
            {currentQuote.client?.email && (
              <div className="text-sm text-muted-foreground">
                {currentQuote.client.email}
              </div>
            )}
            {currentQuote.client?.phone && (
              <div className="text-sm text-muted-foreground">
                {currentQuote.client.phone}
              </div>
            )}
            <Button
              variant="link"
              className="p-0 h-auto mt-2"
              onClick={() =>
                navigate(`/dashboard/clients/${currentQuote.client_id}`)
              }
            >
              Ver cliente →
            </Button>
          </CardContent>
        </Card>

        {/* Project Info (if linked) */}
        {currentQuote.project && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Proyecto
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="font-semibold">{currentQuote.project.name}</div>
              <Badge variant="outline" className="mt-1">
                {currentQuote.project.status_label}
              </Badge>
              <Button
                variant="link"
                className="p-0 h-auto mt-2 block"
                onClick={() =>
                  navigate(`/dashboard/projects/${currentQuote.project_id}`)
                }
              >
                Ver proyecto →
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Dates */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Fechas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Emitida:</span>
              <span className="font-medium">
                {format(new Date(currentQuote.issue_date), "dd MMM yyyy", {
                  locale: es,
                })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Válida hasta:</span>
              <span
                className={`font-medium ${
                  currentQuote.is_expired ? "text-red-500" : ""
                }`}
              >
                {format(new Date(currentQuote.valid_until), "dd MMM yyyy", {
                  locale: es,
                })}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Items Table */}
      <Card>
        <CardHeader>
          <CardTitle>Elementos de la Cotización</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50%]">Descripción</TableHead>
                <TableHead className="text-right">Cantidad</TableHead>
                <TableHead className="text-right">Precio Unitario</TableHead>
                <TableHead className="text-right">Subtotal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentQuote.items?.map((item, index) => (
                <TableRow key={item.id || index}>
                  <TableCell>{item.description}</TableCell>
                  <TableCell className="text-right">{item.quantity}</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(item.unit_price)}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(item.subtotal)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Totals */}
          <div className="flex justify-end mt-6">
            <div className="w-72 space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal:</span>
                <span className="font-medium">
                  {formatCurrency(currentQuote.subtotal)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  IVA ({currentQuote.tax_rate}%):
                </span>
                <span className="font-medium">
                  {formatCurrency(currentQuote.tax_amount)}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between text-lg">
                <span className="font-semibold">Total:</span>
                <span className="font-bold text-primary">
                  {formatCurrency(currentQuote.total)}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      {currentQuote.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Notas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{currentQuote.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Terms and Conditions */}
      {currentQuote.terms_conditions && (
        <Card>
          <CardHeader>
            <CardTitle>Términos y Condiciones</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">
              {currentQuote.terms_conditions}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Hidden Print Template */}
      <div className="hidden">
        <QuotePrintTemplate
          ref={printRef}
          quote={currentQuote}
          business={business}
        />
      </div>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-5xl w-full max-h-[90vh] flex flex-col p-0 gap-0 bg-gray-100/95 backdrop-blur-sm">
          <DialogHeader className="p-4 border-b bg-white">
            <DialogTitle>Vista Previa de Cotización</DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-6 flex justify-center">
            <div className="bg-white shadow-2xl rounded-sm max-w-[210mm] w-full min-h-[297mm] mx-auto overflow-hidden">
              <QuotePrintTemplate quote={currentQuote} business={business} />
            </div>
          </div>

          <div className="p-4 border-t bg-white flex justify-end gap-2">
            <Button variant="outline" onClick={() => setPreviewOpen(false)}>
              Cerrar
            </Button>
            <Button
              onClick={() => {
                setPreviewOpen(false);
                handlePrint();
              }}
            >
              <Download className="mr-2 h-4 w-4" />
              Descargar PDF
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar cotización?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente la
              cotización "{currentQuote.quote_number}" y todos sus elementos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
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
