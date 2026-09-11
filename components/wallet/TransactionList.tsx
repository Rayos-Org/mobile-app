import { View, Text, FlatList, StyleSheet } from "react-native";

export function TransactionList({ transactions }: { transactions: any[] }) {
  if (transactions.length === 0) {
    return <Text style={styles.empty}>No transactions yet.</Text>;
  }

  return (
    <FlatList
      data={transactions}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <View style={styles.item}>
          <Text style={styles.type}>{item.type.toUpperCase()}</Text>
          <Text style={styles.date}>{new Date(item.created_at).toLocaleDateString()}</Text>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  item: { padding: 16, borderBottomWidth: 1, borderBottomColor: "#E5E7EB", flexDirection: "row", justifyContent: "space-between" },
  type: { fontWeight: "500", color: "#374151" },
  date: { color: "#9CA3AF" },
  empty: { padding: 20, textAlign: "center", color: "#6B7280" },
});
