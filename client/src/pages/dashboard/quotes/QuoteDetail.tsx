import { useEffect, useState, useRef } from "react";
import type { ReactNode } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuoteStore } from "@/stores/quoteStore";
import { useInvoiceStore } from "@/stores/invoiceStore";
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
  MessageCircle,
  Receipt,
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

const statusIcons: Record<string, ReactNode> = {
  draft: <FileText className="w-4 h-4" />,
  sent: <Send className="w-4 h-4" />,
  approved: <CheckCircle className="w-4 h-4" />,
  rejected: <XCircle className="w-4 h-4" />,
};

export default function QuoteDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const printRef = useRef<HTMLDivElement>(null);

  const buildWhatsAppUrl = (phone: string, text?: string) => {
    const digits = phone.replace(/\D/g, "");
    if (!digits) return null;
    const base = `https://wa.me/${digits}`;
    if (!text) return base;
    return `${base}?text=${encodeURIComponent(text)}`;
  };

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

  const { convertFromQuote, invoicesLoading } = useInvoiceStore();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [convertDialogOpen, setConvertDialogOpen] = useState(false);

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

  const handleConvertToInvoice = async () => {
    if (!currentQuote) return;
    try {
      const invoice = await convertFromQuote(currentQuote.id);
      navigate(`/dashboard/invoices/${invoice.id}`);
    } catch {
      // Toast is shown in the store
    } finally {
      setConvertDialogOpen(false);
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
        <div className="w-8 h-8 border-b-2 rounded-full animate-spin border-primary"></div>
      </div>
    );
  }

  if (!currentQuote) {
    return (
      <div className="py-8 text-center">
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
            <ArrowLeft className="w-5 h-5" />
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
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Expirada
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground">{currentQuote.title}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => {
              const phone = currentQuote.client?.phone;
              if (!phone) return;
              const formattedValidUntil = (() => {
                try {
                  return format(
                    new Date(currentQuote.valid_until),
                    "dd MMM yyyy",
                    {
                      locale: es,
                    },
                  );
                } catch {
                  return currentQuote.valid_until;
                }
              })();

              const businessName = "\n\nDe parte de Nexus by RysthDesign";
              const text =
                `Saludos${
                  currentQuote.client?.name
                    ? ` ${currentQuote.client.name}`
                    : ""
                }, ` +
                `te comparto la cotización ${currentQuote.quote_number} (${currentQuote.title}).\n` +
                `Total: ${formatCurrency(currentQuote.total)}\n` +
                `Válida hasta: ${formattedValidUntil}` +
                businessName;

              const url = buildWhatsAppUrl(phone, text);
              if (!url) return;
              window.open(url, "_blank", "noopener,noreferrer");
            }}
            disabled={!currentQuote.client?.phone}
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            WhatsApp
          </Button>
          <Button variant="outline" onClick={() => setPreviewOpen(true)}>
            <Eye className="w-4 h-4 mr-2" />
            Vista Previa
          </Button>
          <Button onClick={() => handlePrint()}>
            <Download className="w-4 h-4 mr-2" />
            Descargar PDF
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {currentQuote.is_editable && !currentQuote.is_expired && (
                <DropdownMenuItem
                  onClick={() =>
                    navigate(`/dashboard/quotes/${currentQuote.id}/edit`)
                  }
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Editar
                </DropdownMenuItem>
              )}
              {!currentQuote.is_expired && (
                <DropdownMenuItem onClick={handleDuplicate}>
                  <Copy className="w-4 h-4 mr-2" />
                  Duplicar
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />

              {/* Status actions - disabled if expired */}
              {!currentQuote.is_expired && (
                <>
                  {currentQuote.status === "draft" && (
                    <DropdownMenuItem
                      onClick={() => handleStatusUpdate("sent")}
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Marcar como Enviada
                    </DropdownMenuItem>
                  )}
                  {currentQuote.status === "sent" && (
                    <>
                      <DropdownMenuItem
                        onClick={() => handleStatusUpdate("approved")}
                      >
                        <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                        Marcar como Aprobada
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleStatusUpdate("rejected")}
                      >
                        <XCircle className="w-4 h-4 mr-2 text-red-500" />
                        Marcar como Rechazada
                      </DropdownMenuItem>
                    </>
                  )}
                  {(currentQuote.status === "sent" ||
                    currentQuote.status === "rejected") && (
                    <DropdownMenuItem
                      onClick={() => handleStatusUpdate("draft")}
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Regresar a Borrador
                    </DropdownMenuItem>
                  )}
                </>
              )}

              {/* Convert to Invoice - only for approved quotes */}
              {currentQuote.status === "approved" && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setConvertDialogOpen(true)}
                    className="text-green-600"
                  >
                    <Receipt className="w-4 h-4 mr-2" />
                    Convertir a Comprobante
                  </DropdownMenuItem>
                </>
              )}

              {currentQuote.is_editable && !currentQuote.is_expired && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setDeleteDialogOpen(true)}
                    className="text-red-600"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
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
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <User className="w-4 h-4" />
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
              className="h-auto p-0 mt-2"
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
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <Building2 className="w-4 h-4" />
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
                className="block h-auto p-0 mt-2"
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
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Calendar className="w-4 h-4" />
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
          <div className="space-y-4">
            {currentQuote.items?.map((item, index) => (
              <div
                key={item.id || index}
                className="p-4 border rounded-lg space-y-3"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="font-medium">{item.description}</p>
                    {item.notes && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {item.notes}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-6 text-sm">
                    <div className="text-center">
                      <p className="text-muted-foreground text-xs">Cantidad</p>
                      <p className="font-medium">{item.quantity}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-muted-foreground text-xs">
                        P. Unitario
                      </p>
                      <p className="font-medium">
                        {formatCurrency(item.unit_price)}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-muted-foreground text-xs">Desc. %</p>
                      <p className="font-medium">
                        {(item.discount_percent ?? 0) > 0
                          ? `${item.discount_percent}%`
                          : "-"}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-muted-foreground text-xs">Tipo</p>
                      <p className="font-medium capitalize">
                        {item.payment_type === "mensual"
                          ? "Mensual"
                          : item.payment_type === "anual"
                            ? "Anual"
                            : "Único"}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-muted-foreground text-xs">Subtotal</p>
                      <p className="font-semibold">
                        {formatCurrency(item.subtotal)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="flex justify-end mt-6">
            <div className="space-y-2 w-72">
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
          <DialogHeader className="p-4 bg-white border-b">
            <DialogTitle>Vista Previa de Cotización</DialogTitle>
          </DialogHeader>

          <div className="flex justify-center flex-1 p-6 overflow-y-auto">
            <div className="bg-white shadow-2xl rounded-sm max-w-[210mm] w-full min-h-[297mm] mx-auto overflow-hidden">
              <QuotePrintTemplate quote={currentQuote} business={business} />
            </div>
          </div>

          <div className="flex justify-end gap-2 p-4 bg-white border-t">
            <Button variant="outline" onClick={() => setPreviewOpen(false)}>
              Cerrar
            </Button>
            <Button
              onClick={() => {
                setPreviewOpen(false);
                handlePrint();
              }}
            >
              <Download className="w-4 h-4 mr-2" />
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

      {/* Convert to Invoice Dialog */}
      <AlertDialog open={convertDialogOpen} onOpenChange={setConvertDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Convertir a comprobante?</AlertDialogTitle>
            <AlertDialogDescription>
              Se creará un comprobante de servicio a partir de la cotización "
              {currentQuote.quote_number}". El comprobante incluirá todos los
              elementos y montos de esta cotización. El vencimiento será de 30
              días a partir de hoy.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConvertToInvoice}
              disabled={invoicesLoading}
              className="bg-green-600 hover:bg-green-700"
            >
              {invoicesLoading ? "Convirtiendo..." : "Crear Comprobante"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
