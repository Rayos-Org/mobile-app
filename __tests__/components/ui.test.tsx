import React from "react";
import { fireEvent, render } from "@testing-library/react-native";
import { ThemeProvider, useTheme } from "@/hooks/useTheme";
import { Badge, Button, Card, CardHeader, EmptyState, Input, Text } from "@/components/ui";
import { darkColors, lightColors } from "@/lib/theme";

function Probe() {
  const { colors, scheme } = useTheme();
  return <Text testID="probe">{`${scheme}:${colors.background}`}</Text>;
}

const wrap = (ui: React.ReactElement) => render(<ThemeProvider>{ui}</ThemeProvider>);

// RN's jest preset hard-codes useColorScheme() → "light"; make it controllable.
let mockScheme: "light" | "dark" = "light";
jest.mock("react-native/Libraries/Utilities/useColorScheme", () => ({
  __esModule: true,
  default: () => mockScheme,
}));

describe("ThemeProvider follows the system colour scheme", () => {
  it("resolves light when the OS is light", async () => {
    mockScheme = "light";
    const screen = await wrap(<Probe />);
    expect(screen.getByTestId("probe")).toHaveTextContent(`light:${lightColors.background}`);
  });

  it("resolves dark when the OS is dark", async () => {
    mockScheme = "dark";
    const screen = await wrap(<Probe />);
    expect(screen.getByTestId("probe")).toHaveTextContent(`dark:${darkColors.background}`);
  });
});

describe("Button", () => {
  it("renders label, fires onPress, and blocks when disabled/loading", async () => {
    const onPress = jest.fn();
    const screen = await wrap(
      <>
        <Button onPress={onPress} testID="b1">
          Continue
        </Button>
        <Button onPress={onPress} disabled testID="b2">
          Nope
        </Button>
        <Button onPress={onPress} loading testID="b3">
          Loading
        </Button>
      </>
    );
    await fireEvent.press(screen.getByTestId("b1"));
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Continue")).toBeTruthy();

    await fireEvent.press(screen.getByTestId("b2"));
    await fireEvent.press(screen.getByTestId("b3"));
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(screen.queryByText("Loading")).toBeNull(); // spinner replaces label
    expect(screen.getByTestId("b3")).toBeBusy();
  });
});

describe("Input", () => {
  it("shows label, hint and error states", async () => {
    const screen = await wrap(<Input label="Amount" hint="In XLM" placeholder="0" />);
    const { rerender } = screen;
    expect(screen.getByText("Amount")).toBeTruthy();
    expect(screen.getByText("In XLM")).toBeTruthy();
    await rerender(
      <ThemeProvider>
        <Input label="Amount" hint="In XLM" error="Too low" placeholder="0" />
      </ThemeProvider>
    );
    expect(screen.getByText("Too low")).toBeTruthy();
    expect(screen.queryByText("In XLM")).toBeNull();
  });

  it("propagates text changes", async () => {
    const onChange = jest.fn();
    const screen = await wrap(<Input placeholder="G…" onChangeText={onChange} />);
    await fireEvent.changeText(screen.getByPlaceholderText("G…"), "GABC");
    expect(onChange).toHaveBeenCalledWith("GABC");
  });
});

describe("Card / Badge / EmptyState", () => {
  it("render their content", async () => {
    const screen = await wrap(
      <Card>
        <CardHeader title="Recent activity" description="From Horizon" />
        <Badge variant="success" dot>
          Active
        </Badge>
        <EmptyState title="Nothing here" description="Yet." />
      </Card>
    );
    expect(screen.getByText("Recent activity")).toBeTruthy();
    expect(screen.getByText("From Horizon")).toBeTruthy();
    expect(screen.getByText("Active")).toBeTruthy();
    expect(screen.getByText("Nothing here")).toBeTruthy();
  });
});
