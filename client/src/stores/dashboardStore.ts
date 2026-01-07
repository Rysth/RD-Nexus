import { create } from "zustand";
import api from "../utils/api";

// Types
export interface DashboardSummary {
  clients_count: number;
  projects_count: number;
  active_projects_count: number;
  active_services_count: number;
  total_services_count: number;
}

export interface DashboardRevenue {
  mrr: number;
  arr: number;
  total_collected: number;
  pending: number;
  overdue: number;
}

export interface DashboardInvoices {
  pending_count: number;
  paid_count: number;
  overdue_count: number;
}

export interface DashboardQuotes {
  pending_count: number;
  approved_count: number;
}

export interface MonthlyRevenue {
  month: string;
  revenue: number;
  invoices: number;
}

export interface RecentInvoice {
  id: number;
  invoice_number: string;
  client_name: string;
  project_name: string | null;
  total: number;
  status: string;
  status_label: string;
  issue_date: string;
}

export interface UpcomingBilling {
  id: number;
  service_name: string;
  project_name: string;
  client_name: string;
  amount: number;
  billing_cycle: string;
  next_billing_date: string;
}

export interface DashboardStats {
  summary: DashboardSummary;
  revenue: DashboardRevenue;
  invoices: DashboardInvoices;
  quotes: DashboardQuotes;
  monthly_revenue: MonthlyRevenue[];
  recent_invoices: RecentInvoice[];
  upcoming_billing: UpcomingBilling[];
}

interface DashboardState {
  stats: DashboardStats | null;
  loading: boolean;
  error: string | null;
  lastFetched: Date | null;
  
  // Actions
  fetchStats: () => Promise<void>;
  clearStats: () => void;
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  stats: null,
  loading: false,
  error: null,
  lastFetched: null,

  fetchStats: async () => {
    // Avoid refetching if data is fresh (less than 30 seconds old)
    const { lastFetched, loading } = get();
    if (loading) return;
    if (lastFetched && Date.now() - lastFetched.getTime() < 30000) return;

    set({ loading: true, error: null });
    
    try {
      const response = await api.get("/api/v1/dashboard/stats");
      set({ 
        stats: response.data, 
        loading: false,
        lastFetched: new Date()
      });
    } catch (error: any) {
      const message = error.response?.data?.message || "Error al cargar estadísticas";
      set({ error: message, loading: false });
    }
  },

  clearStats: () => {
    set({ stats: null, lastFetched: null, error: null });
  },
}));
