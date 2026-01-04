import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useAuthStore } from "../../stores/authStore";
import {
  navigateAfterAuth,
  goBackWithCleanup,
} from "../../navigation/navigation";
import Input from "../../components/Input";
import Button from "../../components/Button";
import OtpInput from "../../components/OtpInput";

export default function SignIn() {
  const router = useRouter();
  const {
    user,
    login,
    isLoading,
    isLoadingUserInfo,
    isOtpRequired,
    otpEmail,
    isOtpSuccess,
    error,
    otpError,
    retryCount,
    verifyOtp,
    resendOtp,
    setOtpRequired,
    clearOtpState,
  } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {}
  );

  // Handle role-based navigation after successful authentication
  useEffect(() => {
    if (user && !isOtpRequired) {
      navigateAfterAuth(user);
    }
  }, [user, isOtpRequired]);

  // Cleanup OTP state when component unmounts or user navigates away
  useEffect(() => {
    return () => {
      // Only cleanup if user is not authenticated (abandoned flow)
      if (isOtpRequired && !user) {
        clearOtpState();
      }
    };
  }, [isOtpRequired, user, clearOtpState]);

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email) {
      newErrors.email = "Requerido";
    } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email)) {
      newErrors.email = "Correo electrónico inválido";
    }

    if (!password) {
      newErrors.password = "Requerido";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const onSubmit = async () => {
    if (!validateForm()) return;

    try {
      await login({ email, password });
      // Navigation is handled by the useEffect hook based on user state and OTP requirement
    } catch (err: any) {
      // Error is already handled in the store
    }
  };

  const handleOtpVerify = async (code: string) => {
    try {
      await verifyOtp(code);
      // Navigation is handled by the useEffect hook after user state is updated
    } catch (err: any) {
      // Error is already handled in the store
    }
  };

  const handleOtpResend = async () => {
    try {
      await resendOtp();
    } catch (err: any) {
      // Error is already handled in the store
    }
  };

  const handleBackToLogin = () => {
    // Prevent navigation during loading states
    if (isLoading || isLoadingUserInfo) {
      return;
    }

    // Clear OTP state and return to login form
    clearOtpState();
    // Clear form data for security
    setEmail("");
    setPassword("");
    setErrors({});
  };

  // If OTP is required, show OTP input screen
  if (isOtpRequired && otpEmail) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <OtpInput
          onSubmit={handleOtpVerify}
          onResend={handleOtpResend}
          onBack={handleBackToLogin}
          isLoading={isLoading || isLoadingUserInfo}
          error={error}
          email={otpEmail}
          isSuccess={isOtpSuccess}
          canRetry={otpError?.canRetry ?? true}
          shouldClearInput={otpError?.shouldClearInput ?? false}
          retryCount={retryCount}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header with Back Button */}
          <View className="px-6 pt-4 pb-8">
            <TouchableOpacity
              className="items-center justify-center w-10 h-10 mb-6 bg-gray-100 rounded-full"
              onPress={() => {
                // Prevent navigation during loading states
                if (isLoading || isLoadingUserInfo) {
                  return;
                }
                goBackWithCleanup();
              }}
              disabled={isLoading || isLoadingUserInfo}
              style={{
                opacity: isLoading || isLoadingUserInfo ? 0.5 : 1,
              }}
            >
              <Ionicons name="arrow-back" size={20} color="#374151" />
            </TouchableOpacity>

            <Text className="mb-2 text-3xl font-bold text-gray-900">
              Bienvenido
            </Text>
            <Text className="text-base text-gray-500">
              Inicia sesión para continuar
            </Text>
          </View>

          {/* Form Container */}
          <View className="flex-1 px-6">
            <Input
              label="Correo Electrónico"
              icon="mail"
              placeholder="tu@email.com"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (errors.email) setErrors({ ...errors, email: undefined });
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              error={errors.email}
              showValidIcon
            />

            {/* Password Input with custom forgot link */}
            <View className="mb-6">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-sm font-semibold text-gray-700">
                  Contraseña
                </Text>
                <TouchableOpacity
                  onPress={() => router.push("/auth/forgot-password")}
                >
                  <Text className="text-sm font-medium text-blue-600">
                    ¿Olvidaste?
                  </Text>
                </TouchableOpacity>
              </View>
              <View
                className={`flex-row items-center border ${
                  errors.password
                    ? "border-red-400 bg-red-50"
                    : "border-gray-200 bg-gray-50"
                } rounded-2xl px-4 h-14`}
              >
                <Ionicons
                  name="lock-closed"
                  size={20}
                  color={errors.password ? "#F87171" : "#9CA3AF"}
                />
                <TextInput
                  className="flex-1 ml-3 text-base text-gray-900"
                  placeholder="Tu contraseña"
                  placeholderTextColor="#9CA3AF"
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (errors.password)
                      setErrors({ ...errors, password: undefined });
                  }}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoComplete="password"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  className="p-1"
                >
                  <Ionicons
                    name={showPassword ? "eye" : "eye-off"}
                    size={20}
                    color="#9CA3AF"
                  />
                </TouchableOpacity>
              </View>
              {errors.password && (
                <Text className="mt-2 ml-1 text-xs text-red-500">
                  {errors.password}
                </Text>
              )}
            </View>

            <Button
              title={
                isLoading
                  ? "Iniciando sesión..."
                  : isLoadingUserInfo
                    ? "Cargando información..."
                    : "Iniciar Sesión"
              }
              isLoading={isLoading || isLoadingUserInfo}
              onPress={onSubmit}
              className="mb-6"
            />

            {/* Divider */}
            <View className="flex-row items-center mb-6">
              <View className="flex-1 h-px bg-gray-200" />
              <Text className="px-4 text-sm text-gray-400">o continúa con</Text>
              <View className="flex-1 h-px bg-gray-200" />
            </View>

            {/* Social Login Button */}
            <TouchableOpacity className="flex-row items-center justify-center mb-8 border-2 border-gray-200 rounded-2xl h-14">
              <Ionicons name="logo-google" size={24} color="#374151" />
              <Text className="ml-3 text-base font-semibold text-gray-700">
                Continuar con Google
              </Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View className="px-6 pb-6">
            <View className="flex-row items-center justify-center mb-3">
              <Text className="text-sm text-gray-600">¿No tienes cuenta? </Text>
              <TouchableOpacity onPress={() => router.push("/auth/signup")}>
                <Text className="text-sm font-bold text-blue-600">
                  Regístrate
                </Text>
              </TouchableOpacity>
            </View>
            <View className="flex-row items-center justify-center">
              <TouchableOpacity onPress={() => router.push("/auth/confirm")}>
                <Text className="text-sm text-blue-600 font-medium">
                  ¿No recibiste las instrucciones de confirmación?
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
