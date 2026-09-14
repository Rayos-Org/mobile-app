import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { ThemeProvider } from "@/hooks/useTheme";
import { ToastProvider } from "@/components/ui";
import { BalanceCard } from "@/components/wallet/BalanceCard";
import { ActivityList } from "@/components/wallet/ActivityList";
import { walletSdk } from "@/lib/sdk-client";

const ADDR = "C" + "A".repeat(55);
const SPONSOR = "G" + "B".repeat(55);

jest.mock("@/lib/sdk-client", () => ({
  walletSdk: {
    getWalletState: jest.fn(),
    getRecentTransfers: jest.fn(),
    requestFaucet: jest.fn(),
  },
}));
const mockSdk = walletSdk as unknown as {
  getWalletState: jest.Mock;
  getRecentTransfers: jest.Mock;
  requestFaucet: jest.Mock;
};

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

beforeEach(() => {
  mockSdk.getWalletState.mockReset();
  mockSdk.getRecentTransfers.mockReset();
  mockSdk.requestFaucet.mockReset();
});

describe("BalanceCard", () => {
  it("shows the contract balance, the Unfunded state, and offers the faucet", async () => {
    mockSdk.getWalletState.mockResolvedValue({
      address: ADDR,
      signers: [{}],
      balance: 0n,
      exists: true,
    });
    mockSdk.requestFaucet.mockResolvedValue({ txHash: "abc", amount: "1000000000" });
    const onSend = jest.fn();
    const screen = await wrap(
      <BalanceCard walletAddress={ADDR} onSend={onSend} onReceive={() => {}} />
    );

    await waitFor(() => expect(screen.getByText("Unfunded")).toBeTruthy());
    expect(screen.getByTestId("balance-value")).toHaveTextContent("0");
    // Send is disabled while the wallet is empty.
    expect(screen.getByTestId("send-button")).toBeDisabled();

    await fireEvent.press(screen.getByTestId("faucet-button"));
    await waitFor(() => expect(mockSdk.requestFaucet).toHaveBeenCalledWith(ADDR));
  });

  it("shows Active with a funded balance and enables Send", async () => {
    mockSdk.getWalletState.mockResolvedValue({
      address: ADDR,
      signers: [{}],
      balance: 12_405_000_000n, // 1,240.5 XLM
      exists: true,
    });
    const onSend = jest.fn();
    const screen = await wrap(
      <BalanceCard walletAddress={ADDR} onSend={onSend} onReceive={() => {}} />
    );
    await waitFor(() => expect(screen.getByText("Active")).toBeTruthy());
    expect(screen.getByTestId("balance-value")).toHaveTextContent("1,240.5");
    await fireEvent.press(screen.getByTestId("send-button"));
    expect(onSend).toHaveBeenCalled();
  });

  it("flags a wallet that is not deployed", async () => {
    mockSdk.getWalletState.mockResolvedValue({
      address: ADDR,
      signers: [],
      balance: 0n,
      exists: false,
    });
    const screen = await wrap(
      <BalanceCard walletAddress={ADDR} onSend={() => {}} onReceive={() => {}} />
    );
    await waitFor(() => expect(screen.getByText("Not deployed")).toBeTruthy());
  });
});

describe("ActivityList", () => {
  it("renders on-chain transfers with direction and amount", async () => {
    mockSdk.getRecentTransfers.mockResolvedValue([
      {
        at: new Date().toISOString(),
        ledger: 2,
        txHash: "h2",
        from: ADDR,
        to: SPONSOR,
        amount: 25_000_000n,
        direction: "out",
      },
      {
        at: new Date().toISOString(),
        ledger: 1,
        txHash: "h1",
        from: SPONSOR,
        to: ADDR,
        amount: 1_000_000_000n,
        direction: "in",
      },
    ]);
    const screen = await wrap(<ActivityList walletAddress={ADDR} />);
    await waitFor(() => expect(screen.getByText(/Received from/)).toBeTruthy());
    expect(screen.getByText("+100 XLM")).toBeTruthy();
    expect(screen.getByText(/Sent to/)).toBeTruthy();
    expect(screen.getByText("−2.5 XLM")).toBeTruthy();
  });

  it("shows the empty state for a fresh wallet", async () => {
    mockSdk.getRecentTransfers.mockResolvedValue([]);
    const screen = await wrap(<ActivityList walletAddress={ADDR} />);
    await waitFor(() => expect(screen.getByText("No activity yet")).toBeTruthy());
  });
});
