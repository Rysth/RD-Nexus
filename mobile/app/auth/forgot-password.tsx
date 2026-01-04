import { useState } from "react";
import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useAuthStore } from "../../stores/authStore";
import Input from "../../components/Input";
import Button from "../../components/Button";

export default function ForgotPassword() {
  const router = useRouter();
  const { forgotPassword, isLoading } = useAuthStore();
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<{ email?: string }>({});

  const validateForm = () => {
    const newErrors: { email?: string } = {};

    if (!email) {
      newErrors.email = "Requerido";
    } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email)) {
      newErrors.email = "Correo electrónico inválido";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const onSubmit = async () => {
    if (!validateForm()) return;

    try {
      await forgotPassword(email);
      setEmail("");
      setErrors({});
    } catch (error: any) {
      // Error already handled by toast in store
    }
  };

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
              className="w-10 h-10 items-center justify-center rounded-full bg-gray-100 mb-6"
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={20} color="#374151" />
            </TouchableOpacity>

            <Text className="text-3xl font-bold text-gray-900 mb-2">
              Restablecer Contraseña
            </Text>
            <Text className="text-base text-gray-500">
              Te enviaremos instrucciones para restablecer
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

            <Button
              title={isLoading ? "Enviando..." : "Enviar instrucciones"}
              isLoading={isLoading}
              onPress={onSubmit}
              icon="mail-open-outline"
              className="mb-6"
            />
          </View>

          {/* Footer */}
          <View className="px-6 pb-6">
            <View className="flex-row items-center justify-center">
              <Text className="text-sm text-gray-600">
                ¿Recuerdas tu contraseña?{" "}
              </Text>
              <TouchableOpacity onPress={() => router.push("/auth/signin")}>
                <Text className="text-sm text-blue-600 font-bold">
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
