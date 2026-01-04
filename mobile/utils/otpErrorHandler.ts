import { Toast } from "toastify-react-native";

export interface OtpError {
  type:
    | "network"
    | "validation"
    | "authentication"
    | "rate_limit"
    | "server"
    | "unknown";
  message: string;
  canRetry: boolean;
  shouldClearInput: boolean;
  suggestedAction?: string;
}

export interface ErrorHandlerOptions {
  showToast?: boolean;
  operation?: "verify" | "resend" | "send";
}

/**
 * Comprehensive error handler for OTP operations
 * Categorizes errors and provides appropriate user feedback
 */
export const handleOtpError = (
  error: any,
  options: ErrorHandlerOptions = {}
): OtpError => {
  const { showToast = true, operation = "verify" } = options;

  let otpError: OtpError = {
    type: "unknown",
    message: "Error inesperado",
    canRetry: false,
    shouldClearInput: false,
  };

  // Network errors (no response received)
  if (!error.response) {
    otpError = {
      type: "network",
      message:
        "Sin conexión a internet. Verifica tu conexión y vuelve a intentar.",
      canRetry: true,
      shouldClearInput: false,
      suggestedAction: "Verifica tu conexión a internet",
    };
  }
  // Server errors (5xx)
  else if (error.response.status >= 500) {
    otpError = {
      type: "server",
      message: "Error del servidor. Intenta nuevamente en unos momentos.",
      canRetry: true,
      shouldClearInput: false,
      suggestedAction: "Intenta nuevamente en unos minutos",
    };
  }
  // Client errors (4xx)
  else if (error.response.status >= 400) {
    const status = error.response.status;
    const responseData = error.response.data;

    switch (status) {
      case 401:
        if (operation === "verify") {
          otpError = {
            type: "authentication",
            message: "Sesión expirada. Inicia sesión nuevamente.",
            canRetry: false,
            shouldClearInput: true,
            suggestedAction: "Volver al inicio de sesión",
          };
        } else {
          otpError = {
            type: "authentication",
            message: "No autorizado. Inicia sesión nuevamente.",
            canRetry: false,
            shouldClearInput: false,
            suggestedAction: "Volver al inicio de sesión",
          };
        }
        break;

      case 404:
        otpError = {
          type: "authentication",
          message: "Cuenta no encontrada. Verifica tus credenciales.",
          canRetry: false,
          shouldClearInput: false,
          suggestedAction: "Volver al inicio de sesión",
        };
        break;

      case 422:
        // Use backend error message if available
        if (responseData?.error) {
          otpError = {
            type: "validation",
            message: responseData.error,
            canRetry: true,
            shouldClearInput: true,
          };
        } else {
          otpError = {
            type: "validation",
            message:
              operation === "verify"
                ? "Código inválido o expirado. Intenta nuevamente."
                : "Error de validación. Intenta nuevamente.",
            canRetry: true,
            shouldClearInput: operation === "verify",
          };
        }
        break;

      case 429:
        otpError = {
          type: "rate_limit",
          message:
            operation === "resend"
              ? "Se ha enviado un código recientemente. Espera antes de solicitar otro."
              : "Demasiados intentos. Espera unos minutos antes de intentar nuevamente.",
          canRetry: false,
          shouldClearInput: false,
          suggestedAction: "Espera unos minutos antes de intentar",
        };
        break;

      default:
        // Use backend error message if available
        if (responseData?.error) {
          otpError = {
            type: "validation",
            message: responseData.error,
            canRetry: true,
            shouldClearInput: operation === "verify",
          };
        } else {
          otpError = {
            type: "unknown",
            message: `Error ${status}. Intenta nuevamente.`,
            canRetry: true,
            shouldClearInput: false,
          };
        }
    }
  }

  // Show toast notification if requested
  if (showToast) {
    Toast.error(otpError.message, "top");
  }

  return otpError;
};

/**
 * Get user-friendly error message for specific OTP scenarios
 */
export const getOtpErrorMessage = (
  errorType: string,
  operation: "verify" | "resend" | "send" = "verify"
): string => {
  const errorMessages = {
    verify: {
      invalid_code:
        "El código ingresado no es válido. Verifica e intenta nuevamente.",
      expired_code: "El código ha expirado. Solicita un nuevo código.",
      too_many_attempts:
        "Demasiados intentos fallidos. Solicita un nuevo código.",
      session_expired: "Tu sesión ha expirado. Inicia sesión nuevamente.",
      network_error:
        "Error de conexión. Verifica tu internet e intenta nuevamente.",
      server_error: "Error del servidor. Intenta nuevamente en unos momentos.",
    },
    resend: {
      rate_limited:
        "Se ha enviado un código recientemente. Espera antes de solicitar otro.",
      session_expired: "Tu sesión ha expirado. Inicia sesión nuevamente.",
      network_error:
        "Error de conexión. Verifica tu internet e intenta nuevamente.",
      server_error: "Error del servidor. Intenta nuevamente en unos momentos.",
    },
    send: {
      account_not_found: "Cuenta no encontrada. Verifica tus credenciales.",
      network_error:
        "Error de conexión. Verifica tu internet e intenta nuevamente.",
      server_error: "Error del servidor. Intenta nuevamente en unos momentos.",
    },
  };

  return (
    errorMessages[operation][
      errorType as keyof (typeof errorMessages)[typeof operation]
    ] || "Error inesperado. Intenta nuevamente."
  );
};

/**
 * Determine if an error should trigger input clearing
 */
export const shouldClearOtpInput = (error: any): boolean => {
  if (!error.response) return false; // Network errors - keep input

  const status = error.response.status;

  // Clear input for validation errors (invalid/expired codes)
  if (status === 422) return true;

  // Clear input for authentication errors (session expired)
  if (status === 401) return true;

  // Don't clear for rate limiting or server errors
  return false;
};

/**
 * Determine if an operation can be retried
 */
export const canRetryOperation = (
  error: any,
  operation: "verify" | "resend" | "send" = "verify"
): boolean => {
  if (!error.response) return true; // Network errors can be retried

  const status = error.response.status;

  // Server errors can be retried
  if (status >= 500) return true;

  // Rate limiting - cannot retry immediately
  if (status === 429) return false;

  // Authentication errors - need to re-login
  if (status === 401 && operation === "verify") return false;

  // Validation errors can be retried (with new input)
  if (status === 422) return true;

  return true;
};
