import { useEffect, useState, useRef } from "react";
import { useAuthStore } from "../../../stores/authStore";
import { useUserStore, User } from "../../../stores/userStore";
import { toast } from "react-hot-toast";
import { UsersDataTable } from "./UsersDataTable";
import { createUsersColumns } from "./UsersColumns";
import UsersDelete from "./UsersDelete";
import UsersCreate from "./UsersCreate";
import UsersEdit from "./UsersEdit";
import UsersUpdatePassword from "./UsersUpdatePassword";

export default function UsersIndex() {
  const { user: currentUser } = useAuthStore();
  const {
    users,
    isLoading,
    isExporting,
    fetchUsers,
    toggleUserConfirmation,
    exportUsers,
    pagination,
  } = useUserStore();

  const [searchTerm, setSearchTerm] = useState("");
  const [perPage] = useState(12);
  const [filters, setFilters] = useState({});

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [userToUpdatePassword, setUserToUpdatePassword] = useState<User | null>(
    null
  );
  const [confirmingUserId, setConfirmingUserId] = useState<number | null>(null);

  const isMounted = useRef(false);

  const canManageUsers = currentUser?.roles.some((role) =>
    ["admin", "manager"].includes(role)
  );

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (!isMounted.current) return;

    const loadUsers = async () => {
      try {
        const allFilters = {
          ...filters,
          search: searchTerm,
        };
        // Always start from page 1 when filters change
        await fetchUsers(1, perPage, allFilters);
      } catch (fetchError: any) {
        if (isMounted.current) {
          toast.error(fetchError.message || "Error al cargar usuarios");
        }
      }
    };

    loadUsers();
  }, [fetchUsers, perPage, searchTerm, filters]);

  const handleDeleteClick = (user: User) => {
    if (user.id === currentUser?.id) {
      toast.error("No puedes eliminar tu propio usuario");
      return;
    }
    if (user.roles.includes("admin") && !currentUser?.roles.includes("admin")) {
      toast.error("No tienes permiso para eliminar usuarios administradores");
      return;
    }
    if (
      user.roles.includes("manager") &&
      currentUser?.roles.includes("manager") &&
      !currentUser?.roles.includes("admin")
    ) {
      toast.error("Solo los administradores pueden eliminar usuarios gerentes");
      return;
    }
    setUserToDelete(user);
    setDeleteModalOpen(true);
  };

  const handleEditClick = (user: User) => {
    setUserToEdit(user);
    setEditModalOpen(true);
  };

  const handlePasswordUpdateClick = (user: User) => {
    setUserToUpdatePassword(user);
    setPasswordModalOpen(true);
  };

  const handleConfirmationToggle = async (user: User) => {
    if (!canManageUsers) {
      toast.error("No tienes permisos para cambiar el estado de confirmación");
      return;
    }
    if (user.roles.includes("admin")) {
      toast.error(
        "No puedes cambiar la confirmación de usuarios administradores"
      );
      return;
    }
    setConfirmingUserId(user.id);
    try {
      const newConfirmationState = !user.verified;
      await toggleUserConfirmation(user.id, newConfirmationState);
      const action = newConfirmationState ? "confirmado" : "desconfirmado";
      toast.success(`Usuario ${user.fullname} ${action} correctamente`);
    } catch (error: any) {
      toast.error(error.message || "Error al actualizar la confirmación");
    } finally {
      if (isMounted.current) {
        setConfirmingUserId(null);
      }
    }
  };

  const handleExportUsers = async () => {
    try {
      const allFilters = { ...filters, search: searchTerm };
      await exportUsers(allFilters);
      toast.success("Usuarios exportados correctamente");
    } catch (error: any) {
      toast.error(error.message || "Error al exportar usuarios");
    }
  };

  const handleFilterChange = (newFilters: any) => {
    setFilters(newFilters);
    // No need to reset page - the useEffect will handle it
  };

  const handleSearchChange = (term: string) => {
    setSearchTerm(term);
    // No need to reset page - the useEffect will handle it
  };

  const handlePageChange = (selectedItem: { selected: number }) => {
    // Convert 0-based to 1-based for API call
    const page = selectedItem.selected + 1;
    const allFilters = {
      ...filters,
      search: searchTerm,
    };
    fetchUsers(page, perPage, allFilters);
  };

  // Filter users based on current user's role
  const filteredUsers = users.filter((user) => {
    if (currentUser?.roles.includes("admin")) {
      return true;
    }
    return !user.roles.includes("admin");
  });

  const columns = createUsersColumns({
    onEdit: handleEditClick,
    onDelete: handleDeleteClick,
    onToggleConfirmation: handleConfirmationToggle,
    onUpdatePassword: handlePasswordUpdateClick,
    canManageUsers: !!canManageUsers,
    currentUserId: currentUser?.id,
    confirmingUserId,
  });

  return (
    <div className="space-y-6">
      <UsersDataTable
        columns={columns}
        data={filteredUsers}
        onCreateUser={() => setCreateModalOpen(true)}
        onExportUsers={handleExportUsers}
        onFilterChange={handleFilterChange}
        onSearchChange={handleSearchChange}
        onPageChange={handlePageChange}
        canManageUsers={!!canManageUsers}
        isLoading={isLoading}
        isExporting={isExporting || false}
        pagination={
          pagination
            ? {
                currentPage: pagination.current_page - 1, // Convert 1-based to 0-based
                pageCount: pagination.total_pages,
                totalCount: pagination.total_count,
                perPage: pagination.per_page,
              }
            : undefined
        }
      />

      {/* Modals */}
      <UsersCreate
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
      />

      <UsersEdit
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setUserToEdit(null);
        }}
        user={userToEdit}
      />

      <UsersDelete
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setUserToDelete(null);
        }}
        user={userToDelete}
      />

      <UsersUpdatePassword
        isOpen={passwordModalOpen}
        onClose={() => {
          setPasswordModalOpen(false);
          setUserToUpdatePassword(null);
        }}
        user={userToUpdatePassword}
      />
    </div>
  );
}
