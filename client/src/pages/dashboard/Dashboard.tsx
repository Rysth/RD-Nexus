import { useEffect } from "react";
import { useAuthStore } from "../../stores/authStore";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatsCard } from "@/components/ui/stats-card";
import { AreaChart } from "../../components/AreaChart";
import { ComboChart } from "../../components/ComboChart";
import { DonutChart } from "../../components/DonutChart";
import {
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  CheckCircle,
  Activity,
} from "lucide-react";

const chartdata = [
  { date: "Ene 24", Usuarios: 2890, Ingresos: 2338 },
  { date: "Feb 24", Usuarios: 2756, Ingresos: 2103 },
  { date: "Mar 24", Usuarios: 3322, Ingresos: 2194 },
  { date: "Abr 24", Usuarios: 3470, Ingresos: 2108 },
  { date: "May 24", Usuarios: 3475, Ingresos: 1812 },
  { date: "Jun 24", Usuarios: 3129, Ingresos: 1726 },
  { date: "Jul 24", Usuarios: 3490, Ingresos: 1982 },
  { date: "Ago 24", Usuarios: 2903, Ingresos: 2012 },
  { date: "Sep 24", Usuarios: 2643, Ingresos: 2342 },
  { date: "Oct 24", Usuarios: 2837, Ingresos: 2473 },
  { date: "Nov 24", Usuarios: 2954, Ingresos: 3848 },
  { date: "Dic 24", Usuarios: 3239, Ingresos: 3736 },
];

const salesData = [
  { date: "Ene 24", Ventas: 1200, Objetivos: 1000 },
  { date: "Feb 24", Ventas: 1800, Objetivos: 1200 },
  { date: "Mar 24", Ventas: 2200, Objetivos: 1500 },
  { date: "Abr 24", Ventas: 1900, Objetivos: 1400 },
  { date: "May 24", Ventas: 2400, Objetivos: 1800 },
  { date: "Jun 24", Ventas: 2100, Objetivos: 1600 },
];

const distributionData = [
  { name: "Administradores", value: 12, percentage: 15 },
  { name: "Gerentes", value: 25, percentage: 31 },
  { name: "Operadores", value: 30, percentage: 37 },
  { name: "Usuarios", value: 14, percentage: 17 },
];

const performanceData = [
  { metric: "CPU", value: 45, color: "blue" },
  { metric: "Memoria", value: 72, color: "yellow" },
  { metric: "Uptime", value: 99.8, color: "green" },
];

export default function Dashboard() {
  const { user, fetchUserInfo } = useAuthStore();

  // Validate session on mount - if token expired, the API interceptor will handle 401 and redirect
  useEffect(() => {
    fetchUserInfo();
  }, [fetchUserInfo]);

  return (
    <>
      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Usuarios"
          value="25.6K"
          icon={Users}
          iconColor="text-blue-600"
          iconBgColor="bg-blue-100 dark:bg-blue-900/50"
          variant="colored"
          trend={{
            value: "+21%",
            isPositive: true,
            label: "Crecimiento sostenido",
          }}
          description="Usuarios activos en los últimos 30 días"
        />

        <StatsCard
          title="Ingresos Totales"
          value="$2.6M"
          icon={DollarSign}
          iconColor="text-emerald-600"
          iconBgColor="bg-emerald-100 dark:bg-emerald-900/50"
          variant="colored"
          trend={{
            value: "+18.5%",
            isPositive: true,
            label: "Superando objetivos",
          }}
          description="Ingresos del trimestre actual"
        />

        <StatsCard
          title="Tareas Completadas"
          value="86%"
          icon={CheckCircle}
          iconColor="text-amber-600"
          iconBgColor="bg-amber-100 dark:bg-amber-900/50"
          variant="colored"
          trend={{
            value: "-5%",
            isPositive: false,
            label: "Necesita atención",
          }}
          description="31 tareas pendientes de revisión"
        />

        <StatsCard
          title="Tasa de Conversión"
          value="4.2%"
          icon={Activity}
          iconColor="text-purple-600"
          iconBgColor="bg-purple-100 dark:bg-purple-900/50"
          variant="colored"
          trend={{
            value: "+0.8%",
            isPositive: true,
            label: "Rendimiento estable",
          }}
          description="Conversión de visitantes a clientes"
        />
      </div>
      {/* Enhanced Charts Section */}
      <div className="grid grid-cols-1 gap-4 mt-6 lg:grid-cols-2">
        <Card className="shadow-sm bg-gradient-to-t from-primary/5 to-card">
          <CardHeader>
            <CardTitle>Tendencias de Usuarios e Ingresos</CardTitle>
            <CardDescription>
              Análisis comparativo de crecimiento mensual
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AreaChart
              className="h-80"
              data={chartdata}
              index="date"
              categories={["Usuarios", "Ingresos"]}
              colors={["blue", "emerald"]}
              valueFormatter={(number: number) =>
                `${Intl.NumberFormat("es").format(number).toString()}`
              }
            />
          </CardContent>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="flex items-center gap-2 font-medium">
              Tendencia positiva este trimestre
              <TrendingUp className="w-4 h-4 text-green-600" />
            </div>
            <div className="text-muted-foreground">
              Datos de los últimos 12 meses
            </div>
          </CardFooter>
        </Card>

        <Card className="shadow-sm bg-gradient-to-t from-primary/5 to-card">
          <CardHeader>
            <CardTitle>Ventas vs Objetivos</CardTitle>
            <CardDescription>
              Comparación de rendimiento contra metas establecidas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ComboChart
              data={salesData}
              index="date"
              enableBiaxial={true}
              barSeries={{
                categories: ["Ventas"],
                yAxisLabel: "Ventas (Barras)",
                colors: ["blue"],
              }}
              lineSeries={{
                categories: ["Objetivos"],
                showYAxis: true,
                yAxisLabel: "Objetivos (Línea)",
                colors: ["amber"],
                yAxisWidth: 60,
              }}
            />
          </CardContent>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="flex items-center gap-2 font-medium">
              Superando objetivos en Q2
              <TrendingUp className="w-4 h-4 text-green-600" />
            </div>
            <div className="text-muted-foreground">
              Proyección basada en tendencias actuales
            </div>
          </CardFooter>
        </Card>
      </div>{" "}
      {/* Second Chart Row */}
      <div className="grid grid-cols-1 gap-4 mt-6 lg:grid-cols-2">
        <Card className="shadow-sm bg-gradient-to-t from-primary/5 to-card">
          <CardHeader>
            <CardTitle>Distribución de Usuarios por Rol</CardTitle>
            <CardDescription>
              Segmentación actual de la base de usuarios
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DonutChart
              data={distributionData}
              category="name"
              value="value"
              colors={["blue", "emerald", "violet", "amber"]}
              valueFormatter={(value: number) => `${value} usuarios`}
            />
          </CardContent>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="flex items-center gap-2 font-medium">
              Distribución equilibrada
              <CheckCircle className="w-4 h-4 text-green-600" />
            </div>
            <div className="text-muted-foreground">
              Total de 81 usuarios activos
            </div>
          </CardFooter>
        </Card>

        <Card className="shadow-sm bg-gradient-to-t from-primary/5 to-card">
          <CardHeader>
            <CardTitle>Métricas del Sistema</CardTitle>
            <CardDescription>
              Rendimiento en tiempo real del sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {performanceData.map((item) => (
                <div key={item.metric} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{item.metric}</span>
                      {item.value > 90 ? (
                        <Badge
                          variant="outline"
                          className="gap-1 text-green-600"
                        >
                          <TrendingUp className="w-3 h-3" />
                          Óptimo
                        </Badge>
                      ) : item.value > 70 ? (
                        <Badge
                          variant="outline"
                          className="gap-1 text-yellow-600"
                        >
                          <Activity className="w-3 h-3" />
                          Normal
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="gap-1 text-red-600">
                          <TrendingDown className="w-3 h-3" />
                          Crítico
                        </Badge>
                      )}
                    </div>
                    <span className="text-sm font-semibold tabular-nums">
                      {item.value}%
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-secondary">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        item.color === "blue"
                          ? "bg-blue-500"
                          : item.color === "yellow"
                          ? "bg-yellow-500"
                          : "bg-green-500"
                      }`}
                      style={{ width: `${item.value}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter className="text-sm text-muted-foreground">
            Última actualización: hace 2 minutos
          </CardFooter>
        </Card>
      </div>
      {/* Enhanced Recent Activity Table */}
      <Card className="mt-6 shadow-sm bg-gradient-to-t from-primary/5 to-card">
        <CardHeader>
          <CardTitle>Actividad Reciente</CardTitle>
          <CardDescription>
            Últimas acciones y eventos del sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left uppercase text-muted-foreground">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left uppercase text-muted-foreground">
                    Actividad
                  </th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left uppercase text-muted-foreground">
                    Usuario
                  </th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left uppercase text-muted-foreground">
                    Estado
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                <tr className="transition-colors hover:bg-muted/50">
                  <td className="px-6 py-4 text-sm font-medium whitespace-nowrap">
                    10 Abr, 2025
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-blue-600" />
                      Registro de nuevo usuario
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm whitespace-nowrap text-muted-foreground">
                    Sistema
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant="outline" className="gap-1 text-green-600">
                      <CheckCircle className="w-3 h-3" />
                      Completado
                    </Badge>
                  </td>
                </tr>
                <tr className="transition-colors hover:bg-muted/50">
                  <td className="px-6 py-4 text-sm font-medium whitespace-nowrap">
                    9 Abr, 2025
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-yellow-600" />
                      Actualización del sistema
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm whitespace-nowrap text-muted-foreground">
                    Admin
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant="outline" className="gap-1 text-yellow-600">
                      <Activity className="w-3 h-3" />
                      En Progreso
                    </Badge>
                  </td>
                </tr>
                <tr className="transition-colors hover:bg-muted/50">
                  <td className="px-6 py-4 text-sm font-medium whitespace-nowrap">
                    8 Abr, 2025
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-green-600" />
                      Respaldo de base de datos
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm whitespace-nowrap text-muted-foreground">
                    Sistema
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant="outline" className="gap-1 text-green-600">
                      <CheckCircle className="w-3 h-3" />
                      Completado
                    </Badge>
                  </td>
                </tr>
                <tr className="transition-colors hover:bg-muted/50">
                  <td className="px-6 py-4 text-sm font-medium whitespace-nowrap">
                    7 Abr, 2025
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-blue-600" />
                      Análisis de rendimiento
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm whitespace-nowrap text-muted-foreground">
                    {user?.fullname}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant="outline" className="gap-1 text-green-600">
                      <CheckCircle className="w-3 h-3" />
                      Completado
                    </Badge>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
        <CardFooter className="text-sm text-muted-foreground">
          Mostrando las últimas 4 actividades • Actualizado hace 1 minuto
        </CardFooter>
      </Card>
    </>
  );
}
