import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  TouchableOpacityProps,
  ViewStyle,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  isLoading?: boolean;
  variant?: "primary" | "secondary" | "outline";
  icon?: keyof typeof Ionicons.glyphMap;
  className?: string;
}

export default function Button({
  title,
  isLoading,
  variant = "primary",
  icon,
  disabled,
  className,
  style,
  ...props
}: ButtonProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case "secondary":
        return "bg-secondary";
      case "outline":
        return "bg-white border-2 border-gray-200";
      default:
        return "bg-primary";
    }
  };

  const getTextStyles = () => {
    switch (variant) {
      case "secondary":
        return "text-white";
      case "outline":
        return "text-text-primary";
      default:
        return "text-white";
    }
  };

  const getIconColor = () => {
    switch (variant) {
      case "secondary":
        return "white";
      case "outline":
        return "#374151";
      default:
        return "white";
    }
  };

  // Keep shadows minimal to avoid potential navigation context timing issues
  const shadowStyle: ViewStyle = {};

  const combinedStyle = [shadowStyle, style];

  return (
    <TouchableOpacity
      className={`${getVariantStyles()} rounded-2xl h-14 items-center justify-center flex-row ${
        isLoading || disabled ? "opacity-50" : ""
      } ${className || ""}`}
      disabled={isLoading || disabled}
      style={combinedStyle}
      {...props}
    >
      {isLoading ? (
        <ActivityIndicator color={getIconColor()} size="small" />
      ) : (
        <>
          {icon && <Ionicons name={icon} size={20} color={getIconColor()} />}
          <Text
            className={`${getTextStyles()} font-bold text-base ${icon ? "ml-2" : ""}`}
          >
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}
