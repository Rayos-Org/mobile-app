import { useEffect } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Screen } from "@/components/ui";
import { GuardianList } from "@/components/guardians/GuardianList";
import { RecoveryBanner } from "@/components/guardians/RecoveryBanner";

export default function GuardiansScreen() {
  const router = useRouter();
  // Legacy deep-link shape (?proposalId=) — forward to the modal approval route.
  const { proposalId } = useLocalSearchParams<{ proposalId?: string }>();
  useEffect(() => {
    if (proposalId) router.push(`/recovery/${proposalId}`);
  }, [proposalId, router]);

  return (
    <Screen title="Guardians" subtitle="Manage recovery guardians and active proposals">
      <RecoveryBanner />
      <GuardianList />
    </Screen>
  );
}
