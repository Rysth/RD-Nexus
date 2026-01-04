import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Toast } from "toastify-react-native";
import type { User, SignUpForm, SignInForm } from "../types/auth";
import api, { clearToken } from "../utils/api";
import { handleOtpError, type OtpError } from "../utils/otpErrorHandler";
import { ToastNotifications } from "../utils/toastNotifications";
import { navigateAfterAuth } from "../navigation/navigation";

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isLoadingUserInfo: boolean;
  error: string | null;
  // OTP state properties
  isOtpRequired: boolean;
  otpEmail: string | null;
  isOtpSuccess: boolean;
  // Enhanced error handling
  otpError: OtpError | null;
  retryCount: number;
  register: (data: SignUpForm) => Promise<void>;
  login: (data: SignInForm) => Promise<void>;
  logout: () => Promise<void>;
  clearSession: () => void;
  fetchUserInfo: () => Promise<void>;
  resendConfirmation: (email: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (
    token: string,
    password: string,
    passwordConfirm: string
  ) => Promise<void>;
  verifyEmail: (token: string) => Promise<void>;
  // OTP actions
  setOtpRequired: (required: boolean, email?: string) => void;
  clearOtpState: () => void;
  verifyOtp: (code: string) => Promise<void>;
  resendOtp: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: false,
      isLoadingUserInfo: false,
      error: null,
      // OTP state initialization
      isOtpRequired: false,
      otpEmail: null,
      isOtpSuccess: false,
      // Enhanced error handling
      otpError: null,
      retryCount: 0,

      register: async (data) => {
        set({ isLoading: true, error: null });
        try {
          await api.post("/api/v1/create-account", {
            email: data.email,
            password: data.password,
            "password-confirm": data.passwordConfirmation,
            fullname: data.fullName,
            username: data.username,
          });
          set({ user: null, isLoading: false });
          Toast.success("Cuenta creada exitosamente", "top");
        } catch (error: any) {
          let errorMessage = "Error al registrar la cuenta";

          if (error.response?.status === 422) {
            const responseText = error.response?.data || "";

            if (typeof responseText === "string") {
              if (
                responseText.includes(
                  "Ya existe una cuenta con este correo electrónico"
                )
              ) {
                errorMessage =
                  "Ya existe una cuenta con este correo electrónico";
              } else if (
                responseText.includes("Este nombre de usuario ya está en uso")
              ) {
                errorMessage = "Este nombre de usuario ya está en uso";
              } else if (
                responseText.includes("Las contraseñas no coinciden")
              ) {
                errorMessage = "Las contraseñas no coinciden";
              } else if (
                responseText.includes("La contraseña debe tener al menos")
              ) {
                errorMessage = "La contraseña debe tener al menos 8 caracteres";
              }
            }
          } else if (error.response?.status >= 500) {
            errorMessage =
              "Error del servidor. Intenta nuevamente en unos momentos";
          } else if (!error.response) {
            errorMessage = "Sin conexión. Verifica tu conexión a internet";
          }

          set({ error: errorMessage, isLoading: false });
          Toast.error(errorMessage, "top");
          throw new Error(errorMessage);
        }
      },

      login: async (data) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.post(
            "/api/v1/login",
            {
              email: data.email,
              password: data.password,
            },
            { withCredentials: true }
          );

          // Check if OTP is required (partial authentication)
          if (response.data?.otp_required) {
            set({
              isLoading: false,
              isOtpRequired: true,
              otpEmail: data.email,
            });
            return;
          }

          await get().fetchUserInfo();
          set({ isLoading: false });
          Toast.success("Sesión iniciada correctamente", "top");
        } catch (error: any) {
          let errorMessage = "Error al iniciar sesión";

          if (error.response?.status === 401) {
            errorMessage =
              "Credenciales incorrectas. Verifica que tu correo electrónico y contraseña sean correctos";
          } else if (error.response?.status === 403) {
            errorMessage =
              "Tu cuenta no está verificada. Revisa tu correo electrónico y activa tu cuenta.";
          } else if (error.response?.status === 422) {
            const responseText = error.response?.data || "";
            if (typeof responseText === "string") {
              if (responseText.includes("email")) {
                errorMessage = "El formato del correo electrónico no es válido";
              } else if (responseText.includes("password")) {
                errorMessage = "La contraseña es requerida";
              }
            }
          } else if (error.response?.status >= 500) {
            errorMessage =
              "Error del servidor. Intenta nuevamente en unos momentos";
          } else if (!error.response) {
            errorMessage = "Sin conexión. Verifica tu conexión a internet";
          }

          set({ error: errorMessage, isLoading: false });
          Toast.error(errorMessage, "top");
          throw new Error(errorMessage);
        }
      },

      fetchUserInfo: async () => {
        set({ isLoadingUserInfo: true });
        try {
          const response = await api.get("/api/v1/me", {
            withCredentials: true,
          });
          set({ user: response.data.user, isLoadingUserInfo: false });
        } catch (error: any) {
          console.error("Failed to fetch user info:", error);
          set({ user: null, isLoadingUserInfo: false });
        }
      },

      logout: async () => {
        set({ isLoading: true });
        try {
          await api.post("/api/v1/logout", {}, { withCredentials: true });
          await clearToken();
          set({
            user: null,
            isLoading: false,
            error: null,
            isOtpRequired: false,
            otpEmail: null,
            isOtpSuccess: false,
            otpError: null,
            retryCount: 0,
          });
          Toast.success("Sesión cerrada correctamente", "top");
        } catch (error: any) {
          console.error("Logout error:", error);
          // Even if logout fails on server, clear local state
          await clearToken();
          set({
            user: null,
            isLoading: false,
            error: null,
            isOtpRequired: false,
            otpEmail: null,
            isOtpSuccess: false,
            otpError: null,
            retryCount: 0,
          });
          Toast.error("Error al cerrar sesión", "top");
          throw error;
        }
      },

      clearSession: () => {
        set({
          user: null,
          isLoading: false,
          error: null,
          isOtpRequired: false,
          otpEmail: null,
          isOtpSuccess: false,
          otpError: null,
          retryCount: 0,
        });
        clearToken();
      },

      resendConfirmation: async (email: string) => {
        set({ isLoading: true, error: null });
        try {
          await api.post(
            "/api/v1/verify-account-resend",
            { email },
            { withCredentials: true }
          );
          set({ isLoading: false });
          Toast.success("Correo de confirmación enviado", "top");
        } catch (error: any) {
          let errorMessage = "Error al enviar el correo de confirmación";

          if (error.response?.status === 401) {
            errorMessage = "Esta cuenta ya está verificada o no existe.";
          } else if (error.response?.status === 429) {
            errorMessage =
              "Se ha enviado un correo recientemente. Por favor, espera antes de solicitar otro.";
          } else if (error.response?.status >= 500) {
            errorMessage =
              "Error del servidor. Intenta nuevamente en unos momentos";
          } else if (!error.response) {
            errorMessage = "Sin conexión. Verifica tu conexión a internet";
          }

          set({ error: errorMessage, isLoading: false });
          Toast.error(errorMessage, "top");
          throw new Error(errorMessage);
        }
      },

      forgotPassword: async (email: string) => {
        set({ isLoading: true, error: null });
        try {
          await api.post(
            "/api/v1/reset-password-request",
            { email },
            { withCredentials: true }
          );
          set({ isLoading: false });
          Toast.success(
            "Si tu correo existe, recibirás instrucciones para restablecer tu contraseña",
            "top"
          );
        } catch (error: any) {
          let errorMessage =
            "Error al solicitar restablecimiento de contraseña";

          if (error.response?.status >= 500) {
            errorMessage =
              "Error del servidor. Intenta nuevamente en unos momentos";
          } else if (!error.response) {
            errorMessage = "Sin conexión. Verifica tu conexión a internet";
          }

          set({ error: errorMessage, isLoading: false });
          Toast.error(errorMessage, "top");
          throw new Error(errorMessage);
        }
      },

      resetPassword: async (
        token: string,
        password: string,
        passwordConfirm: string
      ) => {
        set({ isLoading: true, error: null });
        try {
          await api.post(
            "/api/v1/reset-password",
            {
              key: token,
              password,
              "password-confirm": passwordConfirm,
            },
            { withCredentials: true }
          );
          set({ isLoading: false });
          Toast.success("Contraseña restablecida exitosamente", "top");
        } catch (error: any) {
          let errorMessage = "Error al restablecer la contraseña";

          if (error.response?.status === 401) {
            errorMessage = "El enlace es inválido o ha expirado";
          } else if (error.response?.status === 422) {
            errorMessage =
              "Las contraseñas no coinciden o no cumplen los requisitos";
          } else if (error.response?.status >= 500) {
            errorMessage =
              "Error del servidor. Intenta nuevamente en unos momentos";
          } else if (!error.response) {
            errorMessage = "Sin conexión. Verifica tu conexión a internet";
          }

          set({ error: errorMessage, isLoading: false });
          Toast.error(errorMessage, "top");
          throw new Error(errorMessage);
        }
      },

      verifyEmail: async (token: string) => {
        set({ isLoading: true, error: null });
        try {
          await api.post(
            "/api/v1/verify-account",
            { key: token },
            { withCredentials: true }
          );
          set({ isLoading: false });
          Toast.success("¡Correo verificado exitosamente!", "top");
        } catch (error: any) {
          let errorMessage = "Error al verificar el correo";

          if (error.response?.status === 401) {
            errorMessage = "Ya haz verificado tu correo o el token es inválido";
          } else if (error.response?.status >= 500) {
            errorMessage =
              "Error del servidor. Intenta nuevamente en unos momentos";
          } else if (!error.response) {
            errorMessage = "Sin conexión. Verifica tu conexión a internet";
          }

          set({ error: errorMessage, isLoading: false });
          Toast.error(errorMessage, "top");
          throw new Error(errorMessage);
        }
      },

      // OTP-specific functions
      setOtpRequired: (required: boolean, email?: string) => {
        set({
          isOtpRequired: required,
          otpEmail: email || null,
          isOtpSuccess: false,
          otpError: null,
          error: null,
          retryCount: 0,
        });
      },

      // Clear OTP state - used for navigation cleanup
      clearOtpState: () => {
        set({
          isOtpRequired: false,
          otpEmail: null,
          isOtpSuccess: false,
          otpError: null,
          error: null,
          retryCount: 0,
        });
      },

      verifyOtp: async (code: string) => {
        const currentRetryCount = get().retryCount;
        set({
          isLoading: true,
          error: null,
          otpError: null,
          retryCount: currentRetryCount + 1,
        });

        // Retry mechanism for network failures
        const maxRetries = 2;
        let lastError: any = null;

        for (let attempt = 0; attempt < maxRetries; attempt++) {
          try {
            const response = await api.post(
              "/api/v1/auth/verify_otp",
              {
                code: code,
              },
              { withCredentials: true }
            );

            // Check for success response
            if (response.data.success) {
              // Set success state first
              set({
                isOtpSuccess: true,
                error: null,
                otpError: null,
                retryCount: 0,
              });

              // Add a small delay for better UX
              await new Promise((resolve) => setTimeout(resolve, 1200));

              // Fetch user info after successful OTP verification
              await get().fetchUserInfo();
              set({
                isLoading: false,
                isOtpRequired: false,
                otpEmail: null,
                error: null,
                otpError: null,
                isOtpSuccess: false,
                retryCount: 0,
              });
              ToastNotifications.otpSuccess("verify");
              return; // Success, exit function
            }
          } catch (error: any) {
            lastError = error;

            // Don't retry for client errors (4xx) - only for network/server errors
            if (error.response?.status && error.response.status < 500) {
              break; // Exit retry loop for client errors
            }

            // Wait before retrying (exponential backoff)
            if (attempt < maxRetries - 1) {
              await new Promise((resolve) =>
                setTimeout(resolve, 1000 * (attempt + 1))
              );
            }
          }
        }

        // Handle the error after all retries using enhanced error handler
        const otpError = handleOtpError(lastError, {
          showToast: true,
          operation: "verify",
        });

        set({
          error: otpError.message,
          otpError: otpError,
          isLoading: false,
          isOtpSuccess: false,
        });

        throw new Error(otpError.message);
      },

      resendOtp: async () => {
        set({ isLoading: true, error: null, otpError: null });

        // Retry mechanism for network failures
        const maxRetries = 2;
        let lastError: any = null;

        for (let attempt = 0; attempt < maxRetries; attempt++) {
          try {
            const response = await api.post(
              "/api/v1/auth/send_otp",
              {},
              { withCredentials: true }
            );

            // Check for success response
            if (response.data.success) {
              set({
                isLoading: false,
                error: null,
                otpError: null,
                retryCount: 0,
              });
              ToastNotifications.otpSuccess("resend");
              return; // Success, exit function
            }
          } catch (error: any) {
            lastError = error;

            // Don't retry for client errors (4xx) - only for network/server errors
            if (error.response?.status && error.response.status < 500) {
              break; // Exit retry loop for client errors
            }

            // Wait before retrying (exponential backoff)
            if (attempt < maxRetries - 1) {
              await new Promise((resolve) =>
                setTimeout(resolve, 1000 * (attempt + 1))
              );
            }
          }
        }

        // Handle the error after all retries using enhanced error handler
        const otpError = handleOtpError(lastError, {
          showToast: true,
          operation: "resend",
        });

        set({
          error: otpError.message,
          otpError: otpError,
          isLoading: false,
        });

        throw new Error(otpError.message);
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state: AuthState) => ({
        user: state.user,
      }),
    }
  )
);
