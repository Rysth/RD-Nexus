import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useAuthStore } from "../../../stores/authStore";
import Button from "../../../components/Button";

type TokenStatus = "validating" | "valid" | "invalid";

export default function ResetPassword() {
  const router = useRouter();
  const { token } = useLocalSearchParams<{ token: string }>();
  const { resetPassword, isLoading } = useAuthStore();

  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirmation, setShowPasswordConfirmation] =
    useState(false);
  const [errors, setErrors] = useState<{
    password?: string;
    passwordConfirmation?: string;
  }>({});
  const [tokenStatus, setTokenStatus] = useState<TokenStatus>("validating");

  useEffect(() => {
    // Validate token
    if (!token) {
      setTokenStatus("invalid");
    } else {
      setTokenStatus("valid");
    }
  }, [token]);

  const validateForm = () => {
    const newErrors: {
      password?: string;
      passwordConfirmation?: string;
    } = {};

    if (!password) {
      newErrors.password = "Requerido";
    } else if (password.length < 8) {
      newErrors.password = "Mínimo 8 caracteres";
    }

    if (!passwordConfirmation) {
      newErrors.passwordConfirmation = "Requerido";
    } else if (password !== passwordConfirmation) {
      newErrors.passwordConfirmation = "Las contraseñas no coinciden";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const onSubmit = async () => {
    if (!validateForm() || !token) return;

    try {
      await resetPassword(token, password, passwordConfirmation);
      router.push("/auth/signin");
    } catch (error: any) {
      // Error already handled by toast in store
    }
  };

  if (tokenStatus === "validating") {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="items-center justify-center flex-1">
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text className="mt-4 text-gray-500">Validando enlace...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (tokenStatus === "invalid") {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="items-center justify-center flex-1 px-6">
          <Ionicons name="close-circle" size={64} color="#EF4444" />
          <Text className="mt-4 text-2xl font-bold text-gray-900">
            Enlace Inválido
          </Text>
          <Text className="mt-2 text-center text-error">
            Este enlace ya ha sido utilizado o ha expirado.
          </Text>

          <View className="w-full gap-4 mt-8">
            <Button
              title="Solicitar Nuevo Enlace"
              variant="primary"
              icon="mail-open-outline"
              onPress={() => router.push("/auth/forgot-password")}
            />
            <Button
              title="Volver a Iniciar Sesión"
              variant="secondary"
              icon="arrow-back"
              onPress={() => router.push("/auth/signin")}
            />
          </View>
        </View>
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
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={20} color="#374151" />
            </TouchableOpacity>

            <Text className="mb-2 text-3xl font-bold text-gray-900">
              Reiniciar Contraseña
            </Text>
            <Text className="text-base text-gray-500">
              Ingresa tu nueva contraseña
            </Text>
          </View>

          {/* Form Container */}
          <View className="flex-1 px-6">
            {/* Password Input */}
            <View className="mb-4">
              <Text className="mb-2 text-sm font-semibold text-gray-700">
                Nueva Contraseña
              </Text>
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
                  placeholder="Mínimo 8 caracteres"
                  placeholderTextColor="#9CA3AF"
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (errors.password)
                      setErrors({ ...errors, password: undefined });
                  }}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoComplete="new-password"
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

            {/* Password Confirmation Input */}
            <View className="mb-6">
              <Text className="mb-2 text-sm font-semibold text-gray-700">
                Confirmar Contraseña
              </Text>
              <View
                className={`flex-row items-center border ${
                  errors.passwordConfirmation
                    ? "border-red-400 bg-red-50"
                    : "border-gray-200 bg-gray-50"
                } rounded-2xl px-4 h-14`}
              >
                <Ionicons
                  name="lock-closed"
                  size={20}
                  color={errors.passwordConfirmation ? "#F87171" : "#9CA3AF"}
                />
                <TextInput
                  className="flex-1 ml-3 text-base text-gray-900"
                  placeholder="Repite tu contraseña"
                  placeholderTextColor="#9CA3AF"
                  value={passwordConfirmation}
                  onChangeText={(text) => {
                    setPasswordConfirmation(text);
                    if (errors.passwordConfirmation)
                      setErrors({
                        ...errors,
                        passwordConfirmation: undefined,
                      });
                  }}
                  secureTextEntry={!showPasswordConfirmation}
                  autoCapitalize="none"
                  autoComplete="new-password"
                />
                <TouchableOpacity
                  onPress={() =>
                    setShowPasswordConfirmation(!showPasswordConfirmation)
                  }
                  className="p-1"
                >
                  <Ionicons
                    name={showPasswordConfirmation ? "eye" : "eye-off"}
                    size={20}
                    color="#9CA3AF"
                  />
                </TouchableOpacity>
              </View>
              {errors.passwordConfirmation && (
                <Text className="mt-2 ml-1 text-xs text-red-500">
                  {errors.passwordConfirmation}
                </Text>
              )}
            </View>

            <Button
              title={isLoading ? "Reiniciando..." : "Reiniciar Contraseña"}
              isLoading={isLoading}
              onPress={onSubmit}
              icon="lock-open-outline"
              className="mb-6"
            />
          </View>

          {/* Footer */}
          <View className="px-6 pb-6">
            <View className="flex-row items-center justify-center">
              <Text className="text-sm text-gray-600">
                ¿Recordaste tu contraseña?{" "}
              </Text>
              <TouchableOpacity onPress={() => router.push("/auth/signin")}>
                <Text className="text-sm font-bold text-blue-600">
                  Iniciar sesión
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
