import { useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { formatDistanceToNow } from "date-fns";
import {
  Badge,
  Button,
  Card,
  CardHeader,
  EmptyState,
  Input,
  ListRow,
  PasskeyPrompt,
  Sheet,
  Skeleton,
  Text,
  useToast,
} from "@/components/ui";
import { useTheme } from "@/hooks/useTheme";
import { useCreateSessionKey, useRevokeSessionKey, useSessionKeys } from "@/hooks/usePolicies";
import { useAuthStore } from "@/store/auth";
import { errorMessage } from "@/lib/api";
import { shortAddress } from "@/lib/format";
import { PasskeyCancelledError } from "@/native/passkey-adapter";

/** Time-limited sub-keys for dApp interactions — list, create, revoke. */
export function SessionKeysCard() {
  const { colors } = useTheme();
  const toast = useToast();
  const { walletAddress, credentialId, userHandle } = useAuthStore();
  const { data, isLoading } = useSessionKeys(walletAddress);
  const create = useCreateSessionKey();
  const revoke = useRevokeSessionKey();

  const [open, setOpen] = useState(false);
  const [scope, setScope] = useState("");
  const [hours, setHours] = useState("24");

  const hoursNum = Number(hours);
  const valid = scope.trim().length > 0 && hoursNum >= 1 && hoursNum <= 720;

  const submit = async () => {
    if (!walletAddress || !credentialId) return;
    try {
      const expiresAt = new Date(Date.now() + hoursNum * 3600_000).toISOString();
      await create.mutateAsync({
        walletAddress,
        credentialId,
        userHandle: userHandle ?? walletAddress,
        scope: scope.trim(),
        expiresAt,
      });
      toast.success("Session key authorised");
      setOpen(false);
      setScope("");
      setHours("24");
    } catch (err) {
      if (!(err instanceof PasskeyCancelledError))
        toast.error("Authorisation failed", errorMessage(err));
    }
  };

  const confirmRevoke = (id: string) => {
    if (!walletAddress) return;
    Alert.alert("Revoke session key?", "Apps using this key will lose access immediately.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Revoke",
        style: "destructive",
        onPress: () =>
          revoke.mutate(
            { id, walletAddress },
            {
              onSuccess: () => toast.success("Session key revoked"),
              onError: (e) => toast.error("Revoke failed", errorMessage(e)),
            }
          ),
      },
    ]);
  };

  const sessions = data ?? [];

  return (
    <>
      <Card flush>
        <CardHeader
          title="Session keys"
          description="Time-limited sub-keys for dApp interactions."
          icon={<Ionicons name="key-outline" size={18} color={colors.primary} />}
          style={{ paddingHorizontal: 18, paddingTop: 18, marginBottom: 6 }}
          action={
            <Button
              size="sm"
              onPress={() => setOpen(true)}
              icon={<Ionicons name="add" size={16} color={colors.primaryForeground} />}
            >
              New
            </Button>
          }
        />
        {isLoading ? (
          <View style={{ padding: 18, gap: 12 }}>
            <Skeleton height={48} />
            <Skeleton height={48} />
          </View>
        ) : sessions.length === 0 ? (
          <View style={{ padding: 18 }}>
            <EmptyState
              icon={<Ionicons name="key-outline" size={22} color={colors.mutedForeground} />}
              title="No active session keys"
              description="Create one to authorise dApp connections."
              action={
                <Button size="sm" variant="outline" onPress={() => setOpen(true)}>
                  Create session key
                </Button>
              }
            />
          </View>
        ) : (
          sessions.map((s, i) => {
            const expired = new Date(s.expiresAt) < new Date();
            return (
              <ListRow
                key={s.sessionId}
                icon={
                  <Ionicons
                    name="key"
                    size={16}
                    color={expired ? colors.mutedForeground : colors.primary}
                  />
                }
                iconTone={expired ? "muted" : "primary"}
                title={s.scope.length > 20 ? shortAddress(s.scope, 8, 6) : s.scope}
                mono
                subtitle={
                  expired
                    ? "Expired"
                    : `Expires ${formatDistanceToNow(new Date(s.expiresAt), { addSuffix: true })}`
                }
                last={i === sessions.length - 1}
                right={
                  <View style={styles.rowRight}>
                    <Badge variant={expired ? "secondary" : "success"}>
                      {expired ? "Inactive" : "Active"}
                    </Badge>
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={expired || revoke.isPending}
                      onPress={() => confirmRevoke(s.sessionId)}
                      icon={<Ionicons name="trash-outline" size={14} color={colors.destructive} />}
                      haptic={false}
                    >
                      Revoke
                    </Button>
                  </View>
                }
              />
            );
          })
        )}
      </Card>

      <Sheet
        open={open}
        onClose={() => !create.isPending && setOpen(false)}
        dismissable={!create.isPending}
        title="Create session key"
        description="Authorise an ephemeral key scoped to specific contracts."
        footer={
          !create.isPending ? (
            <Button
              size="lg"
              fullWidth
              disabled={!valid}
              onPress={submit}
              icon={<Ionicons name="finger-print" size={18} color={colors.primaryForeground} />}
            >
              Authorise key
            </Button>
          ) : null
        }
      >
        {create.isPending ? (
          <PasskeyPrompt processing message="Sign the session key authorisation…" />
        ) : (
          <View style={{ gap: 14 }}>
            <Input
              label="Scope (contract addresses)"
              placeholder="C… (comma-separated)"
              value={scope}
              onChangeText={setScope}
              autoCapitalize="characters"
              autoCorrect={false}
              mono
              hint="Contracts this key is permitted to call."
            />
            <Input
              label="Expiry (hours)"
              keyboardType="number-pad"
              value={hours}
              onChangeText={setHours}
              hint="Between 1 and 720 hours."
              error={
                hours !== "" && !(hoursNum >= 1 && hoursNum <= 720)
                  ? "Must be 1–720 hours"
                  : undefined
              }
            />
            <Text variant="small" tone="muted">
              You can revoke the key at any time from this screen.
            </Text>
          </View>
        )}
      </Sheet>
    </>
  );
}

const styles = StyleSheet.create({ rowRight: { alignItems: "flex-end", gap: 6 } });
