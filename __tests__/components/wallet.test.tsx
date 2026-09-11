import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { ThemeProvider } from "@/hooks/useTheme";
import { ToastProvider } from "@/components/ui";
import { BalanceCard } from "@/components/wallet/BalanceCard";
import { ActivityList } from "@/components/wallet/ActivityList";

jest.mock("@/lib/sdk-client", () => ({
  walletSdk: {
    getWalletState: jest.fn(async () => ({
      address: "G",
      signers: [],
      balance: 12_405_000_000n, // 1,240.5 XLM
    })),
  },
}));

const ADDR = "G" + "A".repeat(55);

function wrap(ui: React.ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return render(
    <ThemeProvider>
      <ToastProvider>
        <QueryClientProvider client={qc}>{ui}</QueryClientProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

function mockHorizon(handler: (url: string) => { status: number; body: unknown }) {
  global.fetch = jest.fn(async (url: string) => {
    const { status, body } = handler(url);
    const text = JSON.stringify(body);
    return { ok: status < 400, status, text: async () => text, json: async () => body };
  }) as any;
}

describe("BalanceCard", () => {
  it("shows the SDK balance and the Unfunded state when Horizon 404s", async () => {
    mockHorizon(() => ({ status: 404, body: {} }));
    const onSend = jest.fn();
    const screen = await wrap(
      <BalanceCard walletAddress={ADDR} onSend={onSend} onReceive={() => {}} />
    );

    await waitFor(() => expect(screen.getByTestId("balance-value")).toHaveTextContent("1,240.5"));
    await waitFor(() => expect(screen.getByText("Unfunded")).toBeTruthy());
    await fireEvent.press(screen.getByTestId("send-button"));
    expect(onSend).toHaveBeenCalled();
  });

  it("shows Active when the account exists", async () => {
    mockHorizon(() => ({ status: 200, body: { id: ADDR } }));
    const screen = await wrap(
      <BalanceCard walletAddress={ADDR} onSend={() => {}} onReceive={() => {}} />
    );
    await waitFor(() => expect(screen.getByText("Active")).toBeTruthy());
  });
});

describe("ActivityList", () => {
  it("renders Horizon operations with direction and amount", async () => {
    mockHorizon(() => ({
      status: 200,
      body: {
        _embedded: {
          records: [
            {
              id: "1",
              type: "payment",
              created_at: new Date().toISOString(),
              transaction_hash: "h1",
              from: "GCX4" + "B".repeat(52),
              to: ADDR,
              amount: "250.0000000",
              asset_type: "native",
            },
            {
              id: "2",
              type: "payment",
              created_at: new Date().toISOString(),
              transaction_hash: "h2",
              from: ADDR,
              to: "GA7Q" + "C".repeat(52),
              amount: "12.5000000",
              asset_type: "native",
            },
          ],
        },
      },
    }));
    const screen = await wrap(<ActivityList walletAddress={ADDR} />);
    await waitFor(() => expect(screen.getByText(/Received from GCX4/)).toBeTruthy());
    expect(screen.getByText("+250 XLM")).toBeTruthy();
    expect(screen.getByText(/Sent to GA7Q/)).toBeTruthy();
    expect(screen.getByText("−12.5 XLM")).toBeTruthy();
  });

  it("shows the empty state for an unfunded account", async () => {
    mockHorizon(() => ({ status: 404, body: {} }));
    const screen = await wrap(<ActivityList walletAddress={ADDR} />);
    await waitFor(() => expect(screen.getByText("No activity yet")).toBeTruthy());
  });
});
