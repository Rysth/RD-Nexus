import { Toast } from "toastify-react-native";

export interface ToastOptions {
  duration?: number;
  position?: "top" | "bottom" | "center";
  style?: "success" | "error" | "warning" | "info";
}

/**
 * Enhanced toast notifications with better UX
 */
export class ToastNotifications {
  /**
   * Show success toast with appropriate messaging
   */
  static success(message: string, options: ToastOptions = {}) {
    const { duration = 3000, position = "top" } = options;
    Toast.success(message, position);
  }

  /**
   * Show error toast with enhanced error context
   */
  static error(message: string, options: ToastOptions = {}) {
    const { duration = 4000, position = "top" } = options;
    Toast.error(message, position);
  }

  /**
   * Show warning toast for non-critical issues
   */
  static warning(message: string, options: ToastOptions = {}) {
    const { duration = 3500, position = "top" } = options;
    Toast.warn(message, position);
  }

  /**
   * Show info toast for general information
   */
  static info(message: string, options: ToastOptions = {}) {
    const { duration = 3000, position = "top" } = options;
    Toast.info(message, position);
  }

  /**
   * OTP-specific success messages
   */
  static otpSuccess(operation: "verify" | "resend" | "send") {
    const messages = {
      verify: "✅ Código verificado correctamente",
      resend: "📧 Código reenviado exitosamente",
      send: "📧 Código enviado a tu correo",
    };

    this.success(messages[operation]);
  }

  /**
   * OTP-specific error messages with context
   */
  static otpError(
    operation: "verify" | "resend" | "send",
    errorType: string,
    customMessage?: string
  ) {
    if (customMessage) {
      this.error(customMessage);
      return;
    }

    const errorMessages = {
      verify: {
        network: "🌐 Sin conexión. Verifica tu internet e intenta nuevamente.",
        server: "⚠️ Error del servidor. Intenta en unos momentos.",
        validation: "❌ Código inválido o expirado. Intenta nuevamente.",
        rate_limit: "⏰ Demasiados intentos. Espera antes de continuar.",
        authentication: "🔒 Sesión expirada. Inicia sesión nuevamente.",
      },
      resend: {
        network: "🌐 Sin conexión. Verifica tu internet e intenta nuevamente.",
        server: "⚠️ Error del servidor. Intenta en unos momentos.",
        rate_limit:
          "⏰ Código enviado recientemente. Espera antes de solicitar otro.",
        authentication: "🔒 Sesión expirada. Inicia sesión nuevamente.",
      },
      send: {
        network: "🌐 Sin conexión. Verifica tu internet e intenta nuevamente.",
        server: "⚠️ Error del servidor. Intenta en unos momentos.",
        authentication:
          "🔒 Credenciales incorrectas. Verifica e intenta nuevamente.",
      },
    };

    const message =
      errorMessages[operation]?.[
        errorType as keyof (typeof errorMessages)[typeof operation]
      ] || "❌ Error inesperado. Intenta nuevamente.";

    this.error(message);
  }

  /**
   * Network-specific error with retry suggestion
   */
  static networkError(operation?: string) {
    const message = operation
      ? `🌐 Sin conexión durante ${operation}. Verifica tu internet e intenta nuevamente.`
      : "🌐 Sin conexión. Verifica tu internet e intenta nuevamente.";

    this.error(message, { duration: 5000 });
  }

  /**
   * Server error with retry suggestion
   */
  static serverError(operation?: string) {
    const message = operation
      ? `⚠️ Error del servidor durante ${operation}. Intenta en unos momentos.`
      : "⚠️ Error del servidor. Intenta en unos momentos.";

    this.error(message, { duration: 4000 });
  }

  /**
   * Authentication success with personalized message
   */
  static authSuccess(userName?: string) {
    const message = userName
      ? `¡Bienvenido, ${userName}! 🎉`
      : "¡Sesión iniciada correctamente! 🎉";

    this.success(message);
  }

  /**
   * Loading state notification (for long operations)
   */
  static loading(message: string) {
    this.info(`⏳ ${message}...`);
  }

  /**
   * Clear all toasts
   */
  static clear() {
    // Note: toastify-react-native doesn't have a clear method
    // This is a placeholder for future implementation
  }
}

// Export convenience methods
export const showSuccessToast =
  ToastNotifications.success.bind(ToastNotifications);
export const showErrorToast = ToastNotifications.error.bind(ToastNotifications);
export const showWarningToast =
  ToastNotifications.warning.bind(ToastNotifications);
export const showInfoToast = ToastNotifications.info.bind(ToastNotifications);
export const showOtpSuccessToast =
  ToastNotifications.otpSuccess.bind(ToastNotifications);
export const showOtpErrorToast =
  ToastNotifications.otpError.bind(ToastNotifications);
export const showNetworkErrorToast =
  ToastNotifications.networkError.bind(ToastNotifications);
export const showServerErrorToast =
  ToastNotifications.serverError.bind(ToastNotifications);
export const showAuthSuccessToast =
  ToastNotifications.authSuccess.bind(ToastNotifications);
