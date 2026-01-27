import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDashboardStore } from "@/stores/dashboardStore";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatsCard } from "@/components/ui/stats-card";
import { AreaChart } from "@/components/AreaChart";
import { DonutChart } from "@/components/DonutChart";
import {
  Users,
  DollarSign,
  FolderOpen,
  RefreshCw,
  FileText,
  Clock,
  AlertCircle,
  CheckCircle2,
  CalendarClock,
  ArrowRight,
  Loader2,
} from "lucide-react";

// Helper to format currency
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("es-EC", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

// Helper to format date
const formatDate = (dateString: string) => {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("es-EC", {
    day: "numeric",
    month: "short",
  });
};

// Status badge component
const StatusBadge = ({ status }: { status: string }) => {
  const config: Record<string, { color: string; label: string }> = {
    pending: { color: "text-yellow-600", label: "Pendiente" },
    partial: { color: "text-blue-600", label: "Pago Parcial" },
    paid: { color: "text-green-600", label: "Pagada" },
    overdue: { color: "text-red-600", label: "Vencida" },
    voided: { color: "text-gray-600", label: "Anulada" },
  };

  const { color, label } = config[status] || {
    color: "text-gray-600",
    label: status,
  };

  return (
    <Badge variant="outline" className={`gap-1 ${color}`}>
      {status === "paid" && <CheckCircle2 className="w-3 h-3" />}
      {status === "pending" && <Clock className="w-3 h-3" />}
      {status === "partial" && <DollarSign className="w-3 h-3" />}
      {status === "overdue" && <AlertCircle className="w-3 h-3" />}
      {label}
    </Badge>
  );
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { stats, loading, error, fetchStats } = useDashboardStore();

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Loading state
  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !stats) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-4">
          <AlertCircle className="w-8 h-8 text-destructive" />
          <p className="text-destructive">{error}</p>
          <Button onClick={() => fetchStats()} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  // No data fallback
  if (!stats) {
    return null;
  }

  // Prepare chart data
  const revenueChartData = stats.monthly_revenue.map((item) => ({
    date: item.month,
    Ingresos: item.revenue,
  }));

  // Invoice distribution data
  const invoiceDistribution = [
    { name: "Pendientes", value: stats.invoices.pending_count, color: "amber" },
    {
      name: "Pago Parcial",
      value: stats.invoices.partial_count,
      color: "blue",
    },
    { name: "Pagadas", value: stats.invoices.paid_count, color: "emerald" },
    { name: "Vencidas", value: stats.invoices.overdue_count, color: "red" },
  ].filter((item) => item.value > 0);

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Resumen general de RysthDesign
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            useDashboardStore.setState({ lastFetched: null });
            fetchStats();
          }}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4 mr-2" />
          )}
          Actualizar
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Clientes"
          value={stats.summary.clients_count.toString()}
          icon={Users}
          iconColor="text-blue-600"
          iconBgColor="bg-blue-100 dark:bg-blue-900/50"
          variant="colored"
          description={`${stats.summary.projects_count} proyectos activos`}
        />

        <StatsCard
          title="MRR"
          value={formatCurrency(stats.revenue.mrr)}
          icon={RefreshCw}
          iconColor="text-emerald-600"
          iconBgColor="bg-emerald-100 dark:bg-emerald-900/50"
          variant="colored"
          description={`${stats.summary.active_services_count} servicios activos`}
        />

        <StatsCard
          title="Por Cobrar"
          value={formatCurrency(stats.revenue.pending)}
          icon={FileText}
          iconColor="text-amber-600"
          iconBgColor="bg-amber-100 dark:bg-amber-900/50"
          variant="colored"
          trend={
            stats.revenue.overdue > 0
              ? {
                  value: formatCurrency(stats.revenue.overdue),
                  isPositive: false,
                  label: "vencido",
                }
              : undefined
          }
          description={`${stats.invoices.pending_count} comprobantes pendientes`}
        />

        <StatsCard
          title="Recaudado"
          value={formatCurrency(stats.revenue.total_collected)}
          icon={DollarSign}
          iconColor="text-purple-600"
          iconBgColor="bg-purple-100 dark:bg-purple-900/50"
          variant="colored"
          description={`${stats.invoices.paid_count} comprobantes pagados`}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 gap-4 mt-6 lg:grid-cols-3">
        {/* Revenue Chart */}
        <Card className="shadow-sm lg:col-span-2 bg-gradient-to-t from-primary/5 to-card">
          <CardHeader>
            <CardTitle>Ingresos - Últimos 6 Meses</CardTitle>
            <CardDescription>Evolución de facturación mensual</CardDescription>
          </CardHeader>
          <CardContent>
            {revenueChartData.length > 0 ? (
              <AreaChart
                className="h-72"
                data={revenueChartData}
                index="date"
                categories={["Ingresos"]}
                colors={["emerald"]}
                valueFormatter={(number: number) => formatCurrency(number)}
              />
            ) : (
              <div className="flex items-center justify-center h-72 text-muted-foreground">
                No hay datos de facturación aún
              </div>
            )}
          </CardContent>
          <CardFooter className="text-sm text-muted-foreground">
            ARR estimado: {formatCurrency(stats.revenue.arr)}
          </CardFooter>
        </Card>

        {/* Invoice Distribution */}
        <Card className="shadow-sm bg-gradient-to-t from-primary/5 to-card">
          <CardHeader>
            <CardTitle>Estado de Comprobantes</CardTitle>
            <CardDescription>Distribución por estado</CardDescription>
          </CardHeader>
          <CardContent>
            {invoiceDistribution.length > 0 ? (
              <DonutChart
                data={invoiceDistribution}
                category="name"
                value="value"
                colors={invoiceDistribution.map((d) => d.color)}
                valueFormatter={(value: number) => `${value} comprobantes`}
              />
            ) : (
              <div className="flex items-center justify-center h-48 text-muted-foreground">
                No hay comprobantes aún
              </div>
            )}
          </CardContent>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="flex justify-between w-full">
              <span className="text-muted-foreground">
                Cotizaciones pendientes
              </span>
              <span className="font-medium">{stats.quotes.pending_count}</span>
            </div>
            <div className="flex justify-between w-full">
              <span className="text-muted-foreground">
                Cotizaciones aprobadas
              </span>
              <span className="font-medium">{stats.quotes.approved_count}</span>
            </div>
          </CardFooter>
        </Card>
      </div>

      {/* Tables Section */}
      <div className="grid grid-cols-1 gap-4 mt-6 lg:grid-cols-2">
        {/* Recent Invoices */}
        <Card className="shadow-sm bg-gradient-to-t from-primary/5 to-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Comprobantes Recientes</CardTitle>
              <CardDescription>Últimos comprobantes emitidos</CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/invoices")}
            >
              Ver todas
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            {stats.recent_invoices.length > 0 ? (
              <div className="space-y-3">
                {stats.recent_invoices.map((invoice) => (
                  <div
                    key={invoice.id}
                    className="flex items-center justify-between p-3 transition-colors rounded-lg cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate(`/invoices/${invoice.id}`)}
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {invoice.invoice_number}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {invoice.client_name}
                        {invoice.project_name && ` • ${invoice.project_name}`}
                      </span>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="font-semibold">
                        {formatCurrency(invoice.total)}
                      </span>
                      <StatusBadge status={invoice.status} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                No hay comprobantes recientes
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Billing */}
        <Card className="shadow-sm bg-gradient-to-t from-primary/5 to-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Próximas Facturaciones</CardTitle>
              <CardDescription>Servicios a facturar en 7 días</CardDescription>
            </div>
            <CalendarClock className="w-5 h-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {stats.upcoming_billing.length > 0 ? (
              <div className="space-y-3">
                {stats.upcoming_billing.map((service) => (
                  <div
                    key={service.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {service.service_name}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {service.client_name} • {service.project_name}
                      </span>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="font-semibold">
                        {formatCurrency(service.amount)}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {formatDate(service.next_billing_date)}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <CheckCircle2 className="w-8 h-8 mb-2 text-green-500" />
                <span>No hay facturaciones pendientes</span>
              </div>
            )}
          </CardContent>
          <CardFooter className="text-sm text-muted-foreground">
            Total servicios recurrentes: {stats.summary.total_services_count}
          </CardFooter>
        </Card>
      </div>
    </>
  );
}
