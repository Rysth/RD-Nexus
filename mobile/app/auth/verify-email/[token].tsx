import { useEffect, useState } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useAuthStore } from "../../../stores/authStore";
import Button from "../../../components/Button";

type VerificationStatus = "pending" | "verifying" | "success" | "error";

export default function VerifyEmail() {
  const router = useRouter();
  const { token } = useLocalSearchParams<{ token: string }>();
  const { verifyEmail, isLoading } = useAuthStore();
  const [status, setStatus] = useState<VerificationStatus>("pending");
  const [hasAttempted, setHasAttempted] = useState(false);

  useEffect(() => {
    const verify = async () => {
      if (hasAttempted) return;

      // If no token, just show pending message
      if (!token) {
        setHasAttempted(true);
        return;
      }

      setStatus("verifying");
      try {
        await verifyEmail(token);
        setStatus("success");
        // Auto redirect to SignIn after 2 seconds
        setTimeout(() => {
          router.push("/auth/signin");
        }, 2000);
      } catch (error) {
        setStatus("error");
      } finally {
        setHasAttempted(true);
      }
    };

    verify();
  }, [token, hasAttempted]);

  if (status === "verifying") {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 items-center justify-center px-6">
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text className="mt-4 text-gray-500">Verificando correo...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (status === "pending") {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 items-center justify-center px-6">
          <Ionicons name="mail-open-outline" size={64} color="#3B82F6" />
          <Text className="mt-4 text-2xl font-bold text-gray-900 text-center">
            Verifica tu Correo Electrónico
          </Text>
          <Text className="mt-2 text-center text-gray-500">
            Por favor revisa tu correo para verificar tu cuenta y haz clic en el
            enlace de verificación para continuar.
          </Text>

          <View className="w-full mt-8 gap-4">
            <Button
              title="Reenviar Correo de Verificación"
              variant="primary"
              icon="mail-open-outline"
              onPress={() => router.push("/auth/confirm")}
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

  if (status === "success") {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 items-center justify-center px-6">
          <Ionicons name="checkmark-circle" size={64} color="#22C55E" />
          <Text className="mt-4 text-2xl font-bold text-gray-900 text-center">
            ¡Correo Verificado!
          </Text>
          <Text className="mt-2 text-center text-gray-500">
            Tu correo ha sido verificado exitosamente.
          </Text>

          <View className="w-full mt-8">
            <Button
              title="Continuar a Iniciar Sesión"
              variant="primary"
              icon="log-in-outline"
              onPress={() => router.push("/auth/signin")}
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 items-center justify-center px-6">
        <Ionicons name="close-circle" size={64} color="#EF4444" />
        <Text className="mt-4 text-2xl font-bold text-gray-900 text-center">
          Verificación Fallida
        </Text>
        <Text className="mt-2 text-center text-error">
          Ya haz verificado tu correo o el token es inválido.
        </Text>

        <View className="w-full mt-8 gap-4">
          <Button
            title="Reenviar Correo de Verificación"
            variant="primary"
            icon="mail-open-outline"
            onPress={() => router.push("/auth/confirm")}
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
