import { router } from "expo-router";
import type { User } from "../types/auth";

// Define the roles that can access dashboard features
const DASHBOARD_ROLES = ["admin", "manager", "operator"];

// Helper function for navigation - wraps expo-router's router
export function navigate(name: string, params?: Record<string, any>) {
  try {
    // Map old route names to new expo-router paths
    const routeMap: Record<string, string> = {
      SignIn: "/auth/signin",
      SignUp: "/auth/signup",
      Confirm: "/auth/confirm",
      ForgotPassword: "/auth/forgot-password",
      ResetPassword: "/auth/reset-password",
      VerifyEmail: "/auth/verify-email",
      Main: "/",
      Home: "/",
    };

    const path = routeMap[name] || name;

    if (params) {
      router.push({ pathname: path as any, params });
    } else {
      router.push(path as any);
    }
  } catch (error) {
    console.error("Navigation error:", error);
  }
}

export function resetTo(name: string) {
  try {
    const routeMap: Record<string, string> = {
      SignIn: "/auth/signin",
      SignUp: "/auth/signup",
      Main: "/",
      Home: "/",
    };

    const path = routeMap[name] || name;
    router.replace(path as any);
  } catch (error) {
    console.error("Navigation reset error:", error);
  }
}

// Role-based navigation after successful authentication
export function navigateAfterAuth(user: User) {
  try {
    const canAccessDashboard = user.roles.some((role) =>
      DASHBOARD_ROLES.includes(role)
    );

    if (canAccessDashboard) {
      // For now, navigate to home since we don't have dashboard in mobile
      // In the future, this could navigate to a dashboard screen
      router.replace("/");
    } else {
      // Regular users go to home
      router.replace("/");
    }
  } catch (error) {
    console.error("Post-auth navigation error:", error);
    // Fallback to home
    router.replace("/");
  }
}

// Navigation with proper state cleanup
export function navigateWithCleanup(path: string, replace: boolean = false) {
  try {
    if (replace) {
      router.replace(path as any);
    } else {
      router.push(path as any);
    }
  } catch (error) {
    console.error("Navigation with cleanup error:", error);
  }
}

// Back navigation with state cleanup
export function goBackWithCleanup() {
  try {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/");
    }
  } catch (error) {
    console.error("Back navigation error:", error);
    router.replace("/");
  }
}

// Re-export router for direct use
export { router };
