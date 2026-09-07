import React, { createContext, useContext } from "react";
import {
  Text,
  View,
  Pressable,
  TextInput,
  TextStyle,
  ViewStyle,
  KeyboardTypeOptions,
} from "react-native";
export const light = {
  bg: "#F5F3EE",
  card: "#FFFFFF",
  text: "#243B38",
  muted: "#72817A",
  line: "#E5E9E1",
  primary: "#257864",
  soft: "#E6F0E7",
  hero: "#183F36",
};
export const dark = {
  bg: "#111E1B",
  card: "#1E302A",
  text: "#EFF4E9",
  muted: "#A2B4A9",
  line: "#34473F",
  primary: "#94D2B5",
  soft: "#2D493D",
  hero: "#203E34",
};
export const Theme = createContext(light);
export function T({
  children,
  style,
  ...props
}: React.ComponentProps<typeof Text>) {
  const c = useContext(Theme);
  return (
    <Text
      {...props}
      style={[{ color: c.text, fontSize: 15, lineHeight: 23 }, style]}
    >
      {children}
    </Text>
  );
}
export function Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  const c = useContext(Theme);
  return (
    <View
      style={[
        {
          backgroundColor: c.card,
          borderRadius: 24,
          padding: 20,
          borderWidth: 1,
          borderColor: c.line,
          gap: 12,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
export function Button({
  label,
  onPress,
  secondary = false,
  disabled = false,
  style,
}: {
  label: string;
  onPress: () => void;
  secondary?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}) {
  const c = useContext(Theme);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        {
          backgroundColor: secondary ? c.soft : c.primary,
          borderRadius: 16,
          paddingHorizontal: 18,
          minHeight: 48,
          alignItems: "center",
          justifyContent: "center",
          opacity: disabled ? 0.4 : pressed ? 0.7 : 1,
        },
        style,
      ]}
    >
      <T
        style={{
          color: secondary ? c.text : c === dark ? "#133D2E" : "#FFFFFF",
          fontWeight: "600",
        }}
      >
        {label}
      </T>
    </Pressable>
  );
}
export function Chips({
  options,
  value,
  onChange,
}: {
  options: { label: string; value: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  const c = useContext(Theme);
  return (
    <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
      {options.map((o) => (
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected: value === o.value }}
          key={o.value}
          onPress={() => onChange(o.value)}
          style={{
            minHeight: 44,
            justifyContent: "center",
            borderRadius: 14,
            paddingHorizontal: 14,
            backgroundColor: value === o.value ? c.soft : c.card,
            borderWidth: 1,
            borderColor: value === o.value ? c.primary : c.line,
          }}
        >
          <T
            style={{
              fontSize: 13,
              fontWeight: value === o.value ? "700" : "400",
            }}
          >
            {o.label}
          </T>
        </Pressable>
      ))}
    </View>
  );
}
export function Field({
  label,
  value,
  onChange,
  placeholder,
  keyboardType = "default",
  ...rest
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  keyboardType?: KeyboardTypeOptions;
  maxLength?: number;
}) {
  const c = useContext(Theme);
  return (
    <View style={{ gap: 6 }}>
      <T style={{ color: c.muted, fontSize: 13 }}>{label}</T>
      <TextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={c.muted}
        keyboardType={keyboardType}
        style={{
          borderWidth: 1,
          borderColor: c.line,
          borderRadius: 14,
          padding: 14,
          color: c.text,
          fontSize: 16,
          backgroundColor: c.bg,
        }}
        {...rest}
      />
    </View>
  );
}
export const row: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
};
export const heading: TextStyle = {
  fontSize: 23,
  lineHeight: 31,
  fontWeight: "700",
  letterSpacing: -0.5,
};
