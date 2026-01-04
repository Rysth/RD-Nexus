import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Clipboard,
  Alert,
  ActivityIndicator,
  Animated,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { shouldClearOtpInput } from "../utils/otpErrorHandler";
import LoadingIndicator from "./LoadingIndicator";

interface OtpInputProps {
  onSubmit: (code: string) => void;
  onResend: () => void;
  onBack: () => void;
  isLoading: boolean;
  error: string | null;
  email: string;
  isSuccess?: boolean;
  expirationTime?: number; // in seconds, default 300 (5 minutes)
  resendCooldown?: number; // in seconds, default 60
  canRetry?: boolean;
  shouldClearInput?: boolean;
  retryCount?: number;
}

export default function OtpInput({
  onSubmit,
  onResend,
  onBack,
  isLoading,
  error,
  email,
  isSuccess = false,
  expirationTime = 300,
  resendCooldown = 60,
  canRetry = true,
  shouldClearInput = false,
  retryCount = 0,
}: OtpInputProps) {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [timeLeft, setTimeLeft] = useState(expirationTime);
  const [canResendCode, setCanResendCode] = useState(false);
  const [resendTimeLeft, setResendTimeLeft] = useState(0);
  const [showRetryHint, setShowRetryHint] = useState(false);

  const inputRefs = useRef<(TextInput | null)[]>([]);
  const shakeAnimation = useRef(new Animated.Value(0)).current;

  // Timer for OTP expiration
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResendCode(true);
    }
  }, [timeLeft]);

  // Timer for resend cooldown
  useEffect(() => {
    if (resendTimeLeft > 0) {
      const timer = setTimeout(
        () => setResendTimeLeft(resendTimeLeft - 1),
        1000
      );
      return () => clearTimeout(timer);
    } else {
      setCanResendCode(timeLeft <= 0);
    }
  }, [resendTimeLeft, timeLeft]);

  // Show retry hint for network errors
  useEffect(() => {
    if (error && (error.includes("conexión") || error.includes("servidor"))) {
      setShowRetryHint(true);
      const timer = setTimeout(() => setShowRetryHint(false), 5000);
      return () => clearTimeout(timer);
    } else {
      setShowRetryHint(false);
    }
  }, [error]);

  // Auto-submit when all 6 digits are entered
  useEffect(() => {
    const code = otp.join("");
    if (code.length === 6 && !isLoading) {
      onSubmit(code);
    }
  }, [otp, isLoading, onSubmit]);

  // Clear OTP on error based on error type
  useEffect(() => {
    if (
      shouldClearInput ||
      (error && !error.includes("conexión") && !error.includes("servidor"))
    ) {
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();

      // Trigger shake animation for validation errors
      if (error && !error.includes("conexión") && !error.includes("servidor")) {
        triggerShakeAnimation();
      }
    }
  }, [error, shouldClearInput]);

  // Trigger shake animation for errors
  const triggerShakeAnimation = () => {
    Animated.sequence([
      Animated.timing(shakeAnimation, {
        toValue: 10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnimation, {
        toValue: -10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnimation, {
        toValue: 10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnimation, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleInputChange = (value: string, index: number) => {
    // Only allow numeric input
    const numericValue = value.replace(/[^0-9]/g, "");

    if (numericValue.length <= 1) {
      const newOtp = [...otp];
      newOtp[index] = numericValue;
      setOtp(newOtp);

      // Auto-focus next input
      if (numericValue && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === "Backspace" && !otp[index] && index > 0) {
      // Focus previous input on backspace if current is empty
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = async () => {
    try {
      const clipboardContent = await Clipboard.getString();
      const numericContent = clipboardContent.replace(/[^0-9]/g, "");

      if (numericContent.length === 6) {
        const newOtp = numericContent.split("");
        setOtp(newOtp);
        inputRefs.current[5]?.focus(); // Focus last input
      } else {
        Alert.alert(
          "Código inválido",
          "El código debe tener exactamente 6 dígitos"
        );
      }
    } catch (error) {
      console.error("Error accessing clipboard:", error);
    }
  };

  const handleResend = () => {
    if (canResendCode && !isLoading) {
      setTimeLeft(expirationTime);
      setResendTimeLeft(resendCooldown);
      setCanResendCode(false);
      setOtp(["", "", "", "", "", ""]);
      setShowRetryHint(false);
      inputRefs.current[0]?.focus();
      onResend();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getInputStyle = (index: number) => {
    let baseStyle =
      "w-12 h-14 border-2 rounded-xl text-center text-xl font-bold";

    if (isSuccess) {
      baseStyle += " border-green-500 bg-green-50 text-green-700";
    } else if (error && otp[index]) {
      baseStyle += " border-red-500 bg-red-50 text-red-700";
    } else if (otp[index]) {
      baseStyle += " border-blue-500 bg-blue-50 text-blue-700";
    } else {
      baseStyle += " border-gray-300 bg-gray-50 text-gray-900";
    }

    return baseStyle;
  };

  return (
    <View className="flex-1 justify-center px-6 bg-white">
      {/* Header */}
      <View className="items-center mb-8">
        <View className="w-16 h-16 bg-blue-100 rounded-full items-center justify-center mb-4">
          <Ionicons name="mail" size={32} color="#3B82F6" />
        </View>
        <Text className="text-2xl font-bold text-gray-900 mb-2">
          Verificación OTP
        </Text>
        <Text className="text-gray-600 text-center">
          Hemos enviado un código de 6 dígitos a
        </Text>
        <Text className="text-blue-600 font-semibold">{email}</Text>
      </View>

      {/* OTP Input Fields */}
      <Animated.View
        className="flex-row justify-between mb-6"
        style={{ transform: [{ translateX: shakeAnimation }] }}
      >
        {otp.map((digit, index) => (
          <TextInput
            key={index}
            ref={(ref) => {
              inputRefs.current[index] = ref;
            }}
            className={getInputStyle(index)}
            value={digit}
            onChangeText={(value) => handleInputChange(value, index)}
            onKeyPress={({ nativeEvent }) =>
              handleKeyPress(nativeEvent.key, index)
            }
            keyboardType="numeric"
            maxLength={1}
            selectTextOnFocus
            editable={!isLoading && !isSuccess}
          />
        ))}
      </Animated.View>

      {/* Paste Button */}
      <TouchableOpacity
        onPress={handlePaste}
        disabled={isLoading || isSuccess}
        className="flex-row items-center justify-center mb-6"
      >
        <Ionicons name="clipboard-outline" size={16} color="#6B7280" />
        <Text className="text-gray-600 ml-2">Pegar código</Text>
      </TouchableOpacity>

      {/* Error Message */}
      {error && (
        <View className="mb-4">
          <View className="flex-row items-start justify-center px-4 py-3 bg-red-50 rounded-xl">
            <Ionicons
              name="alert-circle"
              size={20}
              color="#EF4444"
              className="mt-0.5"
            />
            <View className="flex-1 ml-2">
              <Text className="text-red-600 font-medium">{error}</Text>
              {retryCount > 1 && (
                <Text className="text-red-500 text-sm mt-1">
                  Intento {retryCount} de verificación
                </Text>
              )}
            </View>
          </View>

          {/* Retry Hint for Network Errors */}
          {showRetryHint && canRetry && (
            <View className="flex-row items-center justify-center mt-2 px-4 py-2 bg-blue-50 rounded-lg">
              <Ionicons name="refresh" size={16} color="#3B82F6" />
              <Text className="text-blue-600 text-sm ml-2">
                Toca "Reenviar código" para intentar nuevamente
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Success Message */}
      {isSuccess && (
        <View className="flex-row items-center justify-center mb-4 px-4 py-3 bg-green-50 rounded-xl">
          <Ionicons name="checkmark-circle" size={20} color="#10B981" />
          <Text className="text-green-600 ml-2">
            Código verificado correctamente
          </Text>
        </View>
      )}

      {/* Loading Indicator */}
      {isLoading && (
        <LoadingIndicator operation="verify" className="mb-6" size="small" />
      )}

      {/* Timer and Resend */}
      <View className="items-center mb-8">
        {timeLeft > 0 ? (
          <Text className="text-gray-600 mb-4">
            El código expira en {formatTime(timeLeft)}
          </Text>
        ) : (
          <Text className="text-red-600 mb-4">El código ha expirado</Text>
        )}

        <TouchableOpacity
          onPress={handleResend}
          disabled={!canResendCode || isLoading || resendTimeLeft > 0}
          className={`px-6 py-3 rounded-xl flex-row items-center justify-center ${
            canResendCode && !isLoading && resendTimeLeft === 0
              ? "bg-blue-600"
              : "bg-gray-300"
          }`}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Ionicons
              name="refresh"
              size={16}
              color={
                canResendCode && resendTimeLeft === 0 ? "white" : "#6B7280"
              }
            />
          )}
          <Text
            className={`font-semibold ml-2 ${
              canResendCode && !isLoading && resendTimeLeft === 0
                ? "text-white"
                : "text-gray-500"
            }`}
          >
            {resendTimeLeft > 0
              ? `Reenviar en ${resendTimeLeft}s`
              : isLoading
                ? "Reenviando..."
                : "Reenviar código"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Back Button */}
      <TouchableOpacity
        onPress={onBack}
        disabled={isLoading}
        className="flex-row items-center justify-center py-4"
      >
        <Ionicons name="arrow-back" size={20} color="#6B7280" />
        <Text className="text-gray-600 ml-2">Volver al inicio de sesión</Text>
      </TouchableOpacity>
    </View>
  );
}
