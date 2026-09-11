import { View, Text, StyleSheet } from "react-native";

export function BalanceCard({ balance }: { balance: bigint }) {
  // Simple format for demo, assuming 7 decimals
  const formatted = (Number(balance) / 10_000_000).toFixed(7);

  return (
    <View style={styles.card}>
      <Text style={styles.label}>Total Balance</Text>
      <Text style={styles.balance}>{formatted} XLM</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: 24, backgroundColor: "#1D4ED8", borderRadius: 12, marginVertical: 16 },
  label: { color: "#DBEAFE", fontSize: 16 },
  balance: { color: "white", fontSize: 32, fontWeight: "bold", marginTop: 8 },
});
