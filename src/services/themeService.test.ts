import { describe, it, expect, beforeEach } from "vitest";
import {
  BUILTIN_THEMES,
  DEFAULT_THEME_ID,
  getAllThemes,
  getThemeById,
  duplicateTheme,
  saveCustomTheme,
  loadCustomThemes,
  deleteCustomTheme,
  buildThemeCssVariables,
  buildThemeCssVariablesString,
} from "./themeService";
import { QuizTheme } from "../types";

describe("themeService ZQP Theme Engine", () => {
  const store: Record<string, string> = {};

  beforeEach(() => {
    for (const key of Object.keys(store)) {
      delete store[key];
    }

    globalThis.localStorage = {
      getItem: (key: string) => store[key] ?? null,
      setItem: (key: string, value: string) => {
        store[key] = String(value);
      },
      removeItem: (key: string) => {
        delete store[key];
      },
      clear: () => {
        for (const key of Object.keys(store)) {
          delete store[key];
        }
      },
      key: (index: number) => Object.keys(store)[index] ?? null,
      get length() {
        return Object.keys(store).length;
      },
    } as Storage;
  });

  it("provides exactly 6 authentic built-in ZQP themes", () => {
    expect(BUILTIN_THEMES).toHaveLength(6);
    expect(BUILTIN_THEMES.map((t) => t.id)).toEqual([
      "zqp-petrol",
      "zqp-wine-red",
      "zqp-sirocco",
      "zqp-creme",
      "zqp-mint",
      "zqp-slate",
    ]);
  });

  it("validates that all built-in themes have complete and valid hex color definitions", () => {
    const hexRegex = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

    BUILTIN_THEMES.forEach((theme) => {
      expect(theme.isBuiltin).toBe(true);
      expect(theme.name.length).toBeGreaterThan(0);
      expect(theme.description.length).toBeGreaterThan(0);

      const { colors } = theme;
      expect(colors.primary).toMatch(hexRegex);
      expect(colors.primaryDark).toMatch(hexRegex);
      expect(colors.primaryDeep).toMatch(hexRegex);
      expect(colors.primaryLight).toMatch(hexRegex);
      expect(colors.accent).toMatch(hexRegex);
      expect(colors.bgRoot).toMatch(hexRegex);
      expect(colors.cardBg).toMatch(hexRegex);
      expect(colors.border).toMatch(hexRegex);
      expect(colors.textMain).toMatch(hexRegex);
      expect(colors.textMuted).toMatch(hexRegex);
      expect(colors.headerText).toMatch(hexRegex);
    });
  });

  it("resolves default theme for undefined or unknown theme IDs", () => {
    const def = getThemeById();
    expect(def.id).toBe(DEFAULT_THEME_ID);
    expect(def.name).toContain("Petrol");

    const unknown = getThemeById("unknown-xyz");
    expect(unknown.id).toBe(DEFAULT_THEME_ID);
  });

  it("resolves specific theme by ID", () => {
    const wine = getThemeById("zqp-wine-red");
    expect(wine.id).toBe("zqp-wine-red");
    expect(wine.colors.primary).toBe("#722b28");
  });

  it("allows duplicating an existing theme as a base for customization", () => {
    const base = getThemeById("zqp-petrol");
    const duplicate = duplicateTheme(base, "Mein ZQP Theme");

    expect(duplicate.id).not.toBe(base.id);
    expect(duplicate.id).toContain("custom-theme-");
    expect(duplicate.name).toBe("Mein ZQP Theme");
    expect(duplicate.isBuiltin).toBe(false);
    expect(duplicate.colors).toEqual(base.colors);
  });

  it("saves, loads, and deletes custom themes in localStorage", () => {
    const base = getThemeById("zqp-sirocco");
    const custom: QuizTheme = {
      ...duplicateTheme(base, "Klinik Salbei"),
      colors: {
        ...base.colors,
        primary: "#336655",
      },
    };

    const saved = saveCustomTheme(custom);
    expect(saved).toBe(true);

    const loaded = loadCustomThemes();
    expect(loaded).toHaveLength(1);
    expect(loaded[0].id).toBe(custom.id);
    expect(loaded[0].colors.primary).toBe("#336655");

    const all = getAllThemes();
    expect(all).toHaveLength(7); // 6 builtin + 1 custom

    // Delete custom theme
    const deleted = deleteCustomTheme(custom.id);
    expect(deleted).toBe(true);
    expect(loadCustomThemes()).toHaveLength(0);
    expect(getAllThemes()).toHaveLength(6);
  });

  it("generates CSS variables correctly", () => {
    const theme = getThemeById("zqp-petrol");
    const vars = buildThemeCssVariables(theme);

    expect(vars["--zqp-primary"]).toBe("#247a6d");
    expect(vars["--zqp-primary-dark"]).toBe("#1b5c53");
    expect(vars["--zqp-text-main"]).toBe("#444444");

    const varString = buildThemeCssVariablesString(theme);
    expect(varString).toContain("--zqp-primary: #247a6d;");
    expect(varString).toContain("--zqp-border: #bbd1cd;");
  });
});
