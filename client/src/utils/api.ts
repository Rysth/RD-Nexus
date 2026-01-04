import axios from "axios";
import toast from "react-hot-toast";

// Create a single axios instance for the entire app
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "",
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  withCredentials: true,
});

// Add a request interceptor to add auth token to every request
api.interceptors.request.use(
  (config) => {
    // Get auth data from storage
    const authStorage = localStorage.getItem("auth-storage");
    if (authStorage) {
      try {
        const authData = JSON.parse(authStorage);
        if (authData.state?.user) {
          // We're authenticated, so get the token from localStorage
          const token = localStorage.getItem("access_token");
          if (token) {
            // Set the auth header
            config.headers.Authorization = `Bearer ${token}`;
          }
        }
      } catch (error) {
        console.error("Error parsing auth data:", error);
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle common errors
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const url: string = err?.config?.url || "";

    const allow401 = [
      "/api/v1/verify-account",
      "/api/v1/verify-account-resend",
      "/api/v1/reset-password",
      "/api/v1/reset-password-request",
      "/api/v1/create-account",
    ];

    const isAllowed401 =
      err.response?.status === 401 &&
      allow401.some(
        (p) => url.endsWith(p) || url.includes(`${p}?`) || url.includes(p)
      );

    if (isAllowed401) {
      return Promise.reject(err);
    }

    // Handle unauthorized access
    if (err.response?.status === 401) {
      console.log("Unauthorized access detected");

      // Clear auth data if not on login page
      if (!window.location.pathname.includes("/auth/signin")) {
        // Show toast message before redirecting
        toast.error(
          "Tu sesión ha expirado o no tienes permisos. Por favor, inicia sesión de nuevo."
        );
        localStorage.removeItem("auth-storage");
        localStorage.removeItem("access_token"); // Changed from sessionStorage to localStorage
        window.location.href = "/auth/signin";
      }
    }

    // Handle other errors if needed
    // Example: Show a generic error toast for other server errors
    else if (err.response?.status >= 500) {
      toast.error(
        "Ocurrió un error en el servidor. Inténtalo de nuevo más tarde."
      );
    }

    return Promise.reject(err);
  }
);

// Helper functions for token management
export const saveToken = (token: string, tokenType: string = "Bearer") => {
  // Store token in localStorage instead of sessionStorage for cross-tab persistence
  localStorage.setItem("access_token", token);
  api.defaults.headers.common["Authorization"] = `${tokenType} ${token}`;
};

export const clearToken = () => {
  localStorage.removeItem("access_token");
  delete api.defaults.headers.common["Authorization"];
};

export default api;
