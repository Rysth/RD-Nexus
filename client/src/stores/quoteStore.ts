import { create } from "zustand";
import api from "../utils/api";
import type { Client, Project } from "./clientStore";

// Helper type for API errors
interface ApiError {
  response?: {
    data?: {
      error?: string;
    };
  };
}

// Types
export interface QuoteItem {
  id?: number;
  quote_id?: number;
  description: string;
  quantity: number;
  unit_price: number;
  discount_percent: number;
  subtotal: number;
  notes?: string | null;
  sort_order?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Quote {
  id: number;
  project_id: number | null;
  client_id: number;
  quote_number: string;
  title: string;
  description: string | null;
  issue_date: string;
  valid_until: string;
  status: "draft" | "sent" | "approved" | "rejected";
  status_label: string;
  subtotal: number;
  discount_percent: number;
  discount_amount: number;
  tax_rate: number;
  tax_percent?: number; // legacy naming kept for backwards compatibility
  tax_amount: number;
  total: number;
  terms_conditions: string | null;
  notes: string | null;
  is_editable: boolean;
  is_expired: boolean;
  created_at: string;
  updated_at: string;
  client?: Client;
  project?: Project;
  items?: QuoteItem[];
}

interface Pagination {
  current_page: number;
  last_page: number;
  total: number;
  per_page: number;
}

export interface QuoteFilters {
  client_id?: number;
  project_id?: number;
  status?: string;
}

interface CreateQuoteItemData {
  description: string;
  quantity: number;
  unit_price: number;
  discount_percent?: number;
  notes?: string;
}

interface CreateQuoteData {
  client_id: number;
  project_id?: number | null;
  title: string;
  description?: string | null;
  issue_date: string;
  valid_until: string;
  discount_percent?: number;
  tax_rate?: number;
  terms_conditions?: string | null;
  notes?: string | null;
  items: CreateQuoteItemData[];
}

interface UpdateQuoteData {
  client_id?: number;
  project_id?: number | null;
  title?: string;
  description?: string | null;
  issue_date?: string;
  valid_until?: string;
  status?: "draft" | "sent" | "approved" | "rejected";
  discount_percent?: number;
  tax_rate?: number;
  terms_conditions?: string | null;
  notes?: string | null;
  items?: CreateQuoteItemData[];
}

interface QuoteState {
  quotes: Quote[];
  currentQuote: Quote | null;
  quotesLoading: boolean;
  quotesPagination: Pagination;
  error: string | null;

  // Actions
  fetchQuotes: (page?: number, perPage?: number, filters?: QuoteFilters) => Promise<void>;
  fetchQuote: (id: number) => Promise<void>;
  createQuote: (data: CreateQuoteData) => Promise<Quote>;
  updateQuote: (id: number, data: UpdateQuoteData) => Promise<Quote>;
  deleteQuote: (id: number) => Promise<void>;
  updateQuoteStatus: (id: number, status: string) => Promise<Quote>;
  duplicateQuote: (id: number) => Promise<Quote>;
  clearCurrentQuote: () => void;
}

export const useQuoteStore = create<QuoteState>((set) => ({
  // Initial state
  quotes: [],
  currentQuote: null,
  quotesLoading: false,
  quotesPagination: { current_page: 1, last_page: 1, total: 0, per_page: 25 },
  error: null,

  // Actions
  fetchQuotes: async (page = 1, perPage = 25, filters = {}) => {
    set({ quotesLoading: true, error: null });
    try {
      const params = new URLSearchParams({
        page: String(page),
        per_page: String(perPage),
        ...(filters.client_id && { client_id: String(filters.client_id) }),
        ...(filters.project_id && { project_id: String(filters.project_id) }),
        ...(filters.status && { status: filters.status }),
      });

      const response = await api.get(`/api/v1/quotes?${params}`);
      set({
        quotes: response.data.data,
        quotesPagination: {
          current_page: response.data.meta.current_page,
          last_page: response.data.meta.last_page,
          total: response.data.meta.total,
          per_page: response.data.meta.per_page,
        },
        quotesLoading: false,
      });
    } catch (error: unknown) {
      set({
        error: (error as ApiError).response?.data?.error || "Error al cargar cotizaciones",
        quotesLoading: false,
      });
      throw error;
    }
  },

  fetchQuote: async (id: number) => {
    set({ quotesLoading: true, error: null });
    try {
      const response = await api.get(`/api/v1/quotes/${id}`);
      set({ currentQuote: response.data, quotesLoading: false });
    } catch (error: unknown) {
      set({
        error: (error as ApiError).response?.data?.error || "Error al cargar cotización",
        quotesLoading: false,
      });
      throw error;
    }
  },

  createQuote: async (data: CreateQuoteData) => {
    set({ quotesLoading: true, error: null });
    try {
      const response = await api.post("/api/v1/quotes", data);
      set((state) => ({
        quotes: [response.data, ...state.quotes],
        quotesLoading: false,
      }));
      return response.data;
    } catch (error: unknown) {
      set({
        error: (error as ApiError).response?.data?.error || "Error al crear cotización",
        quotesLoading: false,
      });
      throw error;
    }
  },

  updateQuote: async (id: number, data: UpdateQuoteData) => {
    set({ quotesLoading: true, error: null });
    try {
      const response = await api.put(`/api/v1/quotes/${id}`, data);
      set((state) => ({
        quotes: state.quotes.map((q) => (q.id === id ? response.data : q)),
        currentQuote:
          state.currentQuote?.id === id ? response.data : state.currentQuote,
        quotesLoading: false,
      }));
      return response.data;
    } catch (error: unknown) {
      set({
        error: (error as ApiError).response?.data?.error || "Error al actualizar cotización",
        quotesLoading: false,
      });
      throw error;
    }
  },

  deleteQuote: async (id: number) => {
    set({ quotesLoading: true, error: null });
    try {
      await api.delete(`/api/v1/quotes/${id}`);
      set((state) => ({
        quotes: state.quotes.filter((q) => q.id !== id),
        currentQuote: state.currentQuote?.id === id ? null : state.currentQuote,
        quotesLoading: false,
      }));
    } catch (error: unknown) {
      set({
        error: (error as ApiError).response?.data?.error || "Error al eliminar cotización",
        quotesLoading: false,
      });
      throw error;
    }
  },

  updateQuoteStatus: async (id: number, status: string) => {
    set({ quotesLoading: true, error: null });
    try {
      const response = await api.patch(`/api/v1/quotes/${id}/status`, {
        status,
      });
      set((state) => ({
        // Be defensive in case the API returns ids as strings
        quotes: state.quotes.map((q) =>
          String(q.id) === String(id) ? response.data : q
        ),
        // Be defensive in case the API returns ids as strings
        currentQuote:
          String(state.currentQuote?.id) === String(id) ? response.data : state.currentQuote,
        quotesLoading: false,
      }));
      return response.data;
    } catch (error: unknown) {
      set({
        error:
          (error as ApiError).response?.data?.error ||
          "Error al cambiar estado de cotización",
        quotesLoading: false,
      });
      throw error;
    }
  },

  duplicateQuote: async (id: number) => {
    set({ quotesLoading: true, error: null });
    try {
      const response = await api.post(`/api/v1/quotes/${id}/duplicate`);
      set((state) => ({
        quotes: [response.data, ...state.quotes],
        quotesLoading: false,
      }));
      return response.data;
    } catch (error: unknown) {
      set({
        error: (error as ApiError).response?.data?.error || "Error al duplicar cotización",
        quotesLoading: false,
      });
      throw error;
    }
  },

  clearCurrentQuote: () => {
    set({ currentQuote: null });
  },
}));
