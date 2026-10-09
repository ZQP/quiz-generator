import { describe, it, expect } from "vitest";
import { analyzeQuizQuality, applyGlossaryFixesToQuiz } from "./qualityAnalyzer";
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

  it("detects prohibited glossary terms and reports them in glossaryViolations", () => {
    const dirtyQuiz: QuizGenerationResult = {
      ...mockQuiz,
      title: "Quiz für Demenzkranke und Bettlägerige",
      stations: [
        {
          ...mockQuiz.stations[0],
          promptOrInstruction: "Wie sollten Demenzkranke im Altenheim gepflegt werden?",
        },
      ],
    };

    const report = analyzeQuizQuality(dirtyQuiz);

    expect(report.glossaryViolations.length).toBeGreaterThan(0);
    expect(report.glossaryViolations.some((v) => v.term === "Demenzkranke")).toBe(true);
    expect(report.glossaryViolations.some((v) => v.term === "Bettlägerige")).toBe(true);
    expect(report.glossaryViolations.some((v) => v.term === "Altenheim")).toBe(true);
    expect(report.findings.some((f) => f.title.includes("ZQP-Fachglossar"))).toBe(true);
  });

  it("applies 1-click glossary fixes and restores 100% compliance", () => {
    const dirtyQuiz: QuizGenerationResult = {
      ...mockQuiz,
      title: "Quiz für Demenzkranke",
      stations: [
        {
          ...mockQuiz.stations[0],
          promptOrInstruction: "Betreuung im Altenheim für Pflegefälle.",
        },
      ],
    };

    const fixed = applyGlossaryFixesToQuiz(dirtyQuiz);
    expect(fixed.title).toContain("Menschen mit Demenz");
    expect(fixed.title).not.toContain("Demenzkranke");
    expect(fixed.stations[0].promptOrInstruction).toContain("Pflegeeinrichtung");
    expect(fixed.stations[0].promptOrInstruction).toContain("Pflegebedürftige");

    const newReport = analyzeQuizQuality(fixed);
    expect(newReport.glossaryViolations).toHaveLength(0);
    expect(newReport.glossaryScore).toBe(100);
  });
});
