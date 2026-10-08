import { describe, it, expect } from "vitest";
import {
  buildEditorialPromptBlock,
  findSourceCitationsForStation,
  generateStationVariantsWithGemini,
  defaultEditorialRules,
  defaultGlossary,
} from "./geminiService";
import { QuizStation } from "../types";

describe("geminiService editorial helpers", () => {
  const mockStation: QuizStation = {
    id: "s1",
    type: "single_choice",
    title: "Sturzrisiko Teppichkante",
    promptOrInstruction: "Welche Maßnahme sichert lose Teppichkanten im Wohnzimmer ab?",
    zqpRationale: "Rutschfeste Teppichunterleger oder Fixierbänder verhindern das Stolpern nachhaltig.",
    solutionExplanation: "Teppichkanten gehören zu den häufigsten Stolperfallen in der Häuslichkeit.",
    options: [
      { text: "Doppelseitiges Antirutsch-Klebeband", isCorrect: true, explanation: "Fixiert die Kante flach." },
      { text: "Keine Maßnahme", isCorrect: false, explanation: "Gefahr des Hängenbleibens." },
    ],
  };

  it("builds editorial prompt block containing rules and protected glossary", () => {
    const block = buildEditorialPromptBlock(defaultEditorialRules, defaultGlossary);

    expect(block).toContain("REDAKTIONELLER LEITFADEN");
    expect(block).toContain("Personenzentrierte Sprache");
    expect(block).toContain("Menschen mit Demenz");
    expect(block).toContain("Demenzkranke");
  });

  it("verifies and extracts citations when reference text contains matching terms", () => {
    const sourceDocument = `
      Sturzprävention in der häuslichen Pflege.
      Ein wichtiges Thema ist das Sturzrisiko durch Teppichkante und lose Läufer.
      Rutschfeste Teppichunterleger oder Klebebänder sichern lose Kanten ab und reduzieren Stürze deutlich.
      Regelmäßige Kontrollen der Wohnräume erhöhen die Sicherheit.
    `;

    const match = findSourceCitationsForStation(mockStation, sourceDocument);

    expect(match.isVerified).toBe(true);
    expect(match.score).toBeGreaterThanOrEqual(40);
    expect(match.bestQuote).toContain("Teppich");
    expect(match.matchedKeywords.length).toBeGreaterThan(0);
  });

  it("warns when reference text does not cover the station", () => {
    const unrelatedDocument = `
      Reine Ernährungsberatung:
      Viel Wasser trinken und ballaststoffreiche Kost bevorzugen.
      Obst und Gemüse täglich verzehren.
    `;

    const match = findSourceCitationsForStation(mockStation, unrelatedDocument);

    expect(match.isVerified).toBe(false);
    expect(match.score).toBeLessThan(40);
  });

  it("generates 3 diverse offline station variants without api key", async () => {
    const variants = await generateStationVariantsWithGemini({
      apiKey: "",
      model: "gemini-3.8-flash",
      station: mockStation,
      contextTopic: "Sturzprävention",
    });

    expect(variants).toHaveLength(3);
    expect(variants[0].title).toContain("Fokussiert");
    expect(variants[1].title).toContain("Praxisfall");
    expect(variants[2].type).toBe("dilemma");
  });
});

describe("geminiService model validation and migration", () => {
  it("detects invalid / hallucinated Gemini models correctly", async () => {
    const { isInvalidGeminiModel } = await import("./geminiService");

    expect(isInvalidGeminiModel("gemini-3.0-flash")).toBe(true);
    expect(isInvalidGeminiModel("gemini-3.0-pro")).toBe(true);
    expect(isInvalidGeminiModel("gemini-pro")).toBe(true);
    expect(isInvalidGeminiModel("gpt-4o")).toBe(true);
    expect(isInvalidGeminiModel("")).toBe(true);

    expect(isInvalidGeminiModel("gemini-3.8-flash")).toBe(false);
    expect(isInvalidGeminiModel("gemini-3.8-pro")).toBe(true);
    expect(isInvalidGeminiModel("gemini-2.0-flash")).toBe(false);
  });

  it("auto-migrates stored settings from gemini-3.0-flash to gemini-3.8-flash", async () => {
    const store: Record<string, string> = {
      zqp_quiz_generator_settings: JSON.stringify({
        geminiApiKey: "fake-key",
        selectedModel: "gemini-3.0-flash",
        availableModels: ["gemini-3.0-flash"],
      }),
    };

    globalThis.localStorage = {
      getItem: (key: string) => store[key] ?? null,
      setItem: (key: string, value: string) => {
        store[key] = String(value);
      },
      removeItem: (key: string) => {
        delete store[key];
      },
      clear: () => {},
      key: () => null,
      length: 1,
    } as any;

    const { loadSettings } = await import("./geminiService");
    const loaded = loadSettings();
    expect(loaded.selectedModel).toBe("gemini-3.8-flash");
    expect(loaded.availableModels).toContain("gemini-3.8-flash");
    expect(loaded.availableModels).not.toContain("gemini-3.0-flash");
  });
});
