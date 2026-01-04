import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

interface DataTablePaginationProps {
  currentPage: number;
  lastPage: number;
  total: number;
  perPage: number;
  onPageChange: (page: number) => void;
}

export function DataTablePagination({
  currentPage,
  lastPage,
  total,
  perPage,
  onPageChange,
}: DataTablePaginationProps) {
  const startItem = (currentPage - 1) * perPage + 1;
  const endItem = Math.min(currentPage * perPage, total);

  return (
    <div className="flex items-center justify-between px-2">
      <div className="text-sm text-muted-foreground">
        Mostrando {startItem} a {endItem} de {total} resultados
      </div>
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="text-sm font-medium">
          Página {currentPage} de {lastPage}
        </div>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === lastPage}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => onPageChange(lastPage)}
          disabled={currentPage === lastPage}
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
