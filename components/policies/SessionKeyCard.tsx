import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { SessionKey } from "../../hooks/usePolicies";

export function SessionKeyCard({ sessionKey, onRevoke }: { sessionKey: SessionKey, onRevoke: (id: string) => void }) {
  const isExpired = new Date(sessionKey.expiresAt) < new Date();

  return (
    <View style={styles.card}>
      <View>
        <Text style={styles.scope}>Scope: {sessionKey.scope}</Text>
        <Text style={[styles.status, isExpired && styles.expired]}>
          {isExpired ? "Expired" : `Expires: ${new Date(sessionKey.expiresAt).toLocaleDateString()}`}
        </Text>
      </View>
      <TouchableOpacity onPress={() => onRevoke(sessionKey.sessionId)} style={styles.revokeButton}>
        <Text style={styles.revokeText}>Revoke</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    backgroundColor: "white",
    borderRadius: 8,
    marginVertical: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 5, elevation: 2,
  },
  scope: { fontSize: 16, fontWeight: "600", color: "#1F2937" },
  status: { fontSize: 14, color: "#10B981", marginTop: 4 },
  expired: { color: "#EF4444" },
  revokeButton: { padding: 8, backgroundColor: "#FEE2E2", borderRadius: 6 },
  revokeText: { color: "#DC2626", fontWeight: "600" }
});
