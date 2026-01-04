import { Text, View, TouchableOpacity, Alert, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useAuthStore } from "../stores/authStore";
import Button from "../components/Button";
// no-op

export default function Home() {
  const { user, logout, isLoading } = useAuthStore();

  const handleLogout = async () => {
    Alert.alert("Cerrar Sesión", "¿Estás seguro que deseas cerrar sesión?", [
      {
        text: "Cancelar",
        style: "cancel",
      },
      {
        text: "Cerrar Sesión",
        style: "destructive",
        onPress: async () => {
          try {
            await logout();
            // No need to navigate, the component will re-render automatically
          } catch (error) {
            Alert.alert("Error", "Error al cerrar sesión");
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {user ? (
          <View className="p-6">
            {/* Header */}
            <View className="mb-8">
              <Text className="mb-2 text-sm text-text-secondary">
                ¡Hola de nuevo! 👋
              </Text>
              <Text className="text-3xl font-bold text-text-primary">
                {user.fullName || user.username || "Usuario"}
              </Text>
            </View>

            {/* Profile Card */}
            <View className="p-6 mb-6 bg-primary rounded-3xl">
              <View className="flex-row items-center">
                <View className="items-center justify-center w-16 h-16 mr-4 rounded-full bg-white/20">
                  <Text className="text-2xl font-bold text-white">
                    {(user.fullName || user.username || "U")
                      .charAt(0)
                      .toUpperCase()}
                  </Text>
                </View>
                <View className="flex-1">
                  <Text className="mb-1 text-lg font-bold text-white">
                    @{user.username || "usuario"}
                  </Text>
                  <Text className="text-sm text-white/80">
                    {user.email || ""}
                  </Text>
                </View>
              </View>
            </View>

            {/* Quick Actions */}
            <Text className="mb-4 text-xl font-bold text-text-primary">
              Acciones Rápidas
            </Text>
            <View className="mb-6">
              <TouchableOpacity className="flex-row items-center justify-between p-5 bg-white border border-gray-100 rounded-2xl">
                <View className="flex-row items-center">
                  <View className="items-center justify-center w-12 h-12 mr-4 bg-secondary/10 rounded-xl">
                    <Ionicons
                      name="settings-outline"
                      size={24}
                      color="#10B981"
                    />
                  </View>
                  <View>
                    <Text className="text-base font-bold text-text-primary">
                      Configuración
                    </Text>
                    <Text className="text-sm text-text-secondary">
                      Preferencias de la app
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            {/* Account Details */}
            <Text className="mb-4 text-xl font-bold text-text-primary">
              Detalles de la Cuenta
            </Text>
            <View className="p-5 mb-6 bg-white border border-gray-100 rounded-2xl">
              <View className="flex-row items-center pb-4 mb-4 border-b border-gray-100">
                <Ionicons name="mail-outline" size={20} color="#6B7280" />
                <View className="flex-1 ml-3">
                  <Text className="mb-1 text-xs text-text-secondary">
                    Correo Electrónico
                  </Text>
                  <Text className="text-base font-medium text-text-primary">
                    {user.email}
                  </Text>
                </View>
              </View>
              <View className="flex-row items-center">
                <Ionicons name="person-outline" size={20} color="#6B7280" />
                <View className="flex-1 ml-3">
                  <Text className="mb-1 text-xs text-text-secondary">
                    Nombre de Usuario
                  </Text>
                  <Text className="text-base font-medium text-text-primary">
                    {user.username || "N/A"}
                  </Text>
                </View>
              </View>
            </View>

            {/* Logout Button */}
            <Button
              title="Cerrar Sesión"
              variant="outline"
              icon="log-out-outline"
              onPress={handleLogout}
              isLoading={isLoading}
            />
          </View>
        ) : (
          <View
            className="items-center justify-center flex-1 px-6"
            style={{ minHeight: 600 }}
          >
            <View className="items-center justify-center w-32 h-32 mb-8 rounded-full bg-primary">
              <Ionicons name="rocket-outline" size={56} color="white" />
            </View>
            <Text className="mb-3 text-4xl font-bold text-text-primary">
              Bienvenido
            </Text>
            <Text className="mb-12 text-base leading-6 text-center text-text-secondary">
              Inicia sesión para acceder a todas las funcionalidades de tu
              cuenta
            </Text>

            <View className="w-full gap-4">
              <Button
                title="Iniciar Sesión"
                variant="primary"
                icon="log-in-outline"
                onPress={() => router.push("/auth/signin")}
              />

              <Button
                title="Crear Cuenta"
                variant="secondary"
                icon="person-add-outline"
                onPress={() => router.push("/auth/signup")}
              />
            </View>
          </View>
        )}

        <View className="p-6 pb-8">
          <Text className="text-sm text-center text-text-secondary">
            Desarrollado por{" "}
            <Text className="font-bold text-primary">RysthDesign</Text>
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
