import { QuizTheme } from "../types";

export const DEFAULT_THEME_ID = "zqp-petrol";
export const CUSTOM_THEMES_STORAGE_KEY = "zqp_quiz_custom_themes_v1";

export const BUILTIN_THEMES: QuizTheme[] = [
  {
    id: "zqp-petrol",
    name: "ZQP Petrol (Klassisch)",
    description: "Offizielles ZQP Corporate Design mit markantem Petrol-Farbverlauf.",
    badge: "ZQP-Standard",
    isBuiltin: true,
    colors: {
      primary: "#247a6d",
      primaryDark: "#1b5c53",
      primaryDeep: "#00473d",
      primaryLight: "#e3eeec",
      accent: "#3d998c",
      bgRoot: "#fcfaf8",
      bgStage: "#f3f8f7",
      cardBg: "#ffffff",
      border: "#bbd1cd",
      textMain: "#444444",
      textMuted: "#6e6c70",
      headerText: "#ffffff",
    },
  },
  {
    id: "zqp-wine-red",
    name: "ZQP Weinrot (Aufklärung)",
    description: "Offizielle ZQP-Sekundärfarbe für Gewaltprävention, Notfälle & Krisen.",
    badge: "ZQP-Rot",
    isBuiltin: true,
    colors: {
      primary: "#722b28",
      primaryDark: "#581f1d",
      primaryDeep: "#3d1413",
      primaryLight: "#f9ebea",
      accent: "#973935",
      bgRoot: "#fcfaf8",
      bgStage: "#fdf5f5",
      cardBg: "#ffffff",
      border: "#e8cfce",
      textMain: "#444444",
      textMuted: "#6e6c70",
      headerText: "#ffffff",
    },
  },
  {
    id: "zqp-sirocco",
    name: "ZQP Salbei & Sirocco",
    description: "Gedecktes ZQP-Graugrün für wissenschaftliche Leitlinien & Expertenstandards.",
    badge: "Evidenz",
    isBuiltin: true,
    colors: {
      primary: "#5b7c7b",
      primaryDark: "#436968",
      primaryDeep: "#2d4948",
      primaryLight: "#d6e6e1",
      accent: "#7b9999",
      bgRoot: "#f7faf9",
      bgStage: "#eef4f2",
      cardBg: "#ffffff",
      border: "#b6bfbd",
      textMain: "#444444",
      textMuted: "#6e6c70",
      headerText: "#ffffff",
    },
  },
  {
    id: "zqp-creme",
    name: "ZQP Sand & Creme",
    description: "ZQP-Wohnberatungsdesign für Häuslichkeit, Sturzschutz & Alltagsbegleitung.",
    badge: "Wohnumfeld",
    isBuiltin: true,
    colors: {
      primary: "#997e51",
      primaryDark: "#786139",
      primaryDeep: "#534325",
      primaryLight: "#f5eedf",
      accent: "#ded2b8",
      bgRoot: "#fcfaf8",
      bgStage: "#f9f6ef",
      cardBg: "#ffffff",
      border: "#ded2b8",
      textMain: "#444444",
      textMuted: "#6e6c70",
      headerText: "#ffffff",
    },
  },
  {
    id: "zqp-mint",
    name: "ZQP Minze & Frische",
    description: "Helle ZQP-Minzwelt für Vitalität, Aktivierung & Bewegungsförderung.",
    badge: "Prävention",
    isBuiltin: true,
    colors: {
      primary: "#3d998c",
      primaryDark: "#247a6d",
      primaryDeep: "#1b5c53",
      primaryLight: "#d2e2dd",
      accent: "#247a6d",
      bgRoot: "#f3f8f7",
      bgStage: "#e8f2ef",
      cardBg: "#ffffff",
      border: "#bbd1cd",
      textMain: "#444444",
      textMuted: "#6e6c70",
      headerText: "#ffffff",
    },
  },
  {
    id: "zqp-slate",
    name: "ZQP Schiefer & Klartext",
    description: "Hoher Kontrast mit ZQP Soft Black und Silbergrau für Leichte Sprache.",
    badge: "Barrierearm",
    isBuiltin: true,
    colors: {
      primary: "#444444",
      primaryDark: "#222222",
      primaryDeep: "#000000",
      primaryLight: "#e3eeec",
      accent: "#247a6d",
      bgRoot: "#ffffff",
      bgStage: "#f9fafb",
      cardBg: "#ffffff",
      border: "#8a8a8a",
      textMain: "#222222",
      textMuted: "#555555",
      headerText: "#ffffff",
    },
  },
];

export function loadCustomThemes(): QuizTheme[] {
  try {
    if (typeof localStorage === "undefined" || typeof localStorage.getItem !== "function") return [];
    const raw = localStorage.getItem(CUSTOM_THEMES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter((t) => t && t.id && t.colors);
    }
  } catch (err) {
    console.warn("Fehler beim Laden der benutzerdefinierten Themes:", err);
  }
  return [];
}

export function saveCustomTheme(theme: QuizTheme): boolean {
  try {
    if (typeof localStorage === "undefined" || typeof localStorage.setItem !== "function") return false;
    const customThemes = loadCustomThemes();
    const existingIdx = customThemes.findIndex((t) => t.id === theme.id);
    const toSave: QuizTheme = {
      ...theme,
      isBuiltin: false,
    };
    if (existingIdx >= 0) {
      customThemes[existingIdx] = toSave;
    } else {
      customThemes.push(toSave);
    }
    localStorage.setItem(CUSTOM_THEMES_STORAGE_KEY, JSON.stringify(customThemes));
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("zqp_themes_changed", { detail: { themeId: theme.id } }));
    }
    return true;
  } catch (err) {
    console.warn("Fehler beim Speichern des Themes:", err);
    return false;
  }
}

export function deleteCustomTheme(themeId: string): boolean {
  try {
    if (typeof localStorage === "undefined" || typeof localStorage.setItem !== "function") return false;
    const customThemes = loadCustomThemes();
    const filtered = customThemes.filter((t) => t.id !== themeId);
    localStorage.setItem(CUSTOM_THEMES_STORAGE_KEY, JSON.stringify(filtered));
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("zqp_themes_changed", { detail: { themeId } }));
    }
    return true;
  } catch (err) {
    console.warn("Fehler beim Löschen des Themes:", err);
    return false;
  }
}

export function duplicateTheme(baseTheme: QuizTheme, customName?: string): QuizTheme {
  const newId = "custom-theme-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6);
  return {
    id: newId,
    name: customName || `${baseTheme.name} (Kopie)`,
    description: `Basiert auf ${baseTheme.name}.`,
    badge: "Eigenes Design",
    isBuiltin: false,
    colors: { ...baseTheme.colors },
  };
}

export function getAllThemes(): QuizTheme[] {
  const custom = loadCustomThemes();
  return [...BUILTIN_THEMES, ...custom];
}

export function getThemeById(themeId?: string, customTheme?: QuizTheme): QuizTheme {
  if (customTheme && customTheme.colors) {
    return customTheme;
  }
  const all = getAllThemes();
  const found = all.find((t) => t.id === themeId);
  if (found) return found;
  return BUILTIN_THEMES[0];
}

export function buildThemeCssVariables(theme: QuizTheme): Record<string, string> {
  const c = theme.colors;
  return {
    "--zqp-primary": c.primary,
    "--zqp-primary-dark": c.primaryDark,
    "--zqp-primary-deep": c.primaryDeep,
    "--zqp-primary-light": c.primaryLight,
    "--zqp-accent": c.accent,
    "--zqp-bg-root": c.bgRoot,
    "--zqp-bg-stage": c.bgStage || c.bgRoot,
    "--zqp-card-bg": c.cardBg,
    "--zqp-border": c.border,
    "--zqp-text-main": c.textMain,
    "--zqp-text-muted": c.textMuted,
    "--zqp-header-text": c.headerText,
  };
}

export function buildThemeCssVariablesString(theme: QuizTheme): string {
  const vars = buildThemeCssVariables(theme);
  return Object.entries(vars)
    .map(([k, v]) => `  ${k}: ${v};`)
    .join("\n");
}
