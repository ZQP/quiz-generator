import { describe, it, expect } from "vitest";
import { analyzeQuizQuality } from "./qualityAnalyzer";
import { QuizGenerationResult } from "../types";

describe("qualityAnalyzer", () => {
  const mockQuiz: QuizGenerationResult = {
    title: "Sturzprävention im Alltag",
    targetAudience: "angehoerige",
    summary: "Wichtige Tipps zur Vermeidung von Stürzen in der häuslichen Pflege.",
    needsTailwind: true,
    needsFontAwesome: false,
    generatedHtml: "",
    generatedCss: "",
    generatedJs: "",
    stations: [
      {
        id: "s1",
        type: "single_choice",
        title: "Beleuchtung im Flur",
        promptOrInstruction: "Welche Beleuchtung schützt am besten vor Stürzen?",
        zqpRationale: "Gute Ausleuchtung verhindert Orientierungsverlust bei Nacht.",
        solutionExplanation: "Mindestens 200 bis 300 Lux blendfreies Licht werden empfohlen.",
        options: [
          {
            text: "Dunkles Schlummerlicht",
            isCorrect: false,
            explanation: "Zu dunkel für ältere Augen.",
          },
          {
            text: "Blendfreie, helle Ausleuchtung",
            isCorrect: true,
            explanation: "Sorgt für klare Kontraste und Sichtbarkeit von Kanten.",
          },
        ],
      },
    ],
  };

  it("calculates accessibility score meeting WCAG 2.1 AA requirements", () => {
    const report = analyzeQuizQuality(mockQuiz);

    expect(report.accessibilityScore).toBeGreaterThanOrEqual(95);
    expect(report.findings.some((f) => f.title.includes("WCAG"))).toBe(true);
  });

  it("evaluates German Flesch reading index and provides readability score", () => {
    const report = analyzeQuizQuality(mockQuiz);

    expect(report.fleschIndex).toBeGreaterThan(0);
    expect(report.readabilityScore).toBeGreaterThan(0);
    expect(report.fleschRatingText).toBeDefined();
    expect(report.avgSentenceLength).toBeGreaterThan(0);
  });

  it("evaluates didactic completeness when options have rationale", () => {
    const report = analyzeQuizQuality(mockQuiz);

    expect(report.didacticScore).toBe(100);
    expect(report.overallScore).toBeGreaterThanOrEqual(80);
  });
});
