"use client";

import * as React from "react";
import {
  ColumnDef,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ChevronDown, Download, Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import Pagination from "../../../components/common/Pagination";
import SearchBar from "../../../components/common/SearchBar";

interface UsersDataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  onCreateUser?: () => void;
  onExportUsers?: () => void;
  onFilterChange?: (filters: any) => void;
  onSearchChange?: (term: string) => void;
  onPageChange?: (selectedItem: { selected: number }) => void;
  canManageUsers: boolean;
  isLoading: boolean;
  isExporting: boolean;
  pagination?: {
    currentPage: number;
    pageCount: number;
    totalCount: number;
    perPage: number;
  };
}

export function UsersDataTable<TData, TValue>({
  columns,
  data,
  onCreateUser,
  onExportUsers,
  onFilterChange,
  onSearchChange,
  onPageChange,
  canManageUsers,
  isLoading,
  isExporting,
  pagination,
}: UsersDataTableProps<TData, TValue>) {
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [searchValue, setSearchValue] = React.useState("");
  const [selectedRole, setSelectedRole] = React.useState<string>("");

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    manualSorting: true, // Enable manual sorting for server-side
    manualFiltering: true, // Enable manual filtering for server-side
    state: {
      columnVisibility,
      rowSelection,
    },
  });

  return (
    <div className="space-y-4">
      {/* Header Actions */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center flex-1 gap-2 space-x-2">
          <SearchBar
            placeholder="Buscar usuarios..."
            value={searchValue}
            onSearch={(term) => {
              setSearchValue(term);
              onSearchChange?.(term);
            }}
            className="max-w-sm"
          />

          {/* Role Filter Dropdown */}
          {onFilterChange && (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    {selectedRole === ""
                      ? "Todos los roles"
                      : selectedRole === "admin"
                      ? "Administrador"
                      : selectedRole === "manager"
                      ? "Gerente"
                      : selectedRole === "operator"
                      ? "Operador"
                      : selectedRole === "user"
                      ? "Usuario"
                      : "Filtrar por rol"}
                    <ChevronDown className="w-4 h-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuCheckboxItem
                    checked={selectedRole === ""}
                    onCheckedChange={() => {
                      setSelectedRole("");
                      onFilterChange({ role: "" });
                    }}
                  >
                    Todos los roles
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={selectedRole === "admin"}
                    onCheckedChange={() => {
                      setSelectedRole("admin");
                      onFilterChange({ role: "admin" });
                    }}
                  >
                    Administrador
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={selectedRole === "manager"}
                    onCheckedChange={() => {
                      setSelectedRole("manager");
                      onFilterChange({ role: "manager" });
                    }}
                  >
                    Gerente
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={selectedRole === "user"}
                    onCheckedChange={() => {
                      setSelectedRole("user");
                      onFilterChange({ role: "user" });
                    }}
                  >
                    Usuario
                  </DropdownMenuCheckboxItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Clear Filters Button */}
              {(searchValue !== "" || selectedRole !== "") && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchValue("");
                    setSelectedRole("");
                    onSearchChange?.("");
                    onFilterChange({ role: "" });
                  }}
                  className="h-8 px-2 lg:px-3"
                >
                  <X className="w-4 h-4 mr-2" />
                  Limpiar filtros
                </Button>
              )}
            </>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {canManageUsers && onExportUsers && (
            <Button
              variant="outline"
              size="sm"
              onClick={onExportUsers}
              disabled={isExporting}
            >
              {isExporting ? (
                <>
                  <div className="w-4 h-4 mr-2 border-2 border-gray-300 rounded-full animate-spin border-t-gray-600" />
                  Exportando...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Exportar
                </>
              )}
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                Columnas <ChevronDown className="w-4 h-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>
          {canManageUsers && onCreateUser && (
            <Button onClick={onCreateUser} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Usuario
            </Button>
          )}
        </div>
      </div>

      {/* Data Table */}
      <Card className="p-0 rounded-xl">
        <CardContent className="p-0 !border-none border-transparent rounded-none">
          <div className="bg-white !border-transparent">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      return (
                        <TableHead key={header.id}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </TableHead>
                      );
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center"
                    >
                      <div className="flex items-center justify-center">
                        <div className="w-6 h-6 border-2 border-gray-300 rounded-full animate-spin border-t-gray-600" />
                        <span className="ml-2">Cargando usuarios...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && "selected"}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center"
                    >
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <div className="text-muted-foreground">
                          No se encontraron usuarios.
                        </div>
                        {canManageUsers && onCreateUser && (
                          <Button variant="outline" onClick={onCreateUser}>
                            <Plus className="w-4 h-4 mr-2" />
                            Crear primer usuario
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination && onPageChange && (
        <Pagination
          currentPage={pagination.currentPage}
          pageCount={pagination.pageCount}
          totalCount={pagination.totalCount}
          perPage={pagination.perPage}
          onPageChange={onPageChange}
        />
      )}
    </div>
  );
}
