import React from "react";

interface EmptyStateDisplayProps {
  entityName: string; // Name of entities (plural): "productos", "categorías", etc.
  entityLabel?: string; // Optional entity label (singular with article): "un producto", "una categoría"
  newEntityName?: string; // Name for creation button: "nuevo producto", "nueva categoría"
  icon?: string; // Icon class, defaults to "bx-search-alt"
  hasFilters: boolean; // Whether filters are applied
  canCreate: boolean; // Whether user has create permission
  onReset: () => void; // Reset filters handler
  onCreate: () => void; // Create entity handler
  colSpan?: number; // Number of columns to span (default: 7)
}

const EmptyStateDisplay: React.FC<EmptyStateDisplayProps> = ({
  entityName,
  entityLabel = "",
  newEntityName = "",
  icon = "bx-search-alt",
  hasFilters,
  canCreate,
  onReset,
  onCreate,
  colSpan = 7,
}) => {
  return (
    <tr className="h-full">
      <td colSpan={colSpan} className="text-center h-[490px]">
        <div className="flex flex-col items-center justify-center gap-4 p-8">
          <div className="w-24 h-24 rounded-full bg-neutral-100 flex items-center justify-center">
            <i className={`bx ${icon} text-6xl text-neutral-400`}></i>
          </div>
          <p className="text-xl font-medium text-neutral-600">
            No se encontraron {entityName}
          </p>

          {/* Show different messages based on filters */}
          {hasFilters ? (
            <div className="max-w-md text-center">
              <p className="text-neutral-500 mb-4">
                No se encontraron {entityName} que coincidan con los criterios
                de búsqueda. Intente con otros filtros o reestablezca la
                búsqueda.
              </p>
              <button className="btn btn-primary btn-sm" onClick={onReset}>
                <i className="bx bx-refresh mr-1"></i>
                Restablecer filtros
              </button>
            </div>
          ) : canCreate ? (
            <div className="max-w-md text-center">
              <p className="text-neutral-500 mb-4">
                No hay {entityName} en el sistema. Comience creando{" "}
                {entityLabel}
                haciendo clic en el botón a continuación.
              </p>
              <button className="btn btn-primary btn-sm" onClick={onCreate}>
                <i className="bx bx-plus mr-1"></i>
                Crear {newEntityName}
              </button>
            </div>
          ) : (
            <p className="text-neutral-500">
              No hay {entityName} disponibles para mostrar actualmente.
            </p>
          )}
        </div>
      </td>
    </tr>
  );
};

export default EmptyStateDisplay;
