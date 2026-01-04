import { useState } from "react";
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
import Input from "../../components/Input";
import Button from "../../components/Button";

export default function SignUp() {
  const router = useRouter();
  const { register, isLoading } = useAuthStore();
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirmation, setShowPasswordConfirmation] =
    useState(false);
  const [errors, setErrors] = useState<{
    fullName?: string;
    username?: string;
    email?: string;
    password?: string;
    passwordConfirmation?: string;
  }>({});

  const validateForm = () => {
    const newErrors: typeof errors = {};

    if (!fullName) newErrors.fullName = "Requerido";
    if (!username) newErrors.username = "Requerido";
    if (!email) {
      newErrors.email = "Requerido";
    } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email)) {
      newErrors.email = "Correo electrónico inválido";
    }
    if (!password) {
      newErrors.password = "Requerido";
    } else if (password.length < 6) {
      newErrors.password = "Mínimo 6 caracteres";
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
    if (!validateForm()) return;

    try {
      await register({
        fullName,
        username,
        email,
        password,
        passwordConfirmation,
      });
      router.back();
    } catch (err: any) {
      // Error handled in store
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
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="px-6 pt-4 pb-6">
            <TouchableOpacity
              className="items-center justify-center w-10 h-10 mb-6 bg-gray-100 rounded-full"
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={20} color="#374151" />
            </TouchableOpacity>

            <Text className="mb-2 text-3xl font-bold text-gray-900">
              Crea tu cuenta
            </Text>
            <Text className="text-base text-gray-500">¡Únete hoy!</Text>
          </View>

          <View className="flex-1 px-6">
            <Input
              label="Nombre Completo"
              icon="person"
              placeholder="Tu nombre completo"
              value={fullName}
              onChangeText={(text) => {
                setFullName(text);
                if (errors.fullName)
                  setErrors({ ...errors, fullName: undefined });
              }}
              autoComplete="name"
              error={errors.fullName}
            />

            <Input
              label="Nombre de Usuario"
              icon="at"
              placeholder="nombreusuario"
              value={username}
              onChangeText={(text) => {
                setUsername(text);
                if (errors.username)
                  setErrors({ ...errors, username: undefined });
              }}
              autoCapitalize="none"
              autoComplete="username"
              error={errors.username}
            />

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

            <View className="mb-4">
              <Text className="mb-2 text-sm font-semibold text-gray-700">
                Contraseña
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
                  placeholder="Mínimo 6 caracteres"
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
                      setErrors({ ...errors, passwordConfirmation: undefined });
                  }}
                  secureTextEntry={!showPasswordConfirmation}
                  autoCapitalize="none"
                  autoComplete="password"
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
              title="Crear Cuenta"
              isLoading={isLoading}
              onPress={onSubmit}
              className="mb-6"
            />

            <View className="flex-row items-center mb-6">
              <View className="flex-1 h-px bg-gray-200" />
              <Text className="px-4 text-sm text-gray-400">
                o regístrate con
              </Text>
              <View className="flex-1 h-px bg-gray-200" />
            </View>

            <TouchableOpacity className="flex-row items-center justify-center mb-6 border-2 border-gray-200 rounded-2xl h-14">
              <Ionicons name="logo-google" size={24} color="#374151" />
              <Text className="ml-3 text-base font-semibold text-gray-700">
                Continuar con Google
              </Text>
            </TouchableOpacity>
          </View>

          <View className="px-6 pb-6">
            <View className="flex-row items-center justify-center">
              <Text className="text-sm text-gray-600">¿Ya tienes cuenta? </Text>
              <TouchableOpacity onPress={() => router.push("/auth/signin")}>
                <Text className="text-sm font-bold text-blue-600">
                  Inicia sesión
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
