import { create } from "zustand";
import toast from "react-hot-toast";
import api from "../utils/api";
import type { Client, Project } from "./clientStore";

// Helper type for API errors
interface ApiError {
  response?: {
    data?: {
      error?: string;
      message?: string;
    };
  };
}

// Types
export interface InvoiceItem {
  id?: number;
  invoice_id?: number;
  description: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  payment_type?: 'unico' | 'anual' | 'mensual';
  notes?: string | null;
  sort_order?: number;
}

export interface Invoice {
  id: number;
  client_id: number;
  project_id: number | null;
  quote_id: number | null;
  recurring_service_id: number | null;
  invoice_number: string;
  issue_date: string;
  due_date: string;
  status: "pending" | "paid" | "overdue" | "voided";
  status_label: string;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  notes: string | null;
  terms_conditions: string | null;
  payment_date: string | null;
  payment_method: "transfer" | "cash" | "card" | "other" | null;
  payment_method_label: string | null;
  payment_notes: string | null;
  source_label: string;
  is_overdue: boolean;
  is_editable: boolean;
  // SRI fields (future)
  access_key: string | null;
  sri_status: string | null;
  created_at: string;
  updated_at: string;
  // Relations
  client?: Client;
  project?: Project;
  items?: InvoiceItem[];
  quote?: { id: number; quote_number: string; title?: string } | null;
  recurring_service?: { id: number; name: string } | null;
}

export interface InvoiceStats {
  pending_count: number;
  pending_total: number;
  paid_count: number;
  paid_total: number;
  overdue_count: number;
  overdue_total: number;
  voided_count: number;
}

interface Pagination {
  current_page: number;
  last_page: number;
  total: number;
  per_page: number;
}

export interface InvoiceFilters {
  client_id?: number;
  project_id?: number;
  status?: string;
}

interface CreateInvoiceItemData {
  description: string;
  quantity: number;
  unit_price: number;
  payment_type?: 'unico' | 'anual' | 'mensual';
  notes?: string;
}

interface CreateInvoiceData {
  client_id: number;
  project_id?: number | null;
  issue_date: string;
  due_date: string;
  tax_rate?: number;
  notes?: string | null;
  items: CreateInvoiceItemData[];
}

interface UpdateInvoiceData {
  issue_date?: string;
  due_date?: string;
  tax_rate?: number;
  notes?: string | null;
  items?: CreateInvoiceItemData[];
}

interface MarkAsPaidData {
  payment_method: "transfer" | "cash" | "card" | "other";
  payment_notes?: string;
}

interface InvoiceState {
  invoices: Invoice[];
  currentInvoice: Invoice | null;
  invoicesLoading: boolean;
  invoicesPagination: Pagination;
  invoiceStats: InvoiceStats | null;
  error: string | null;

  // Actions
  fetchInvoices: (
    page?: number,
    perPage?: number,
    filters?: InvoiceFilters
  ) => Promise<void>;
  fetchInvoice: (id: number) => Promise<void>;
  fetchInvoiceStats: () => Promise<void>;
  createInvoice: (data: CreateInvoiceData) => Promise<Invoice>;
  updateInvoice: (id: number, data: UpdateInvoiceData) => Promise<Invoice>;
  deleteInvoice: (id: number) => Promise<void>;
  convertFromQuote: (quoteId: number, dueDays?: number) => Promise<Invoice>;
  markAsPaid: (id: number, data: MarkAsPaidData) => Promise<Invoice>;
  voidInvoice: (id: number) => Promise<Invoice>;
  clearCurrentInvoice: () => void;
}

export const useInvoiceStore = create<InvoiceState>((set) => ({
  // Initial state
  invoices: [],
  currentInvoice: null,
  invoicesLoading: false,
  invoicesPagination: { current_page: 1, last_page: 1, total: 0, per_page: 25 },
  invoiceStats: null,
  error: null,

  // Actions
  fetchInvoices: async (page = 1, perPage = 25, filters = {}) => {
    set({ invoicesLoading: true, error: null });
    try {
      const params = new URLSearchParams({
        page: String(page),
        per_page: String(perPage),
        ...(filters.client_id && { client_id: String(filters.client_id) }),
        ...(filters.project_id && { project_id: String(filters.project_id) }),
        ...(filters.status && { status: filters.status }),
      });

      const response = await api.get(`/api/v1/invoices?${params}`);
      set({
        invoices: response.data.data,
        invoicesPagination: {
          current_page: response.data.meta.current_page,
          last_page: response.data.meta.last_page,
          total: response.data.meta.total,
          per_page: response.data.meta.per_page,
        },
        invoicesLoading: false,
      });
    } catch (error) {
      const message =
        (error as ApiError).response?.data?.message || "Error al cargar facturas";
      set({ error: message, invoicesLoading: false });
      toast.error(message);
    }
  },

  fetchInvoice: async (id: number) => {
    set({ invoicesLoading: true, error: null });
    try {
      const response = await api.get(`/api/v1/invoices/${id}`);
      set({ currentInvoice: response.data, invoicesLoading: false });
    } catch (error) {
      const message =
        (error as ApiError).response?.data?.message || "Error al cargar factura";
      set({ error: message, invoicesLoading: false });
      toast.error(message);
    }
  },

  fetchInvoiceStats: async () => {
    try {
      const response = await api.get("/api/v1/invoices/stats");
      set({ invoiceStats: response.data });
    } catch (error) {
      console.error("Error fetching invoice stats:", error);
    }
  },

  createInvoice: async (data: CreateInvoiceData) => {
    set({ invoicesLoading: true, error: null });
    try {
      const response = await api.post("/api/v1/invoices", data);
      toast.success("Factura creada exitosamente");
      set({ invoicesLoading: false });
      return response.data;
    } catch (error) {
      const message =
        (error as ApiError).response?.data?.message || "Error al crear factura";
      set({ error: message, invoicesLoading: false });
      toast.error(message);
      throw error;
    }
  },

  updateInvoice: async (id: number, data: UpdateInvoiceData) => {
    set({ invoicesLoading: true, error: null });
    try {
      const response = await api.put(`/api/v1/invoices/${id}`, data);
      set((state) => ({
        invoices: state.invoices.map((inv) =>
          inv.id === id ? response.data : inv
        ),
        currentInvoice:
          state.currentInvoice?.id === id ? response.data : state.currentInvoice,
        invoicesLoading: false,
      }));
      toast.success("Factura actualizada exitosamente");
      return response.data;
    } catch (error) {
      const message =
        (error as ApiError).response?.data?.message ||
        "Error al actualizar factura";
      set({ error: message, invoicesLoading: false });
      toast.error(message);
      throw error;
    }
  },

  deleteInvoice: async (id: number) => {
    set({ invoicesLoading: true, error: null });
    try {
      await api.delete(`/api/v1/invoices/${id}`);
      set((state) => ({
        invoices: state.invoices.filter((inv) => inv.id !== id),
        invoicesLoading: false,
      }));
      toast.success("Factura eliminada exitosamente");
    } catch (error) {
      const message =
        (error as ApiError).response?.data?.message ||
        "Error al eliminar factura";
      set({ error: message, invoicesLoading: false });
      toast.error(message);
      throw error;
    }
  },

  convertFromQuote: async (quoteId: number, dueDays = 30) => {
    set({ invoicesLoading: true, error: null });
    try {
      const response = await api.post("/api/v1/invoices/from-quote", {
        quote_id: quoteId,
        due_days: dueDays,
      });
      toast.success("Factura creada desde cotización");
      set({ invoicesLoading: false });
      return response.data;
    } catch (error) {
      const message =
        (error as ApiError).response?.data?.message ||
        "Error al convertir cotización a factura";
      set({ error: message, invoicesLoading: false });
      toast.error(message);
      throw error;
    }
  },

  markAsPaid: async (id: number, data: MarkAsPaidData) => {
    set({ invoicesLoading: true, error: null });
    try {
      const response = await api.post(`/api/v1/invoices/${id}/mark-paid`, data);
      set((state) => ({
        invoices: state.invoices.map((inv) =>
          inv.id === id ? response.data : inv
        ),
        currentInvoice:
          state.currentInvoice?.id === id ? response.data : state.currentInvoice,
        invoicesLoading: false,
      }));
      toast.success("Factura marcada como pagada");
      return response.data;
    } catch (error) {
      const message =
        (error as ApiError).response?.data?.message ||
        "Error al marcar factura como pagada";
      set({ error: message, invoicesLoading: false });
      toast.error(message);
      throw error;
    }
  },

  voidInvoice: async (id: number) => {
    set({ invoicesLoading: true, error: null });
    try {
      const response = await api.post(`/api/v1/invoices/${id}/void`);
      set((state) => ({
        invoices: state.invoices.map((inv) =>
          inv.id === id ? response.data : inv
        ),
        currentInvoice:
          state.currentInvoice?.id === id ? response.data : state.currentInvoice,
        invoicesLoading: false,
      }));
      toast.success("Factura anulada exitosamente");
      return response.data;
    } catch (error) {
      const message =
        (error as ApiError).response?.data?.message || "Error al anular factura";
      set({ error: message, invoicesLoading: false });
      toast.error(message);
      throw error;
    }
  },

  clearCurrentInvoice: () => {
    set({ currentInvoice: null });
  },
}));
