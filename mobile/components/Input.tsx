import { View, Text, TextInput, TouchableOpacity, TextInputProps } from "react-native";
import Ionicons from '@expo/vector-icons/Ionicons';

interface InputProps extends TextInputProps {
  label: string;
  error?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  showValidIcon?: boolean;
}

export default function Input({
  label,
  error,
  icon,
  rightIcon,
  onRightIconPress,
  showValidIcon,
  ...props
}: InputProps) {
  return (
    <View className="mb-4">
      <Text className="text-sm font-semibold text-gray-700 mb-2">
        {label}
      </Text>
      <View className={`flex-row items-center border ${
        error ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-gray-50'
      } rounded-2xl px-4 h-14`}>
        {icon && (
          <Ionicons
            name={icon}
            size={20}
            color={error ? "#F87171" : "#9CA3AF"}
          />
        )}
        <TextInput
          className="flex-1 ml-3 text-base text-gray-900"
          placeholderTextColor="#9CA3AF"
          {...props}
        />
        {showValidIcon && props.value && props.value.length > 0 && !error && (
          <Ionicons name="checkmark-circle" size={20} color="#10B981" />
        )}
        {rightIcon && (
          <TouchableOpacity
            onPress={onRightIconPress}
            className="p-1"
          >
            <Ionicons
              name={rightIcon}
              size={20}
              color="#9CA3AF"
            />
          </TouchableOpacity>
        )}
      </View>
      {error && (
        <Text className="text-red-500 text-xs mt-2 ml-1">
          {error}
        </Text>
      )}
    </View>
  );
}
