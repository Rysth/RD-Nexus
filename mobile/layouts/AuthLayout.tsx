import { View, Text, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface AuthLayoutProps {
  children: React.ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 px-6 py-8">
        {/* Logo */}
        <View className="items-center mb-8">
          <View className="w-16 h-16 rounded-full bg-blue-500 items-center justify-center">
            <Text className="text-white text-2xl font-bold">MB</Text>
          </View>
          <Text className="text-xl font-bold text-gray-800 mt-2">MicroBiz</Text>
          <Text className="text-xs text-gray-500">Full-Stack Development</Text>
        </View>

        {/* Auth Form Content */}
        <View className="flex-1">
          {children}
        </View>

        {/* Footer */}
        <View className="mt-8 pt-6 border-t border-gray-200">
          <Text className="text-sm text-gray-500 text-center">
            Creado por{" "}
            <Text className="text-blue-600 font-medium">RysthDesign</Text>
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
