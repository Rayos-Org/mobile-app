import { View, Text, StyleSheet } from "react-native";

interface BiometricPromptCardProps {
  title: string;
  description: string;
}

export function BiometricPromptCard({ title, description }: BiometricPromptCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
    marginVertical: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#111827",
  },
  description: {
    fontSize: 14,
    color: "#4B5563",
  },
});
