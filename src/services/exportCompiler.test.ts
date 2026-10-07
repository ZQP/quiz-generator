import { describe, it, expect } from "vitest";
import { compileQuizToBundle } from "./exportCompiler";
import { QuizGenerationResult } from "../types";

describe("exportCompiler - compileQuizToBundle", () => {
  const sampleQuiz: QuizGenerationResult = {
    title: "Test-Quiz Pflege & Schutz",
    targetAudience: "angehoerige",
    summary: "Wichtige Praxishinweise für Angehörige.",
    needsTailwind: true,
    needsFontAwesome: false,
    generatedHtml: "",
    generatedCss: "",
    generatedJs: "",
    stations: [
      {
        id: "s1",
        type: "matching",
        title: "Gefahren im Bad",
        promptOrInstruction: "Verbinden Sie die Gefahrenquelle mit der Maßnahme.",
        zqpRationale: "Bäder bergen hohes Rutschpotenzial.",
        solutionExplanation: "Antirutschmatten und Haltegriffe bieten Schutz.",
        matchingPairs: [
          {
            id: "p1",
            threatOrTerm: "Nasse Fliesen",
            solutionOrDef: "Antirutschmatte",
          },
        ],
      },
      {
        id: "s2",
        type: "dilemma",
        title: "Selbstbestimmung vs. Sicherheit",
        promptOrInstruction: "Wählen Sie die beste Reaktion:",
        zqpRationale: "Freiheitsentziehende Maßnahmen sind ultima ratio.",
        solutionExplanation: "Gespräch und technische Hilfsmittel wahren die Würde.",
        dilemmaReactions: [
          {
            id: "r1",
            text: "Bettgitter eigenmächtig hochziehen.",
            isOptimal: false,
            consequence: "Erheblicher Eingriff in die Bewegungsfreiheit.",
            zqpAdvice: "Bettgitter erfordern rechtliche Legitimation.",
          },
          {
            id: "r2",
            text: "Niederflurbett und Sensormatte einsetzen.",
            isOptimal: true,
            consequence: "Reduziert die Sturzhöhe ohne Freiheitsentzug.",
            zqpAdvice: "Empfohlener Standard nach Expertenstandard Sturz.",
          },
        ],
      },
      {
        id: "s3",
        type: "single_choice",
        title: "Beleuchtung",
        promptOrInstruction: "Welche Lichtstärke ist im Flur ideal?",
        zqpRationale: "Gute Ausleuchtung verhindert Orientierungsverlust.",
        solutionExplanation: "Mindestens 200–300 Lux werden empfohlen.",
        options: [
          {
            text: "30 Lux (Schlummerlicht)",
            isCorrect: false,
            explanation: "Zu dunkel für ältere Augen.",
          },
          {
            text: "300 Lux (Blendfrei)",
            isCorrect: true,
            explanation: "Sorgt für klare Kontraste.",
          },
        ],
      },
      {
        id: "s4",
        type: "ordering",
        title: "Notfallkette",
        promptOrInstruction: "Bringen Sie die Schritte in Reihenfolge.",
        zqpRationale: "Strukturierte Hilfe rettet Leben.",
        solutionExplanation: "Reihenfolge: Prüfen, Rufen, Trösten.",
        orderingSteps: [
          { id: "o1", text: "Ruhe bewahren und ansprechen", correctIndex: 0 },
          { id: "o2", text: "Verletzungen prüfen & Notruf", correctIndex: 1 },
        ],
      },
      {
        id: "s5",
        type: "myth_fact",
        title: "Mythencheck",
        promptOrInstruction: "Ist dies Fakt oder Mythos?",
        zqpRationale: "Mythen führen zu falscher Schonung.",
        solutionExplanation: "Bewegung beugt Stürzen am effektivsten vor.",
        mythFactItems: [
          {
            id: "mf1",
            statement: "Wer unsicher geht, sollte sich möglichst wenig bewegen.",
            isFact: false,
            explanation: "Muskelabbau verstärkt die Unsicherheit rasch.",
          },
        ],
      },
      {
        id: "s6",
        type: "bucket_sort",
        title: "Schuhe sortieren",
        promptOrInstruction: "Ordnen Sie die Schuhtypen zu.",
        zqpRationale: "Schuhe sind ein Schlüsselfaktor.",
        solutionExplanation: "Fersenkappe und Profilsohle schützen.",
        bucketSortItems: [
          {
            id: "bs1",
            text: "Schlupfpantoffeln mit Filzsohle",
            targetBucket: "dont",
            explanation: "Rutschgefahr und fehlender Halt an der Ferse.",
          },
          {
            id: "bs2",
            text: "Feste Klettschuhe mit Gummiprofil",
            targetBucket: "do",
            explanation: "Optimale Stabilität.",
          },
        ],
      },
      {
        id: "s7",
        type: "checklist",
        title: "Sturz-Checkliste",
        promptOrInstruction: "Wählen Sie die 3 Schutzmaßnahmen.",
        zqpRationale: "Prävention im Wohnbereich.",
        solutionExplanation: "Kabelführung, Nachtlicht und Haltegriffe.",
        checklistItems: [
          { id: "c1", text: "Lose Kabel fixieren", isCorrect: true, explanation: "Beseitigt Stolperfalle." },
          { id: "c2", text: "Teppichbrücken ohne Rutschschutz", isCorrect: false, explanation: "Gefährliche Rutschkante." },
        ],
      },
      {
        id: "s8",
        type: "comparison",
        title: "Situationsvergleich",
        promptOrInstruction: "Welches Zimmer ist sicherer eingerichtet?",
        zqpRationale: "Übersichtliche Raumgestaltung.",
        solutionExplanation: "Zimmer B ist barrierefrei.",
        comparisonScenarios: [
          {
            id: "cs1",
            title: "Zimmer A",
            badge: "Hochflor-Teppich",
            description: "Dicker Teppichboden mit Kanten.",
            isCorrect: false,
            explanation: "Hohes Stolperrisiko.",
          },
          {
            id: "cs2",
            title: "Zimmer B",
            badge: "Ebene Lauffläche",
            description: "Stolperfreie Bodenbeläge.",
            isCorrect: true,
            explanation: "Sicherer Tritt.",
          },
        ],
      },
      {
        id: "s9",
        type: "fill_in_the_blank",
        title: "Lückentext",
        promptOrInstruction: "Setzen Sie die passenden Wörter ein.",
        zqpRationale: "Fachbegriffe trainieren.",
        solutionExplanation: "Fester Halt und Gehhilfen sichern den Gang.",
        fillInSentence: "Bei Unsicherheit bietet ein [BLANK_1] zusätzliche Stabilität.",
        fillInBlanks: [
          {
            id: "BLANK_1",
            correctWord: "Handlauf",
            options: ["Handlauf", "Türgriff"],
          },
        ],
      },
    ],
  };

  it("produces all required bundle segments", () => {
    const bundle = compileQuizToBundle(sampleQuiz);

    expect(bundle.html).toBeDefined();
    expect(bundle.css).toBeDefined();
    expect(bundle.js).toBeDefined();
    expect(bundle.tailwindConfig).toBeDefined();
    expect(bundle.fullStandaloneHtml).toBeDefined();
  });

  it("embeds #zqp-game-root container and drawer in generated HTML", () => {
    const bundle = compileQuizToBundle(sampleQuiz);

    expect(bundle.html).toContain('id="zqp-game-root"');
    expect(bundle.html).toContain('id="zqp-drawer"');
    expect(bundle.html).toContain('id="zqp-station-content"');
    expect(bundle.html).toContain("Stiftung Zentrum für Qualität in der Pflege");
  });

  it("includes dilemma interactive logic and dispatcher in generated JavaScript", () => {
    const bundle = compileQuizToBundle(sampleQuiz);

    expect(bundle.js).toContain("renderDilemma");
    expect(bundle.js).toContain("window.zqpSelectDilemma");
    expect(bundle.js).toContain('st.type === "dilemma"');
  });

  it("creates a valid standalone HTML5 document with CDN and inline scripts", () => {
    const bundle = compileQuizToBundle(sampleQuiz);

    expect(bundle.fullStandaloneHtml).toContain("<!DOCTYPE html>");
    expect(bundle.fullStandaloneHtml).toContain("<html lang=\"de\">");
    expect(bundle.fullStandaloneHtml).toContain("cdn.tailwindcss.com");
    expect(bundle.fullStandaloneHtml).toContain("tailwind.config = {");
    expect(bundle.fullStandaloneHtml).toContain('id="zqp-game-root"');
    expect(bundle.fullStandaloneHtml).toContain("</html>");
  });

  it("handles enablePrintSummary correctly in CSS and JS", () => {
    // When disabled / omitted
    const bundleDefault = compileQuizToBundle(sampleQuiz);
    expect(bundleDefault.css).toContain("@media print");
    expect(bundleDefault.js).toContain("var enablePrintSummary = false;");

    // When explicitly enabled
    const quizWithPrint: QuizGenerationResult = {
      ...sampleQuiz,
      enablePrintSummary: true,
    };
    const bundleWithPrint = compileQuizToBundle(quizWithPrint);
    expect(bundleWithPrint.js).toContain("var enablePrintSummary = true;");
    expect(bundleWithPrint.js).toContain("Ergebnis als PDF drucken");
    expect(bundleWithPrint.js).toContain("window.print()");
  });
});
