import { useEffect, useState, useRef } from "react";
import type { ReactNode } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  useInvoiceStore,
  type Invoice,
  type InvoicePayment,
} from "@/stores/invoiceStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
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
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Edit,
  Trash2,
  MoreVertical,
  Building2,
  User,
  Calendar,
  Download,
  Eye,
  AlertCircle,
  MessageCircle,
  CheckCircle,
  Clock,
  Ban,
  DollarSign,
  XCircle,
  Link as LinkIcon,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useReactToPrint } from "react-to-print";
import { useBusinessStore } from "@/stores/businessStore";
import InvoicePrintTemplate from "@/components/invoices/InvoicePrintTemplate";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500",
  partial: "bg-blue-500",
  paid: "bg-green-500",
  overdue: "bg-red-500",
  voided: "bg-gray-500",
};

const statusIcons: Record<string, ReactNode> = {
  pending: <Clock className="h-4 w-4" />,
  partial: <DollarSign className="h-4 w-4" />,
  paid: <CheckCircle className="h-4 w-4" />,
  overdue: <AlertCircle className="h-4 w-4" />,
  voided: <Ban className="h-4 w-4" />,
};

export default function InvoiceDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const printRef = useRef<HTMLDivElement>(null);

  const buildWhatsAppUrl = (phone: string, text?: string) => {
    const digits = phone.replace(/\D/g, "");
    if (!digits) return null;
    const base = `https://wa.me/${digits}`;
    if (!text) return base;
    return `${base}?text=${encodeURIComponent(text)}`;
  };

  const {
    currentInvoice,
    invoicesLoading,
    fetchInvoice,
    deleteInvoice,
    registerPayment,
    deletePayment,
    voidInvoice,
    clearCurrentInvoice,
  } = useInvoiceStore();

  const { business, fetchBusiness } = useBusinessStore();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [voidDialogOpen, setVoidDialogOpen] = useState(false);
  const [payDialogOpen, setPayDialogOpen] = useState(false);
  const [deletePaymentDialogOpen, setDeletePaymentDialogOpen] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState<InvoicePayment | null>(
    null,
  );
  const [previewOpen, setPreviewOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<
    "transfer" | "cash" | "card" | "other"
  >("transfer");
  const [paymentNotes, setPaymentNotes] = useState("");

  const getBalanceDueForPayment = (invoice?: Invoice | null) => {
    if (!invoice) return 0;
    const balance = Number(invoice.balance_due);
    if (balance > 0) return balance;
    const fallback = Number(invoice.total) - Number(invoice.total_paid || 0);
    return Math.max(0, fallback);
  };

  useEffect(() => {
    if (id) {
      fetchInvoice(parseInt(id));
      fetchBusiness();
    }
    return () => {
      clearCurrentInvoice();
    };
  }, [id, fetchInvoice, fetchBusiness, clearCurrentInvoice]);

  // Open pay dialog if action=pay in URL
  useEffect(() => {
    if (
      searchParams.get("action") === "pay" &&
      (currentInvoice?.can_accept_payments ??
        ["pending", "partial", "overdue"].includes(
          currentInvoice?.status || "",
        ))
    ) {
      const balance = getBalanceDueForPayment(currentInvoice);
      setPaymentAmount(String(balance || currentInvoice?.total || 0));
      setPayDialogOpen(true);
    }
  }, [searchParams, currentInvoice]);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: currentInvoice?.invoice_number || "Comprobante",
  });

  const handleDelete = async () => {
    if (!currentInvoice) return;
    try {
      await deleteInvoice(currentInvoice.id);
      navigate("/dashboard/invoices");
    } catch {
      // Toast is shown in the store
    } finally {
      setDeleteDialogOpen(false);
    }
  };

  const handleVoid = async () => {
    if (!currentInvoice) return;
    try {
      await voidInvoice(currentInvoice.id);
    } catch {
      // Toast is shown in the store
    } finally {
      setVoidDialogOpen(false);
    }
  };

  const handleRegisterPayment = async () => {
    if (!currentInvoice) return;
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) return;

    try {
      await registerPayment(currentInvoice.id, {
        amount,
        payment_method: paymentMethod,
        notes: paymentNotes || undefined,
      });
      setPayDialogOpen(false);
      setPaymentAmount("");
      setPaymentNotes("");
    } catch {
      // Toast is shown in the store
    }
  };

  const handleDeletePayment = async () => {
    if (!currentInvoice || !paymentToDelete) return;
    try {
      await deletePayment(currentInvoice.id, paymentToDelete.id);
      setDeletePaymentDialogOpen(false);
      setPaymentToDelete(null);
    } catch {
      // Toast is shown in the store
    }
  };

  const openPayDialog = () => {
    const balance = getBalanceDueForPayment(currentInvoice);
    setPaymentAmount(String(balance || currentInvoice?.total || 0));
    setPayDialogOpen(true);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-EC", {
      style: "currency",
      currency: "USD",
    }).format(value);
  };

  if (invoicesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!currentInvoice) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Comprobante no encontrado</p>
        <Button variant="link" onClick={() => navigate("/dashboard/invoices")}>
          Volver a comprobantes
        </Button>
      </div>
    );
  }

  const canAcceptPayments =
    currentInvoice.can_accept_payments ??
    ["pending", "partial", "overdue"].includes(currentInvoice.status);

  const balanceDueForPayment = getBalanceDueForPayment(currentInvoice);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/dashboard/invoices")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-3xl font-bold tracking-tight">
                {currentInvoice.invoice_number}
              </h2>
              <Badge
                className={`${statusColors[currentInvoice.status]} text-white`}
              >
                <span className="mr-1">
                  {statusIcons[currentInvoice.status]}
                </span>
                {currentInvoice.status_label}
              </Badge>
              {currentInvoice.is_overdue &&
                currentInvoice.status === "pending" && (
                  <Badge variant="destructive">
                    <AlertCircle className="mr-1 h-3 w-3" />
                    Vencida
                  </Badge>
                )}
            </div>
            <p className="text-muted-foreground flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {currentInvoice.source_label}
              </Badge>
              {currentInvoice.quote && (
                <Button
                  variant="link"
                  className="p-0 h-auto text-sm"
                  onClick={() =>
                    navigate(`/dashboard/quotes/${currentInvoice.quote?.id}`)
                  }
                >
                  <LinkIcon className="w-3 h-3 mr-1" />
                  {currentInvoice.quote.quote_number}
                </Button>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {canAcceptPayments && (
            <Button onClick={openPayDialog}>
              <DollarSign className="mr-2 h-4 w-4" />
              Registrar Pago
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => {
              const phone = currentInvoice.client?.phone;
              if (!phone) return;
              const formattedDueDate = (() => {
                try {
                  return format(
                    new Date(currentInvoice.due_date),
                    "dd MMM yyyy",
                    {
                      locale: es,
                    },
                  );
                } catch {
                  return currentInvoice.due_date;
                }
              })();

              const businessName = "\n\nDe parte de Nexus by RysthDesign";
              const text =
                `Saludos${
                  currentInvoice.client?.name
                    ? ` ${currentInvoice.client.name}`
                    : ""
                }, ` +
                `te comparto el comprobante de servicio ${currentInvoice.invoice_number}.\n` +
                `Total: ${formatCurrency(currentInvoice.total)}\n` +
                `Vence: ${formattedDueDate}` +
                businessName;

              const url = buildWhatsAppUrl(phone, text);
              if (!url) return;
              window.open(url, "_blank", "noopener,noreferrer");
            }}
            disabled={!currentInvoice.client?.phone}
          >
            <MessageCircle className="mr-2 h-4 w-4" />
            WhatsApp
          </Button>
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
              {currentInvoice.is_editable && (
                <DropdownMenuItem
                  onClick={() =>
                    navigate(`/dashboard/invoices/${currentInvoice.id}/edit`)
                  }
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Editar
                </DropdownMenuItem>
              )}

              {currentInvoice.status !== "paid" &&
                currentInvoice.status !== "voided" && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => setVoidDialogOpen(true)}
                      className="text-orange-600"
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Anular Comprobante
                    </DropdownMenuItem>
                  </>
                )}

              {currentInvoice.is_editable && (
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

      {/* Info Cards */}
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
            <div className="font-semibold">{currentInvoice.client?.name}</div>
            {currentInvoice.client?.email && (
              <div className="text-sm text-muted-foreground">
                {currentInvoice.client.email}
              </div>
            )}
            {currentInvoice.client?.phone && (
              <div className="text-sm text-muted-foreground">
                {currentInvoice.client.phone}
              </div>
            )}
            <Button
              variant="link"
              className="p-0 h-auto mt-2"
              onClick={() =>
                navigate(`/dashboard/clients/${currentInvoice.client_id}`)
              }
            >
              Ver cliente →
            </Button>
          </CardContent>
        </Card>

        {/* Project Info (if linked) */}
        {currentInvoice.project && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Proyecto
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="font-semibold">{currentInvoice.project.name}</div>
              <Badge variant="outline" className="mt-1">
                {currentInvoice.project.status_label}
              </Badge>
              <Button
                variant="link"
                className="p-0 h-auto mt-2 block"
                onClick={() =>
                  navigate(`/dashboard/projects/${currentInvoice.project_id}`)
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
                {format(new Date(currentInvoice.issue_date), "dd MMM yyyy", {
                  locale: es,
                })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Vence:</span>
              <span
                className={`font-medium ${
                  currentInvoice.is_overdue &&
                  currentInvoice.status === "pending"
                    ? "text-red-500"
                    : ""
                }`}
              >
                {format(new Date(currentInvoice.due_date), "dd MMM yyyy", {
                  locale: es,
                })}
              </span>
            </div>
            {currentInvoice.payment_date && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pagada:</span>
                <span className="font-medium text-green-600">
                  {format(
                    new Date(currentInvoice.payment_date),
                    "dd MMM yyyy",
                    {
                      locale: es,
                    },
                  )}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="details" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="details">Detalles</TabsTrigger>
          <TabsTrigger value="payments">Pagos</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-6">
          {/* Items Table */}
          <Card>
            <CardHeader>
              <CardTitle>Elementos del Comprobante</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {currentInvoice.items?.map((item, index) => (
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
                          <p className="text-muted-foreground text-xs">
                            Cantidad
                          </p>
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
                          <p className="text-muted-foreground text-xs">
                            Subtotal
                          </p>
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
                <div className="w-72 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal:</span>
                    <span className="font-medium">
                      {formatCurrency(currentInvoice.subtotal)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      IVA ({currentInvoice.tax_rate}%):
                    </span>
                    <span className="font-medium">
                      {formatCurrency(currentInvoice.tax_amount)}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg">
                    <span className="font-semibold">Total:</span>
                    <span className="font-bold text-primary">
                      {formatCurrency(currentInvoice.total)}
                    </span>
                  </div>
                  {currentInvoice.total_paid > 0 && (
                    <>
                      <div className="flex justify-between text-green-600">
                        <span>Pagado:</span>
                        <span className="font-medium">
                          -{formatCurrency(currentInvoice.total_paid)}
                        </span>
                      </div>
                      <Separator />
                      <div className="flex justify-between text-lg">
                        <span className="font-semibold">Saldo Pendiente:</span>
                        <span
                          className={`font-bold ${currentInvoice.balance_due > 0 ? "text-orange-600" : "text-green-600"}`}
                        >
                          {formatCurrency(currentInvoice.balance_due)}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          {currentInvoice.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notas</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{currentInvoice.notes}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="payments" className="space-y-6">
          {currentInvoice.payments && currentInvoice.payments.length > 0 ? (
            <Card
              className={
                currentInvoice.status === "paid"
                  ? "border-green-200 bg-green-50"
                  : "border-blue-200 bg-blue-50"
              }
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle
                    className={`text-sm font-medium flex items-center gap-2 ${currentInvoice.status === "paid" ? "text-green-700" : "text-blue-700"}`}
                  >
                    <DollarSign className="h-4 w-4" />
                    Pagos Registrados ({currentInvoice.payments?.length || 0})
                  </CardTitle>
                  <div
                    className={`text-sm font-medium ${currentInvoice.status === "paid" ? "text-green-700" : "text-blue-700"}`}
                  >
                    Total Pagado: {formatCurrency(currentInvoice.total_paid)}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {currentInvoice.payments?.map((payment) => (
                    <div
                      key={payment.id}
                      className={`flex items-center justify-between p-3 rounded-lg ${currentInvoice.status === "paid" ? "bg-green-100" : "bg-blue-100"}`}
                    >
                      <div className="flex items-center gap-4">
                        <div>
                          <p
                            className={`font-semibold ${currentInvoice.status === "paid" ? "text-green-800" : "text-blue-800"}`}
                          >
                            {formatCurrency(payment.amount)}
                          </p>
                          <p
                            className={`text-xs ${currentInvoice.status === "paid" ? "text-green-600" : "text-blue-600"}`}
                          >
                            {payment.payment_method_label}
                          </p>
                        </div>
                        <div
                          className={`text-sm ${currentInvoice.status === "paid" ? "text-green-700" : "text-blue-700"}`}
                        >
                          {format(
                            new Date(payment.payment_date),
                            "dd MMM yyyy",
                            { locale: es },
                          )}
                        </div>
                        {payment.notes && (
                          <p
                            className={`text-sm ${currentInvoice.status === "paid" ? "text-green-600" : "text-blue-600"}`}
                          >
                            {payment.notes}
                          </p>
                        )}
                      </div>
                      {currentInvoice.status !== "voided" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-100"
                          onClick={() => {
                            setPaymentToDelete(payment);
                            setDeletePaymentDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Balance Due */}
                {currentInvoice.balance_due > 0 && (
                  <div className="mt-4 pt-4 border-t border-blue-200 flex items-center justify-between">
                    <span className="text-blue-700 font-medium">
                      Saldo Pendiente:
                    </span>
                    <span className="text-xl font-bold text-blue-800">
                      {formatCurrency(currentInvoice.balance_due)}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Historial de Pagos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  No hay pagos registrados todavía.
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">
                    Saldo pendiente:
                  </span>
                  <span className="font-semibold">
                    {formatCurrency(currentInvoice.balance_due)}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Hidden Print Template */}
      <div className="hidden">
        <InvoicePrintTemplate
          ref={printRef}
          invoice={currentInvoice}
          business={business}
        />
      </div>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-5xl w-full max-h-[90vh] flex flex-col p-0 gap-0 bg-gray-100/95 backdrop-blur-sm">
          <DialogHeader className="p-4 border-b bg-white">
            <DialogTitle>Vista Previa del Comprobante</DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-6 flex justify-center">
            <div className="bg-white shadow-2xl rounded-sm max-w-[210mm] w-full min-h-[297mm] mx-auto overflow-hidden">
              <InvoicePrintTemplate
                invoice={currentInvoice}
                business={business}
              />
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

      {/* Pay Dialog */}
      <Dialog open={payDialogOpen} onOpenChange={setPayDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Pago</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Monto del Pago *</Label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                max={balanceDueForPayment}
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder={`Máximo: ${formatCurrency(balanceDueForPayment)}`}
              />
              <p className="text-xs text-muted-foreground">
                Saldo pendiente: {formatCurrency(balanceDueForPayment)}
              </p>
            </div>
            <div className="space-y-2">
              <Label>Método de Pago</Label>
              <Select
                value={paymentMethod}
                onValueChange={(v) =>
                  setPaymentMethod(v as "transfer" | "cash" | "card" | "other")
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="transfer">Transferencia</SelectItem>
                  <SelectItem value="cash">Efectivo</SelectItem>
                  <SelectItem value="card">Tarjeta</SelectItem>
                  <SelectItem value="other">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Notas (opcional)</Label>
              <Textarea
                placeholder="Número de transferencia, referencia, etc."
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
              />
            </div>
            <div className="p-4 bg-muted rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total factura:</span>
                <span>{formatCurrency(currentInvoice.total)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Ya pagado:</span>
                <span>{formatCurrency(currentInvoice.total_paid)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-lg">
                <span>Pago a registrar:</span>
                <span className="font-bold text-primary">
                  {formatCurrency(Number(paymentAmount) || 0)}
                </span>
              </div>
              {Number(paymentAmount) > 0 && (
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Saldo restante:</span>
                  <span
                    className={
                      balanceDueForPayment - Number(paymentAmount) <= 0
                        ? "text-green-600 font-medium"
                        : ""
                    }
                  >
                    {formatCurrency(
                      Math.max(0, balanceDueForPayment - Number(paymentAmount)),
                    )}
                    {balanceDueForPayment - Number(paymentAmount) <= 0 &&
                      " (Pagado completo)"}
                  </span>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleRegisterPayment}
              disabled={
                !paymentAmount ||
                Number(paymentAmount) <= 0 ||
                Number(paymentAmount) > balanceDueForPayment
              }
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Registrar Pago
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar comprobante?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente el
              comprobante "{currentInvoice.invoice_number}".
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

      {/* Void Dialog */}
      <AlertDialog open={voidDialogOpen} onOpenChange={setVoidDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Anular comprobante?</AlertDialogTitle>
            <AlertDialogDescription>
              El comprobante "{currentInvoice.invoice_number}" será marcado como
              anulado. Esta acción no elimina el comprobante, solo cambia su
              estado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleVoid}
              className="bg-orange-600 hover:bg-orange-700"
            >
              Anular
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Payment Dialog */}
      <AlertDialog
        open={deletePaymentDialogOpen}
        onOpenChange={setDeletePaymentDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar pago?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará el pago de{" "}
              {paymentToDelete ? formatCurrency(paymentToDelete.amount) : ""}{" "}
              registrado el{" "}
              {paymentToDelete
                ? format(
                    new Date(paymentToDelete.payment_date),
                    "dd MMM yyyy",
                    { locale: es },
                  )
                : ""}
              . El saldo de la factura se actualizará automáticamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePayment}
              className="bg-red-600 hover:bg-red-700"
            >
              Eliminar Pago
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
