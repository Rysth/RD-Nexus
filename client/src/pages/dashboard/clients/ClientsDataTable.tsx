"use client";

import * as React from "react";
import {
  ColumnDef,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ChevronDown, Plus, X } from "lucide-react";
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

interface ClientsDataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  onCreateClient?: () => void;
  onSearchChange?: (term: string) => void;
  onPageChange?: (selectedItem: { selected: number }) => void;
  isLoading: boolean;
  pagination?: {
    currentPage: number;
    pageCount: number;
    totalCount: number;
    perPage: number;
  };
}

export function ClientsDataTable<TData, TValue>({
  columns,
  data,
  onCreateClient,
  onSearchChange,
  onPageChange,
  isLoading,
  pagination,
}: ClientsDataTableProps<TData, TValue>) {
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [searchValue, setSearchValue] = React.useState("");

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    manualSorting: true,
    manualFiltering: true,
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
            placeholder="Buscar clientes..."
            value={searchValue}
            onSearch={(term) => {
              setSearchValue(term);
              onSearchChange?.(term);
            }}
            className="max-w-sm"
          />

          {searchValue !== "" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchValue("");
                onSearchChange?.("");
              }}
              className="h-8 px-2 lg:px-3"
            >
              <X className="w-4 h-4 mr-2" />
              Limpiar filtros
            </Button>
          )}
        </div>
        <div className="flex items-center space-x-2">
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
          {onCreateClient && (
            <Button onClick={onCreateClient} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Cliente
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
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    ))}
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
                        <span className="ml-2">Cargando clientes...</span>
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
                          No se encontraron clientes.
                        </div>
                        {onCreateClient && (
                          <Button variant="outline" onClick={onCreateClient}>
                            <Plus className="w-4 h-4 mr-2" />
                            Crear primer cliente
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
