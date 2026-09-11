import { View } from "react-native";
import { useTheme } from "@/hooks/useTheme";

export function Separator({ vertical = false, inset = 0 }: { vertical?: boolean; inset?: number }) {
  const { colors } = useTheme();
  return (
    <View
      style={
        vertical
          ? {
              width: 1,
              alignSelf: "stretch",
              backgroundColor: colors.border,
              marginVertical: inset,
            }
          : { height: 1, backgroundColor: colors.border, marginHorizontal: inset }
      }
    />
  );
}
