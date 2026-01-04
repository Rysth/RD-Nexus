import React from "react";
import { View, Text, ActivityIndicator } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

interface LoadingIndicatorProps {
  message?: string;
  operation?: "verify" | "resend" | "login" | "loading";
  size?: "small" | "large";
  color?: string;
  showIcon?: boolean;
  className?: string;
}

export default function LoadingIndicator({
  message,
  operation = "loading",
  size = "small",
  color = "#3B82F6",
  showIcon = true,
  className = "",
}: LoadingIndicatorProps) {
  const getOperationMessage = () => {
    const messages = {
      verify: "Verificando código...",
      resend: "Reenviando código...",
      login: "Iniciando sesión...",
      loading: "Cargando...",
    };
    return message || messages[operation];
  };

  const getOperationIcon = (): keyof typeof Ionicons.glyphMap => {
    const icons = {
      verify: "checkmark-circle-outline" as const,
      resend: "refresh-outline" as const,
      login: "log-in-outline" as const,
      loading: "hourglass-outline" as const,
    };
    return icons[operation];
  };

  return (
    <View className={`flex-row items-center justify-center ${className}`}>
      <ActivityIndicator size={size} color={color} />
      {showIcon && (
        <View className="ml-2">
          <Ionicons name={getOperationIcon()} size={16} color={color} />
        </View>
      )}
      <Text className="text-gray-600 ml-2 font-medium">
        {getOperationMessage()}
      </Text>
    </View>
  );
}

// Specialized loading indicators for common operations
export const VerifyingIndicator = (
  props: Omit<LoadingIndicatorProps, "operation">
) => <LoadingIndicator {...props} operation="verify" />;

export const ResendingIndicator = (
  props: Omit<LoadingIndicatorProps, "operation">
) => <LoadingIndicator {...props} operation="resend" />;

export const LoginIndicator = (
  props: Omit<LoadingIndicatorProps, "operation">
) => <LoadingIndicator {...props} operation="login" />;
