import { useState } from "react";
import Animated, { FadeIn } from "react-native-reanimated";
import { Screen, SegmentedControl } from "@/components/ui";
import { SpendLimitCard } from "@/components/policies/SpendLimitCard";
import { SessionKeysCard } from "@/components/policies/SessionKeysCard";
import { AllowListCard } from "@/components/policies/AllowListCard";

type Tab = "limits" | "sessions" | "allowlist";

export default function PoliciesScreen() {
  const [tab, setTab] = useState<Tab>("limits");

  return (
    <Screen title="Policies" subtitle="Spend limits, session keys and allow-lists — enforced on-chain">
      <SegmentedControl<Tab>
        value={tab}
        onChange={setTab}
        segments={[
          { value: "limits", label: "Limits" },
          { value: "sessions", label: "Sessions" },
          { value: "allowlist", label: "Allow-list" },
        ]}
      />
      <Animated.View key={tab} entering={FadeIn.duration(220)}>
        {tab === "limits" && <SpendLimitCard />}
        {tab === "sessions" && <SessionKeysCard />}
        {tab === "allowlist" && <AllowListCard />}
      </Animated.View>
    </Screen>
  );
}
