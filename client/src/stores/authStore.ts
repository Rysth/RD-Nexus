import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User, SignUpForm, SignInForm } from "../types/auth";
import api, { clearToken } from "../utils/api";

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isLoadingUserInfo: boolean;
  error: string | null;
  isOtpRequired: boolean;
  otpEmail: string | null;
  isOtpSuccess: boolean;
  register: (data: SignUpForm) => Promise<void>;
  login: (data: SignInForm) => Promise<void>;
  logout: () => Promise<void>;
  resendVerification: (email: string) => Promise<void>;
  verifyEmail: (key: string) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  resetPassword: (
    key: string,
    password: string,
    passwordConfirmation: string
  ) => Promise<void>;
  clearSession: () => void;
  fetchUserInfo: () => Promise<void>;
  updateUser: (user: User) => void;
  setOtpRequired: (required: boolean, email?: string) => void;
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
      isOtpRequired: false,
      otpEmail: null,
      isOtpSuccess: false,

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
        } catch (error: any) {
          let errorMessage = "Error al registrar la cuenta";

          if (error.response?.status === 422) {
            // Handle validation errors from Rodauth
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
              } else if (
                responseText.includes("El nombre completo es requerido")
              ) {
                errorMessage = "El nombre completo es requerido";
              } else if (
                responseText.includes("El nombre de usuario es requerido")
              ) {
                errorMessage = "El nombre de usuario es requerido";
              } else if (
                responseText.includes(
                  "Solo se permiten letras, números y guiones bajos"
                )
              ) {
                errorMessage =
                  "El nombre de usuario solo puede contener letras, números y guiones bajos";
              } else if (
                responseText.includes("Formato de correo electrónico inválido")
              ) {
                errorMessage = "El formato del correo electrónico no es válido";
              } else if (responseText.includes("email")) {
                errorMessage =
                  "Problema con el correo electrónico proporcionado";
              } else if (responseText.includes("username")) {
                errorMessage =
                  "Problema con el nombre de usuario proporcionado";
              } else if (responseText.includes("password")) {
                errorMessage = "Problema con la contraseña proporcionada";
              } else if (responseText.includes("fullname")) {
                errorMessage = "El nombre completo es requerido";
              }
            }
          } else if (error.response?.status >= 500) {
            errorMessage =
              "Error del servidor. Intenta nuevamente en unos momentos";
          } else if (!error.response) {
            errorMessage = "Sin conexión. Verifica tu conexión a internet";
          }

          set({ error: errorMessage, isLoading: false });
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

          // Fetch user info after successful login
          await get().fetchUserInfo();
          set({ isLoading: false });
        } catch (error: any) {
          let errorMessage = "Error al iniciar sesión";

          const backendMessage =
            error.response?.data?.error || error.response?.data?.message;

          if (backendMessage) {
            errorMessage = backendMessage;
          }

          if (error.response?.status === 401) {
            // 401 means invalid credentials (email/password combination)
            errorMessage =
              backendMessage ||
              "Credenciales incorrectas. Verifica que tu correo electrónico y contraseña sean correctos";
          } else if (error.response?.status === 403) {
            // 403 means account exists but is not verified
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
            } else if (Array.isArray(responseText?.errors)) {
              const formattedErrors = responseText.errors
                .map((err) =>
                  typeof err === "string"
                    ? err
                    : err?.message || err?.error || null
                )
                .filter(Boolean);
              if (formattedErrors.length) {
                errorMessage = formattedErrors.join(", ");
              }
            }
          } else if (error.response?.status === 400) {
            const responseText = error.response?.data;
            if (typeof responseText === "string") {
              errorMessage = responseText;
            } else if (Array.isArray(responseText?.errors)) {
              const formattedErrors = responseText.errors
                .map((err) => {
                  const msg =
                    typeof err === "string"
                      ? err
                      : err?.message || err?.error || null;
                  // Translate common English messages to Spanish
                  if (msg) {
                    const translations: Record<string, string> = {
                      "Invalid user credentials":
                        "Credenciales incorrectas. Verifica tu correo electrónico y contraseña.",
                      "Invalid credentials":
                        "Credenciales incorrectas. Verifica tu correo electrónico y contraseña.",
                      "User not found": "Usuario no encontrado.",
                      "Account not verified":
                        "Tu cuenta no está verificada. Revisa tu correo electrónico.",
                      "Email is required": "El correo electrónico es requerido.",
                      "Password is required": "La contraseña es requerida.",
                    };
                    return translations[msg] || msg;
                  }
                  return null;
                })
                .filter(Boolean);
              if (formattedErrors.length) {
                errorMessage = formattedErrors.join(", ");
              }
            } else if (responseText?.errors?.message) {
              errorMessage = responseText.errors.message;
            }
          } else if (error.response?.status >= 500) {
            errorMessage =
              "Error del servidor. Intenta nuevamente en unos momentos";
          } else if (!error.response) {
            errorMessage = "Sin conexión. Verifica tu conexión a internet";
          }

          set({ error: errorMessage, isLoading: false });
          throw new Error(errorMessage);
        }
      },

      fetchUserInfo: async () => {
        set({ isLoadingUserInfo: true });
        try {
          // Since Rodauth doesn't have a built-in user info endpoint,
          // we'll create a simple one in our Rails app
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
          set({
            user: null,
            isLoading: false,
            isOtpRequired: false,
            otpEmail: null,
            isOtpSuccess: false,
          });
          clearToken();
        } catch (error: any) {
          set({ error: "Logout failed", isLoading: false });
          throw error;
        }
      },

      // New: resend verification email
      resendVerification: async (email) => {
        try {
          await api.post(
            "/api/v1/verify-account-resend",
            { email },
            { withCredentials: true }
          );
        } catch (error: any) {
          // Prefer backend error text; fall back to specific status handling
          const backendMessage =
            error.response?.data?.error || error.response?.data?.message;

          if (backendMessage) {
            throw new Error(backendMessage);
          }

          if (error.response?.status === 429) {
            throw new Error(
              "Se ha enviado un correo recientemente. Por favor, espera antes de solicitar otro."
            );
          }
          if (error.response?.status === 401) {
            throw new Error("Esta cuenta ya está verificada o no existe.");
          }

          throw new Error("No se pudo reenviar el correo de verificación");
        }
      },

      // New: verify email with token
      verifyEmail: async (key) => {
        try {
          await api.post(
            "/api/v1/verify-account",
            { key },
            {
              withCredentials: true,
              headers: { Accept: "application/json" },
            }
          );
        } catch (error: any) {
          throw new Error("Token inválido o ya utilizado");
        }
      },

      // New: request password reset
      requestPasswordReset: async (email) => {
        try {
          await api.post(
            "/api/v1/reset-password-request",
            { email },
            { withCredentials: true }
          );
        } catch (error: any) {
          const backendMessage =
            error.response?.data?.error || error.response?.data?.message;

          if (backendMessage) {
            throw new Error(backendMessage);
          }

          throw new Error("No se pudo solicitar el restablecimiento");
        }
      },

      // New: reset password with token
      resetPassword: async (key, password, passwordConfirmation) => {
        try {
          await api.post(
            "/api/v1/reset-password",
            {
              key,
              password,
              "password-confirm": passwordConfirmation,
            },
            { withCredentials: true }
          );
        } catch (error: any) {
          if (error.response?.status === 401) {
            throw new Error("El enlace es inválido o ha expirado");
          }
          if (error.response?.status === 422) {
            throw new Error(
              "Las contraseñas no coinciden o no cumplen los requisitos"
            );
          }
          throw new Error("Error al restablecer la contraseña");
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
        });
        clearToken();
      },

      updateUser: (user) => {
        set({ user });
      },

      setOtpRequired: (required, email) => {
        set({
          isOtpRequired: required,
          otpEmail: email || null,
          isOtpSuccess: false,
        });
      },

      verifyOtp: async (code) => {
        set({ isLoading: true, error: null });

        const email = get().otpEmail;
        if (!email) {
          set({
            error: "Email no disponible. Por favor, inicia sesión nuevamente.",
            isLoading: false,
          });
          throw new Error("Email no disponible");
        }

        // Retry mechanism for network failures
        const maxRetries = 2;
        let lastError: any = null;

        for (let attempt = 0; attempt < maxRetries; attempt++) {
          try {
            const response = await api.post(
              "/api/v1/auth/verify_otp",
              {
                email: email,
                code: code,
              },
              { withCredentials: true }
            );

            // Check for success response
            if (response.data.success) {
              // Store the access token
              if (response.data.token?.value) {
                localStorage.setItem("access_token", response.data.token.value);
              }

              // Set success state first
              set({ isOtpSuccess: true, error: null });

              // Add a small delay for better UX
              await new Promise((resolve) => setTimeout(resolve, 1200));

              // Set user data directly from response
              set({
                user: response.data.user,
                isLoading: false,
                isOtpRequired: false,
                otpEmail: null,
                error: null,
                isOtpSuccess: false,
              });
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

        // Handle the error after all retries
        const error = lastError;
        let errorMessage = "Código inválido o expirado";

        if (error.response?.data?.error) {
          // Use Spanish error message from backend
          errorMessage = error.response.data.error;
        } else if (error.response?.status === 422) {
          errorMessage = "Código inválido o expirado";
        } else if (error.response?.status === 401) {
          errorMessage =
            "Sesión expirada. Por favor, inicia sesión nuevamente.";
        } else if (error.response?.status === 400) {
          errorMessage = error.response?.data?.error || "Código es requerido";
        } else if (error.response?.status >= 500) {
          errorMessage =
            "Error del servidor. Intenta nuevamente en unos momentos.";
        } else if (!error.response) {
          errorMessage =
            "Sin conexión. Verifica tu conexión a internet y vuelve a intentar.";
        }

        set({
          error: errorMessage,
          isLoading: false,
          isOtpSuccess: false,
        });

        throw new Error(errorMessage);
      },

      resendOtp: async () => {
        set({ isLoading: true, error: null });

        const email = get().otpEmail;
        if (!email) {
          set({
            error: "Email no disponible. Por favor, inicia sesión nuevamente.",
            isLoading: false,
          });
          throw new Error("Email no disponible");
        }

        // Retry mechanism for network failures
        const maxRetries = 2;
        let lastError: any = null;

        for (let attempt = 0; attempt < maxRetries; attempt++) {
          try {
            const response = await api.post(
              "/api/v1/auth/send_otp",
              {
                email: email,
              },
              { withCredentials: true }
            );

            // Check for success response
            if (response.data.success) {
              set({ isLoading: false, error: null });
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

        // Handle the error after all retries
        const error = lastError;
        let errorMessage = "No se pudo reenviar el código";

        if (error.response?.data?.error) {
          // Use Spanish error message from backend
          errorMessage = error.response.data.error;
        } else if (error.response?.data?.message) {
          // Use Spanish message from backend
          errorMessage = error.response.data.message;
        } else if (error.response?.status === 401) {
          errorMessage =
            "Sesión expirada. Por favor, inicia sesión nuevamente.";
        } else if (error.response?.status === 404) {
          errorMessage = "Usuario no encontrado";
        } else if (error.response?.status >= 500) {
          errorMessage =
            "Error del servidor. Intenta nuevamente en unos momentos.";
        } else if (!error.response) {
          errorMessage =
            "Sin conexión. Verifica tu conexión a internet y vuelve a intentar.";
        }

        set({ error: errorMessage, isLoading: false });

        throw new Error(errorMessage);
      },
    }),
    {
      name: "auth-storage",
      partialize: (state: AuthState) => ({
        user: state.user,
      }),
    }
  )
);
