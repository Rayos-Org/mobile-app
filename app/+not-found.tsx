import { Link } from "expo-router";
import { Button, Screen, Text } from "@/components/ui";

export default function NotFound() {
  return (
    <Screen centered edges={["top", "bottom"]}>
      <Text variant="h1" align="center">
        Page not found
      </Text>
      <Text tone="muted" align="center">
        That link doesn’t point anywhere in Guardian Wallet.
      </Text>
      <Link href="/" asChild>
        <Button fullWidth size="lg">
          Go home
        </Button>
      </Link>
    </Screen>
  );
}
