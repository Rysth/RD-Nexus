import { useEffect, useState } from "react";
import { RecurringService, useClientStore } from "../../../stores/clientStore";
import {
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Pause,
  Play,
  Calendar,
  DollarSign,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import toast from "react-hot-toast";
import RecurringServiceCreate from "./RecurringServiceCreate";
import RecurringServiceEdit from "./RecurringServiceEdit";
import RecurringServiceDelete from "./RecurringServiceDelete";

const statusColors: Record<string, string> = {
  active: "bg-green-100 text-green-800 hover:bg-green-100",
  paused: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
};

const cycleColors: Record<string, string> = {
  monthly: "bg-blue-100 text-blue-800",
  yearly: "bg-purple-100 text-purple-800",
};

interface RecurringServiceListProps {
  projectId: number;
}

export default function RecurringServiceList({
  projectId,
}: RecurringServiceListProps) {
  const {
    recurringServices,
    recurringServicesLoading,
    fetchRecurringServicesByProject,
    toggleRecurringServiceStatus,
  } = useClientStore();

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedService, setSelectedService] =
    useState<RecurringService | null>(null);

  useEffect(() => {
    fetchRecurringServicesByProject(projectId);
  }, [projectId, fetchRecurringServicesByProject]);

  const handleEdit = (service: RecurringService) => {
    setSelectedService(service);
    setEditOpen(true);
  };

  const handleDelete = (service: RecurringService) => {
    setSelectedService(service);
    setDeleteOpen(true);
  };

  const handleToggleStatus = async (service: RecurringService) => {
    try {
      await toggleRecurringServiceStatus(service.id);
      toast.success(
        `Servicio ${
          service.status === "active" ? "pausado" : "activado"
        } correctamente`
      );
    } catch {
      toast.error("Error al cambiar estado del servicio");
    }
  };

  const handleSuccess = () => {
    fetchRecurringServicesByProject(projectId);
  };

  // Stats
  const totalServices = recurringServices.length;
  const activeServices = recurringServices.filter(
    (s) => s.status === "active"
  ).length;
  const monthlyRevenue = recurringServices
    .filter((s) => s.status === "active" && s.billing_cycle === "monthly")
    .reduce((acc, s) => acc + s.amount, 0);
  const yearlyRevenue = recurringServices
    .filter((s) => s.status === "active" && s.billing_cycle === "yearly")
    .reduce((acc, s) => acc + s.amount, 0);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Servicios
            </CardTitle>
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalServices}</div>
            <p className="text-xs text-muted-foreground">
              {activeServices} activos
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Ingreso Mensual
            </CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${monthlyRevenue.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">Servicios mensuales</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingreso Anual</CardTitle>
            <Calendar className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${yearlyRevenue.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">Servicios anuales</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">MRR Estimado</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(monthlyRevenue + yearlyRevenue / 12).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Ingreso mensual recurrente
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Services Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Servicios Recurrentes</CardTitle>
            <CardDescription>
              Cobros recurrentes configurados para este proyecto
            </CardDescription>
          </div>
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Servicio
          </Button>
        </CardHeader>
        <CardContent>
          {recurringServicesLoading && recurringServices.length === 0 ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : recurringServices.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center border-2 border-dashed rounded-lg">
              <RefreshCw className="h-10 w-10 text-muted-foreground mb-4 opacity-50" />
              <h3 className="text-lg font-medium">
                No hay servicios recurrentes
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Este proyecto no tiene servicios de cobro recurrente.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCreateOpen(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Crear primer servicio
              </Button>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Servicio</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead>Ciclo</TableHead>
                    <TableHead>Próxima Facturación</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="w-[70px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recurringServices.map((service) => (
                    <TableRow key={service.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{service.name}</p>
                          {service.description && (
                            <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                              {service.description}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        ${service.amount.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={cycleColors[service.billing_cycle]}
                          variant="secondary"
                        >
                          {service.billing_cycle_label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(service.next_billing_date).toLocaleDateString(
                          "es-EC"
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={statusColors[service.status]}
                          variant="secondary"
                        >
                          {service.status_label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleEdit(service)}
                            >
                              <Pencil className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleToggleStatus(service)}
                            >
                              {service.status === "active" ? (
                                <>
                                  <Pause className="mr-2 h-4 w-4" />
                                  Pausar
                                </>
                              ) : (
                                <>
                                  <Play className="mr-2 h-4 w-4" />
                                  Activar
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDelete(service)}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <RecurringServiceCreate
        open={createOpen}
        onOpenChange={setCreateOpen}
        projectId={projectId}
        onSuccess={handleSuccess}
      />

      {selectedService && (
        <>
          <RecurringServiceEdit
            open={editOpen}
            onOpenChange={setEditOpen}
            service={selectedService}
            onSuccess={handleSuccess}
          />
          <RecurringServiceDelete
            open={deleteOpen}
            onOpenChange={setDeleteOpen}
            service={selectedService}
            onSuccess={handleSuccess}
          />
        </>
      )}
    </div>
  );
}
