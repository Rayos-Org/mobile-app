import { alpha, buildTheme, darkColors, lightColors } from "@/lib/theme";

describe("theme tokens", () => {
  it("builds light and dark themes with matching token sets", () => {
    const light = buildTheme("light");
    const dark = buildTheme("dark");
    expect(light.isDark).toBe(false);
    expect(dark.isDark).toBe(true);
    expect(Object.keys(light.colors).sort()).toEqual(Object.keys(dark.colors).sort());
  });

  it("matches the web-dashboard brand palette", () => {
    // web-dashboard/app/globals.css
    expect(lightColors.primary).toBe("#4F46E5");
    expect(lightColors.background).toBe("#F8FAFC");
    expect(darkColors.primary).toBe("#6D6AF7");
    expect(darkColors.background).toBe("#070A12");
    expect(darkColors.card).toBe("#0D1220");
  });

  it("keeps every colour token a valid colour string", () => {
    const re = /^(#[0-9A-Fa-f]{6}|rgba?\([^)]+\))$/;
    for (const scheme of [lightColors, darkColors]) {
      for (const [key, value] of Object.entries(scheme)) {
        expect({ key, ok: re.test(value) }).toEqual({ key, ok: true });
      }
    }
  });
});

describe("alpha", () => {
  it("converts hex to rgba", () => {
    expect(alpha("#4F46E5", 0.5)).toBe("rgba(79,70,229,0.5)");
    expect(alpha("#fff", 1)).toBe("rgba(255,255,255,1)");
  });
  it("passes rgba through untouched", () => {
    expect(alpha("rgba(1,2,3,0.4)", 0.9)).toBe("rgba(1,2,3,0.4)");
  });
});
