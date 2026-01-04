import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import type { OtpError } from "../utils/otpErrorHandler";

interface ErrorRecoveryProps {
  error: OtpError;
  onRetry?: () => void;
  onGoBack?: () => void;
  onContactSupport?: () => void;
  className?: string;
}

export default function ErrorRecovery({
  error,
  onRetry,
  onGoBack,
  onContactSupport,
  className = "",
}: ErrorRecoveryProps) {
  const getErrorIcon = () => {
    switch (error.type) {
      case "network":
        return "wifi-outline";
      case "server":
        return "server-outline";
      case "authentication":
        return "lock-closed-outline";
      case "rate_limit":
        return "time-outline";
      case "validation":
        return "alert-circle-outline";
      default:
        return "warning-outline";
    }
  };

  const getErrorColor = () => {
    switch (error.type) {
      case "network":
        return "#F59E0B"; // amber
      case "server":
        return "#EF4444"; // red
      case "authentication":
        return "#8B5CF6"; // violet
      case "rate_limit":
        return "#06B6D4"; // cyan
      case "validation":
        return "#EF4444"; // red
      default:
        return "#6B7280"; // gray
    }
  };

  const getBackgroundColor = () => {
    switch (error.type) {
      case "network":
        return "bg-amber-50";
      case "server":
        return "bg-red-50";
      case "authentication":
        return "bg-violet-50";
      case "rate_limit":
        return "bg-cyan-50";
      case "validation":
        return "bg-red-50";
      default:
        return "bg-gray-50";
    }
  };

  return (
    <View className={`p-4 rounded-xl ${getBackgroundColor()} ${className}`}>
      {/* Error Icon and Message */}
      <View className="flex-row items-start mb-4">
        <Ionicons
          name={getErrorIcon()}
          size={24}
          color={getErrorColor()}
          className="mt-0.5"
        />
        <View className="flex-1 ml-3">
          <Text className="font-semibold text-gray-900 mb-1">
            {getErrorTitle()}
          </Text>
          <Text className="text-gray-700 text-sm leading-5">
            {error.message}
          </Text>
          {error.suggestedAction && (
            <Text className="text-gray-600 text-xs mt-2 italic">
              💡 {error.suggestedAction}
            </Text>
          )}
        </View>
      </View>

      {/* Action Buttons */}
      <View className="flex-row flex-wrap gap-2">
        {error.canRetry && onRetry && (
          <TouchableOpacity
            onPress={onRetry}
            className="flex-row items-center px-4 py-2 bg-blue-600 rounded-lg"
          >
            <Ionicons name="refresh" size={16} color="white" />
            <Text className="text-white font-medium ml-2">Reintentar</Text>
          </TouchableOpacity>
        )}

        {onGoBack && (
          <TouchableOpacity
            onPress={onGoBack}
            className="flex-row items-center px-4 py-2 bg-gray-200 rounded-lg"
          >
            <Ionicons name="arrow-back" size={16} color="#374151" />
            <Text className="text-gray-700 font-medium ml-2">Volver</Text>
          </TouchableOpacity>
        )}

        {error.type === "server" && onContactSupport && (
          <TouchableOpacity
            onPress={onContactSupport}
            className="flex-row items-center px-4 py-2 bg-green-600 rounded-lg"
          >
            <Ionicons name="help-circle" size={16} color="white" />
            <Text className="text-white font-medium ml-2">
              Contactar Soporte
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  function getErrorTitle(): string {
    switch (error.type) {
      case "network":
        return "Problema de Conexión";
      case "server":
        return "Error del Servidor";
      case "authentication":
        return "Error de Autenticación";
      case "rate_limit":
        return "Límite de Intentos";
      case "validation":
        return "Código Inválido";
      default:
        return "Error Inesperado";
    }
  }
}
