import { create } from "zustand";
import api from "../utils/api";

// Types
export interface Client {
  id: number;
  name: string;
  identification_type: string;
  identification_type_label: string;
  identification: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: number;
  client_id: number;
  name: string;
  production_url: string | null;
  start_date: string | null;
  status: "active" | "maintenance" | "canceled";
  status_label: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  client?: Client;
}

interface Pagination {
  current_page: number;
  last_page: number;
  total: number;
  per_page: number;
}

interface ClientFilters {
  search?: string;
  sort_by?: string;
  sort_order?: string;
}

interface ProjectFilters {
  search?: string;
  client_id?: number;
  status?: string;
  sort_by?: string;
  sort_order?: string;
}

interface CreateClientData {
  name: string;
  identification_type: string;
  identification: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
}

interface UpdateClientData {
  name?: string;
  identification_type?: string;
  identification?: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  notes?: string | null;
}

interface CreateProjectData {
  client_id: number;
  name: string;
  production_url?: string;
  start_date?: string;
  status?: "active" | "maintenance" | "canceled";
  description?: string;
}

interface UpdateProjectData {
  client_id?: number;
  name?: string;
  production_url?: string | null;
  start_date?: string | null;
  status?: "active" | "maintenance" | "canceled";
  description?: string | null;
}

interface ClientState {
  // Clients
  clients: Client[];
  currentClient: (Client & { projects: Project[] }) | null;
  clientsLoading: boolean;
  clientsExporting: boolean;
  clientsPagination: Pagination;
  
  // Projects
  projects: Project[];
  currentProject: (Project & { client: Client }) | null;
  projectsLoading: boolean;
  projectsPagination: Pagination;
  
  error: string | null;
  
  // Client actions
  fetchClients: (page?: number, perPage?: number, filters?: ClientFilters) => Promise<void>;
  fetchClient: (id: number) => Promise<void>;
  createClient: (data: CreateClientData) => Promise<Client>;
  updateClient: (id: number, data: UpdateClientData) => Promise<Client>;
  deleteClient: (id: number) => Promise<void>;
  exportClients: (filters?: ClientFilters) => Promise<void>;
  
  // Project actions
  fetchProjects: (page?: number, perPage?: number, filters?: ProjectFilters) => Promise<void>;
  fetchProject: (id: number) => Promise<void>;
  createProject: (data: CreateProjectData) => Promise<Project>;
  updateProject: (id: number, data: UpdateProjectData) => Promise<Project>;
  deleteProject: (id: number) => Promise<void>;
  fetchProjectsByClient: (clientId: number, page?: number, perPage?: number) => Promise<void>;
}

export const useClientStore = create<ClientState>((set) => ({
  // Initial state
  clients: [],
  currentClient: null,
  clientsLoading: false,
  clientsExporting: false,
  clientsPagination: { current_page: 1, last_page: 1, total: 0, per_page: 25 },
  
  projects: [],
  currentProject: null,
  projectsLoading: false,
  projectsPagination: { current_page: 1, last_page: 1, total: 0, per_page: 25 },
  
  error: null,

  // Client actions
  fetchClients: async (page = 1, perPage = 25, filters = {}) => {
    set({ clientsLoading: true, error: null });
    try {
      const params = new URLSearchParams({
        page: String(page),
        per_page: String(perPage),
        ...(filters.search && { search: filters.search }),
        ...(filters.sort_by && { sort_by: filters.sort_by }),
        ...(filters.sort_order && { sort_order: filters.sort_order }),
      });
      
      const response = await api.get(`/api/v1/clients?${params}`);
      set({
        clients: response.data.data,
        clientsPagination: {
          current_page: response.data.meta.current_page,
          last_page: response.data.meta.last_page,
          total: response.data.meta.total,
          per_page: response.data.meta.per_page,
        },
        clientsLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.error || "Error al cargar clientes",
        clientsLoading: false,
      });
      throw error;
    }
  },

  fetchClient: async (id: number) => {
    set({ clientsLoading: true, error: null });
    try {
      const response = await api.get(`/api/v1/clients/${id}`);
      set({ currentClient: response.data, clientsLoading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.error || "Error al cargar cliente",
        clientsLoading: false,
      });
      throw error;
    }
  },

  createClient: async (data: CreateClientData) => {
    set({ clientsLoading: true, error: null });
    try {
      const response = await api.post("/api/v1/clients", data);
      set((state) => ({
        clients: [response.data, ...state.clients],
        clientsLoading: false,
      }));
      return response.data;
    } catch (error: any) {
      set({
        error: error.response?.data?.error || "Error al crear cliente",
        clientsLoading: false,
      });
      throw error;
    }
  },

  updateClient: async (id: number, data: UpdateClientData) => {
    set({ clientsLoading: true, error: null });
    try {
      const response = await api.put(`/api/v1/clients/${id}`, data);
      set((state) => ({
        clients: state.clients.map((c) => (c.id === id ? response.data : c)),
        currentClient: state.currentClient?.id === id 
          ? { ...state.currentClient, ...response.data }
          : state.currentClient,
        clientsLoading: false,
      }));
      return response.data;
    } catch (error: any) {
      set({
        error: error.response?.data?.error || "Error al actualizar cliente",
        clientsLoading: false,
      });
      throw error;
    }
  },

  deleteClient: async (id: number) => {
    set({ clientsLoading: true, error: null });
    try {
      await api.delete(`/api/v1/clients/${id}`);
      set((state) => ({
        clients: state.clients.filter((c) => c.id !== id),
        clientsLoading: false,
      }));
    } catch (error: any) {
      set({
        error: error.response?.data?.error || "Error al eliminar cliente",
        clientsLoading: false,
      });
      throw error;
    }
  },

  exportClients: async (filters = {}) => {
    set({ clientsExporting: true, error: null });
    try {
      const params: Record<string, string> = {};

      if (filters.search) {
        params.search = filters.search;
      }

      const response = await api.get("/api/v1/clients/export", {
        params,
        responseType: "blob",
      });

      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, -5);
      link.setAttribute("download", `clientes_${timestamp}.xlsx`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      set({ clientsExporting: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.error || "Error al exportar clientes",
        clientsExporting: false,
      });
      throw error;
    }
  },

  // Project actions
  fetchProjects: async (page = 1, perPage = 25, filters = {}) => {
    set({ projectsLoading: true, error: null });
    try {
      const params = new URLSearchParams({
        page: String(page),
        per_page: String(perPage),
        ...(filters.search && { search: filters.search }),
        ...(filters.client_id && { client_id: String(filters.client_id) }),
        ...(filters.status && { status: filters.status }),
        ...(filters.sort_by && { sort_by: filters.sort_by }),
        ...(filters.sort_order && { sort_order: filters.sort_order }),
      });
      
      const response = await api.get(`/api/v1/projects?${params}`);
      set({
        projects: response.data.data,
        projectsPagination: {
          current_page: response.data.meta.current_page,
          last_page: response.data.meta.last_page,
          total: response.data.meta.total,
          per_page: response.data.meta.per_page,
        },
        projectsLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.error || "Error al cargar proyectos",
        projectsLoading: false,
      });
      throw error;
    }
  },

  fetchProject: async (id: number) => {
    set({ projectsLoading: true, error: null });
    try {
      const response = await api.get(`/api/v1/projects/${id}`);
      set({ currentProject: response.data, projectsLoading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.error || "Error al cargar proyecto",
        projectsLoading: false,
      });
      throw error;
    }
  },

  createProject: async (data: CreateProjectData) => {
    set({ projectsLoading: true, error: null });
    try {
      const response = await api.post("/api/v1/projects", data);
      set((state) => ({
        projects: [response.data, ...state.projects],
        projectsLoading: false,
      }));
      return response.data;
    } catch (error: any) {
      set({
        error: error.response?.data?.error || "Error al crear proyecto",
        projectsLoading: false,
      });
      throw error;
    }
  },

  updateProject: async (id: number, data: UpdateProjectData) => {
    set({ projectsLoading: true, error: null });
    try {
      const response = await api.put(`/api/v1/projects/${id}`, data);
      set((state) => ({
        projects: state.projects.map((p) => (p.id === id ? response.data : p)),
        currentProject: state.currentProject?.id === id ? response.data : state.currentProject,
        projectsLoading: false,
      }));
      return response.data;
    } catch (error: any) {
      set({
        error: error.response?.data?.error || "Error al actualizar proyecto",
        projectsLoading: false,
      });
      throw error;
    }
  },

  deleteProject: async (id: number) => {
    set({ projectsLoading: true, error: null });
    try {
      await api.delete(`/api/v1/projects/${id}`);
      set((state) => ({
        projects: state.projects.filter((p) => p.id !== id),
        projectsLoading: false,
      }));
    } catch (error: any) {
      set({
        error: error.response?.data?.error || "Error al eliminar proyecto",
        projectsLoading: false,
      });
      throw error;
    }
  },

  fetchProjectsByClient: async (clientId: number, page = 1, perPage = 25) => {
    set({ projectsLoading: true, error: null });
    try {
      const params = new URLSearchParams({
        page: String(page),
        per_page: String(perPage),
      });
      
      const response = await api.get(`/api/v1/clients/${clientId}/projects?${params}`);
      set({
        projects: response.data.data,
        projectsPagination: {
          current_page: response.data.meta.current_page,
          last_page: response.data.meta.last_page,
          total: response.data.meta.total,
          per_page: response.data.meta.per_page,
        },
        projectsLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.error || "Error al cargar proyectos del cliente",
        projectsLoading: false,
      });
      throw error;
    }
  },
}));
