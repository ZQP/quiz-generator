import React, { useState, useEffect } from "react";
import {
  X,
  Edit3,
  Save,
  ArrowLeft,
  ArrowRight,
  Dices,
  Star,
  Quote,
  Copy,
  Trash2,
  Plus,
  Maximize2,
  Sidebar,
  Eye,
  Award,
  Sliders,
} from "lucide-react";
import { QuizGenerationResult, QuizStation, AppSettings, EditorialStatus, StationType, QuizCustomLabels, QuizResultScreenConfig } from "../types";
import { compileQuizToBundle } from "../services/exportCompiler";
import { saveFavoriteStation } from "../services/projectStorage";
import { StationVariantsModal } from "./StationVariantsModal";

interface StationEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  quiz: QuizGenerationResult;
  initialStationIndex: number;
  onSaveQuiz: (updatedQuiz: QuizGenerationResult) => void;
  settings?: AppSettings;
}

const STATION_TYPE_LABELS: Record<StationType, string> = {
  single_choice: "Single Choice",
  matching: "Zuordnungs-Puzzle",
  ordering: "Ablauf / Reihenfolge",
  myth_fact: "Mythos vs. Fakt",
  bucket_sort: "Dos & Don'ts (Sortierung)",
  comparison: "Situationsvergleich (A vs. B)",
  dilemma: "Praxis-Dilemma",
  checklist: "Checkliste",
  fill_in_the_blank: "Lückentext",
  branching_scenario: "Verzweigtes Fallbeispiel",
};

const getStationIcon = (type?: string) => {
  switch (type) {
    case "matching": return "🧩";
    case "ordering": return "🔢";
    case "myth_fact": return "❌";
    case "bucket_sort": return "📥";
    case "comparison": return "⚖️";
    case "dilemma": return "🎭";
    case "checklist": return "📋";
    case "fill_in_the_blank": return "✍️";
    case "branching_scenario": return "🌿";
    case "single_choice":
    default:
      return "💡";
  }
};

interface StationFormatMeta {
  type: StationType;
  title: string;
  badge: string;
  icon: string;
  tagline: string;
  description: string;
}

const STATION_FORMATS: StationFormatMeta[] = [
  {
    type: "single_choice",
    title: "Single Choice",
    badge: "Wissensfrage",
    icon: "💡",
    tagline: "Klassische Multiple-Choice-Frage mit Fachbegründung",
    description: "3 Antwortoptionen mit fundierten Erklärungen für richtige und unzutreffende Optionen.",
  },
  {
    type: "matching",
    title: "Zuordnungs-Puzzle",
    badge: "Assoziation",
    icon: "🧩",
    tagline: "Gefahrenstellen und Schutzmaßnahmen miteinander verbinden",
    description: "Schult das Erkennen von Risiken und deren Entschärfung im häuslichen Wohnumfeld.",
  },
  {
    type: "ordering",
    title: "Ablauf / Reihenfolge",
    badge: "Prozesskette",
    icon: "🔢",
    tagline: "Chronologische Schritte eines Pflegeablaufs sortieren",
    description: "Verankert handlungssichere Notfall- und Pflegeketten in der richtigen zeitlichen Abfolge.",
  },
  {
    type: "myth_fact",
    title: "Mythos vs. Fakt",
    badge: "Aufklärung",
    icon: "❌",
    tagline: "Weit verbreitete Pflege-Irrtümer evidenzbasiert entlarven",
    description: "Konfrontiert mit Vorurteilen und korrigiert diese mit wissenschaftlichen Fakten der ZQP-Praxisleitlinien.",
  },
  {
    type: "bucket_sort",
    title: "Dos & Don'ts",
    badge: "Sortierung",
    icon: "📥",
    tagline: "Verhaltensweisen in zwei Kategorien einteilen",
    description: "Trennt empfohlene Handlungsmuster („Do“) von riskanten oder überlastenden Gewohnheiten („Don't“).",
  },
  {
    type: "comparison",
    title: "Situationsvergleich (A vs. B)",
    badge: "Gegenüberstellung",
    icon: "⚖️",
    tagline: "Zwei Alltagsszenarien vergleichen und bewerten",
    description: "Gegenüberstellung zweier Handlungsansätze (empfohlen vs. riskant) mit detaillierter Begründung.",
  },
  {
    type: "dilemma",
    title: "Praxis-Dilemma",
    badge: "Entscheidung",
    icon: "🎭",
    tagline: "Herausfordernde Alltagssituationen empathisch lösen",
    description: "Fokussiert personenzentrierte Kommunikation und Deeskalation bei herausforderndem Verhalten.",
  },
  {
    type: "checklist",
    title: "Checkliste",
    badge: "Mehrfachauswahl",
    icon: "📋",
    tagline: "Sicherheits- und Pflegemaßnahmen abhaken",
    description: "Erfordert das Identifizieren aller zutreffenden Schutzmaßnahmen aus einer Auswahlliste.",
  },
  {
    type: "fill_in_the_blank",
    title: "Lückentext",
    badge: "Fachwortschatz",
    icon: "✍️",
    tagline: "Schlüsselbegriffe in didaktische Merksätze einsetzen",
    description: "Festigt zentrale ZQP-Kernbegriffe und Handlungsgrundsätze durch aktives Einsetzen.",
  },
  {
    type: "branching_scenario",
    title: "Verzweigtes Fallbeispiel",
    badge: "Interaktiv",
    icon: "🌿",
    tagline: "Entscheidungsszenario mit Konsequenzen in mehreren Schritten",
    description: "Simuliert reale Pflegeinteraktionen Schritt für Schritt mit Ursache, Wirkung und alternativen Pfaden.",
  },
];

function createDefaultStation(type: StationType, index: number): QuizStation {
  const base = {
    id: "station-" + Date.now(),
    type,
    title: `Neue Station ${index + 1}`,
    promptOrInstruction: "Bitte bearbeiten Sie die folgende Aufgabe:",
    zqpRationale: "Fachlicher ZQP-Hintergrund für gute pflegerische Praxis.",
    solutionExplanation: "Erläuterung der Lösung und didaktischer Kontext für die Praxis.",
    editorialStatus: "draft" as const,
  };

  switch (type) {
    case "single_choice":
      return {
        ...base,
        options: [
          { text: "Richtig formulierte Antwort", isCorrect: true, explanation: "Richtig, da dies den ZQP-Standards entspricht." },
          { text: "Mögliche falsche Antwort", isCorrect: false, explanation: "Nicht optimal, da hier Risiken entstehen." },
          { text: "Weitere alternative Antwort", isCorrect: false, explanation: "Ebenfalls unzutreffend." },
        ],
      };
    case "matching":
      return {
        ...base,
        matchingPairs: [
          { id: "1", threatOrTerm: "Gefahr / Begriff 1", solutionOrDef: "Passende Schutzmaßnahme 1", explanation: "Begründung für Paar 1" },
          { id: "2", threatOrTerm: "Gefahr / Begriff 2", solutionOrDef: "Passende Schutzmaßnahme 2", explanation: "Begründung für Paar 2" },
          { id: "3", threatOrTerm: "Gefahr / Begriff 3", solutionOrDef: "Passende Schutzmaßnahme 3", explanation: "Begründung für Paar 3" },
        ],
      };
    case "ordering":
      return {
        ...base,
        orderingSteps: [
          { id: "1", text: "Erster Schritt im Ablauf", correctIndex: 0, reason: "Beginnt den Handlungsablauf." },
          { id: "2", text: "Zweiter Schritt im Ablauf", correctIndex: 1, reason: "Baut auf dem ersten Schritt auf." },
          { id: "3", text: "Dritter Schritt im Ablauf", correctIndex: 2, reason: "Schließt den Ablauf sicher ab." },
        ],
      };
    case "myth_fact":
      return {
        ...base,
        mythFactItems: [
          { id: "1", statement: "Eine weit verbreitete Annahme...", isFact: false, explanation: "Dies ist ein Mythos, weil..." },
          { id: "2", statement: "Wissenschaftlich belegte Tatsache...", isFact: true, explanation: "Dies ist ein Fakt, da..." },
        ],
      };
    case "bucket_sort":
      return {
        ...base,
        bucketSortItems: [
          { id: "1", text: "Empfohlene Verhaltensweise", targetBucket: "do", explanation: "Entlastet Betroffene." },
          { id: "2", text: "Zu vermeidende Verhaltensweise", targetBucket: "dont", explanation: "Erhöht das Risiko." },
          { id: "3", text: "Weitere empfohlene Maßnahme", targetBucket: "do", explanation: "Fördert die Selbstständigkeit." },
        ],
      };
    case "comparison":
      return {
        ...base,
        comparisonScenarios: [
          { id: "A", title: "Situation A", badge: "Empfohlen", description: "Sichere Durchführung mit Hilfsmitteln.", isCorrect: true, explanation: "Minimiert Gefährdungen." },
          { id: "B", title: "Situation B", badge: "Riskant", description: "Durchführung ohne Absicherung.", isCorrect: false, explanation: "Birgt erhebliche Risiken." },
        ],
      };
    case "dilemma":
      return {
        ...base,
        dilemmaReactions: [
          { id: "1", text: "Empathisch und deeskalierend reagieren", isOptimal: true, consequence: "Schafft Vertrauen und Ruhe.", zqpAdvice: "Personenzentrierter Ansatz nach Kitwood." },
          { id: "2", text: "Autoritär durchgreifen", isOptimal: false, consequence: "Führt zu Abwehr und Stress.", zqpAdvice: "Erhöht die emotionale Belastung aller Beteiligten." },
        ],
      };
    case "checklist":
      return {
        ...base,
        checklistItems: [
          { id: "1", text: "Wichtige Schutzmaßnahme 1", isCorrect: true, explanation: "Unverzichtbar zur Risikominimierung." },
          { id: "2", text: "Wichtige Schutzmaßnahme 2", isCorrect: true, explanation: "Trägt zur Sicherheit bei." },
          { id: "3", text: "Irreführende oder unnötige Maßnahme", isCorrect: false, explanation: "Nicht zielführend." },
        ],
      };
    case "fill_in_the_blank":
      return {
        ...base,
        fillInSentence: "Bei der Pflege ist [BLANK_1] besonders wichtig, um [BLANK_2] zu vermeiden.",
        fillInBlanks: [
          { id: "BLANK_1", correctWord: "Sorgfalt", options: ["Sorgfalt", "Hektik", "Ignoranz"] },
          { id: "BLANK_2", correctWord: "Stürze", options: ["Stürze", "Ruhe", "Freude"] },
        ],
      };
    case "branching_scenario":
      return {
        ...base,
        promptOrInstruction: "Begleiten Sie diese herausfordernde Situation im Pflegealltag Schritt für Schritt und finden Sie den deeskalierenden Weg:",
        branchingScenario: {
          rootNodeId: "node_1",
          depthMode: "compact_2_steps",
          nodes: {
            node_1: {
              id: "node_1",
              sceneTitle: "1. Ausgangssituation",
              situationDescription: "Beschreibung der herausfordernden Pflegesituation...",
              choices: [
                {
                  id: "c1_a",
                  text: "Erste Reaktionsmöglichkeit (Risikobehaftet)",
                  consequenceText: "Die Person reagiert verunsichert und zieht sich zurück.",
                  isOptimal: false,
                  nextStepId: "node_2_a",
                  zqpAdvice: "Logischer Widerspruch führt oft zu Abwehr.",
                },
                {
                  id: "c1_b",
                  text: "Zweite Reaktionsmöglichkeit (Deeskalierend)",
                  consequenceText: "Die Person fühlt sich verstanden, die Anspannung fällt spürbar ab.",
                  isOptimal: true,
                  nextStepId: "node_2_b",
                  zqpAdvice: "Gefühle validieren schenkt Orientierung und Vertrauen.",
                },
              ],
            },
            node_2_a: {
              id: "node_2_a",
              sceneTitle: "2. Zuspitzung & Deeskalation",
              situationDescription: "Die Situation hat sich zugespitzt. Wie fangen Sie die Lage auf?",
              choices: [
                {
                  id: "c2_a1",
                  text: "Einen Schritt zurücktreten, Stimme senken und Ruhe signalisieren",
                  consequenceText: "Die Person beruhigt sich allmählich wieder.",
                  isOptimal: true,
                  zqpAdvice: "Ruhe und Deeskalation wirken auch bei Verhärtung.",
                },
              ],
            },
            node_2_b: {
              id: "node_2_b",
              sceneTitle: "2. Stabilisierung & Übergang",
              situationDescription: "Die Anspannung hat nachgelassen. Wie gestalten Sie den nächsten Schritt?",
              choices: [
                {
                  id: "c2_b1",
                  text: "Gemeinsam eine Tasse Tee trinken und sanft zur Alltagsroutine zurückkehren",
                  consequenceText: "Erfolgreich deeskaliert und Vertrauen gestärkt.",
                  isOptimal: true,
                  zqpAdvice: "Gemeinsame Ruheinseln schaffen nachhaltige Stabilität.",
                },
              ],
            },
          },
          zqpSummaryAdvice: "Personenzentrierte Haltung nach Tom Kitwood: Validieren, Sicherheit schenken und Überlastung vorbeugen.",
        },
      };
  }
}

export const StationEditorModal: React.FC<StationEditorModalProps> = ({
  isOpen,
  onClose,
  quiz,
  initialStationIndex,
  onSaveQuiz,
  settings,
}) => {
  const [editorSection, setEditorSection] = useState<"station" | "result" | "labels">(() =>
    initialStationIndex === -1 ? "result" : "station"
  );
  const [activeStationIdx, setActiveStationIdx] = useState<number>(() =>
    initialStationIndex >= 0 ? initialStationIndex : 0
  );
  const [stations, setStations] = useState<QuizStation[]>(() =>
    JSON.parse(JSON.stringify(quiz.stations || []))
  );
  const [resultConfig, setResultConfig] = useState<QuizResultScreenConfig>(() =>
    JSON.parse(JSON.stringify(quiz.resultScreen || {
      title: "Praxistest abgeschlossen",
      subtitle: quiz.summary || "",
      scoreLabel: "Ihr Praxistest-Ergebnis:",
      perfectScoreTitle: "Hervorragend! Alle Aufgaben gelöst",
      perfectScoreText: "Perfektes Ergebnis: Alle {total} Stationen eigenständig gemeistert (100%).",
      goodScoreTitle: "Gutes Ergebnis im Praxistest",
      goodScoreText: "Solide Leistung: {solved} von {total} Stationen eigenständig gelöst ({percent}%).",
      lowScoreTitle: "Praxistest abgeschlossen",
      lowScoreText: "{solved} von {total} Stationen gelöst ({percent}%). Nutzen Sie die ZQP-Erklärungen zur Vertiefung.",
      zeroScoreTitle: "Praxistest durchlaufen",
      zeroScoreText: "Keine Station eigenständig gelöst. Wiederholen Sie das Training, um das Wissen zu festigen.",
      restartButtonText: "Praxistest wiederholen",
      printButtonText: "Ergebnis als PDF drucken",
    }))
  );
  const [customLabels, setCustomLabels] = useState<QuizCustomLabels>(() =>
    JSON.parse(JSON.stringify(quiz.customLabels || {
      feedbackWhyLabel: "Warum richtig / Warum falsch:",
      feedbackKnowledgeLabel: "ZQP-Praxiswissen:",
      feedbackCloseLabel: "Ansicht ansehen ✕",
      bucketDoLabel: "Do ✓",
      bucketDontLabel: "Don't ✕",
      bucketDoHeader: "Empfohlen (Do)",
      bucketDontHeader: "Vermeiden (Don't)",
      nextStationLabel: "Nächste Station",
      finishStationLabel: "Zur Gesamtauswertung",
      restartQuizLabel: "Praxistest wiederholen",
    }))
  );
  const [isVariantsModalOpen, setIsVariantsModalOpen] = useState<boolean>(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [savedFavMsg, setSavedFavMsg] = useState<string | null>(null);

  const [displayMode, setDisplayMode] = useState<"drawer" | "modal">(() => {
    try {
      return (localStorage.getItem("zqp_station_editor_display_mode") as "drawer" | "modal") || "drawer";
    } catch {
      return "drawer";
    }
  });

  const toggleDisplayMode = () => {
    const next = displayMode === "drawer" ? "modal" : "drawer";
    setDisplayMode(next);
    try {
      localStorage.setItem("zqp_station_editor_display_mode", next);
    } catch {}
  };

  // Synchronize internal state whenever modal opens with the current quiz and station index
  useEffect(() => {
    if (!isOpen) return;
    setStations(JSON.parse(JSON.stringify(quiz.stations || [])));
    setResultConfig(
      JSON.parse(
        JSON.stringify(
          quiz.resultScreen || {
            title: "Praxistest abgeschlossen",
            subtitle: quiz.summary || "",
            scoreLabel: "Ihr Praxistest-Ergebnis:",
            perfectScoreTitle: "Hervorragend! Alle Aufgaben gelöst",
            perfectScoreText: "Perfektes Ergebnis: Alle {total} Stationen eigenständig gemeistert (100%).",
            goodScoreTitle: "Gutes Ergebnis im Praxistest",
            goodScoreText: "Solide Leistung: {solved} von {total} Stationen eigenständig gelöst ({percent}%).",
            lowScoreTitle: "Praxistest abgeschlossen",
            lowScoreText: "{solved} von {total} Stationen gelöst ({percent}%). Nutzen Sie die ZQP-Erklärungen zur Vertiefung.",
            zeroScoreTitle: "Praxistest durchlaufen",
            zeroScoreText: "Keine Station eigenständig gelöst. Wiederholen Sie das Training, um das Wissen zu festigen.",
            restartButtonText: "Praxistest wiederholen",
            printButtonText: "Ergebnis als PDF drucken",
          }
        )
      )
    );
    setCustomLabels(
      JSON.parse(
        JSON.stringify(
          quiz.customLabels || {
            feedbackWhyLabel: "Warum richtig / Warum falsch:",
            feedbackKnowledgeLabel: "ZQP-Praxiswissen:",
            feedbackCloseLabel: "Ansicht ansehen ✕",
            bucketDoLabel: "Do ✓",
            bucketDontLabel: "Don't ✕",
            bucketDoHeader: "Empfohlen (Do)",
            bucketDontHeader: "Vermeiden (Don't)",
            nextStationLabel: "Nächste Station",
            finishStationLabel: "Zur Gesamtauswertung",
            restartQuizLabel: "Praxistest wiederholen",
          }
        )
      )
    );
    setEditorSection(initialStationIndex === -1 ? "result" : "station");
    setActiveStationIdx(
      initialStationIndex >= 0
        ? Math.min(initialStationIndex, Math.max(0, (quiz.stations || []).length - 1))
        : 0
    );
  }, [isOpen]);

  if (!isOpen) return null;

  const currentStation = stations[activeStationIdx] || stations[0];
  if (!currentStation && editorSection === "station") return null;

  const handleUpdateStation = (field: keyof QuizStation, value: any) => {
    setStations((prev) => {
      const copy = [...prev];
      copy[activeStationIdx] = {
        ...copy[activeStationIdx],
        [field]: value,
      };
      return copy;
    });
  };

  const handleMoveStation = (fromIdx: number, toIdx: number) => {
    if (toIdx < 0 || toIdx >= stations.length) return;
    setStations((prev) => {
      const copy = [...prev];
      const [moved] = copy.splice(fromIdx, 1);
      copy.splice(toIdx, 0, moved);
      return copy;
    });
    setActiveStationIdx(toIdx);
  };

  const handleDuplicateStation = () => {
    const copy: QuizStation = JSON.parse(JSON.stringify(currentStation));
    copy.id = "station-" + Date.now();
    copy.title = `${copy.title} (Kopie)`;
    setStations((prev) => {
      const next = [...prev];
      next.splice(activeStationIdx + 1, 0, copy);
      return next;
    });
    setActiveStationIdx(activeStationIdx + 1);
  };

  const handleDeleteStation = () => {
    if (stations.length <= 1) {
      alert("Ein Quiz muss aus mindestens einer Station bestehen.");
      return;
    }
    if (confirm(`Möchten Sie die Station „${currentStation.title || `Station ${activeStationIdx + 1}`}“ wirklich löschen?`)) {
      setStations((prev) => prev.filter((_, idx) => idx !== activeStationIdx));
      setActiveStationIdx((prev) => Math.max(0, prev - 1));
    }
  };

  const handleAddNewStation = (type: StationType) => {
    const newStation = createDefaultStation(type, stations.length);
    setStations((prev) => [...prev, newStation]);
    setActiveStationIdx(stations.length);
    setEditorSection("station");
    setIsAddModalOpen(false);
  };

  const handleSaveToFavorites = () => {
    saveFavoriteStation(currentStation, quiz.targetAudience);
    setSavedFavMsg("In Schatzkiste gespeichert! ⭐");
    setTimeout(() => setSavedFavMsg(null), 2500);
  };

  const handleApplyVariant = (variant: QuizStation) => {
    setStations((prev) => {
      const copy = [...prev];
      copy[activeStationIdx] = {
        ...variant,
        id: copy[activeStationIdx]?.id || variant.id,
      };
      return copy;
    });
  };

  const handleApplyToPreview = () => {
    const updatedQuiz: QuizGenerationResult = {
      ...quiz,
      stations: stations,
      resultScreen: resultConfig,
      customLabels: customLabels,
    };
    const compiled = compileQuizToBundle(updatedQuiz);
    updatedQuiz.generatedHtml = compiled.html;
    updatedQuiz.generatedCss = compiled.css;
    updatedQuiz.generatedJs = compiled.js;
    updatedQuiz.tailwindConfig = compiled.tailwindConfig;

    onSaveQuiz(updatedQuiz);
    setSavedFavMsg("In Live-Vorschau aktualisiert! ✓");
    setTimeout(() => setSavedFavMsg(null), 2500);
  };

  const handleSaveAll = () => {
    const updatedQuiz: QuizGenerationResult = {
      ...quiz,
      stations: stations,
      resultScreen: resultConfig,
      customLabels: customLabels,
    };
    const compiled = compileQuizToBundle(updatedQuiz);
    updatedQuiz.generatedHtml = compiled.html;
    updatedQuiz.generatedCss = compiled.css;
    updatedQuiz.generatedJs = compiled.js;
    updatedQuiz.tailwindConfig = compiled.tailwindConfig;

    onSaveQuiz(updatedQuiz);
    onClose();
  };

  return (
    <>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="station-editor-title"
        className={`fixed inset-0 z-50 animate-in fade-in duration-150 ${
          displayMode === "drawer"
            ? "flex justify-end bg-black/20 backdrop-blur-[1px]"
            : "flex items-center justify-center bg-black/50 p-3 sm:p-4 backdrop-blur-xs"
        }`}
      >
        {/* Clickable Backdrop overlay */}
        <div
          className="absolute inset-0 cursor-default"
          onClick={onClose}
          aria-hidden="true"
        />

        <div
          className={`relative bg-white border-[#bbd1cd] shadow-2xl flex flex-col overflow-hidden z-10 transition-all ${
            displayMode === "drawer"
              ? "w-full sm:w-[580px] lg:w-[680px] xl:w-[740px] h-full border-l animate-in slide-in-from-right duration-200"
              : "rounded-2xl border max-w-4xl w-full max-h-[92vh] animate-in zoom-in-95 duration-150"
          }`}
        >
          {/* Header */}
          <div className="bg-[#f3f8f7] border-b border-[#bbd1cd] px-5 py-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-[#247a6d] text-white flex items-center justify-center shadow-xs shrink-0">
                <Edit3 className="w-4.5 h-4.5" />
              </div>
              <div className="min-w-0">
                <h2 id="station-editor-title" className="text-sm sm:text-base font-bold text-[#1b5c53] truncate">
                  {displayMode === "drawer" ? "Station-Editor (Live-Drawer)" : "Station bearbeiten (WYSIWYG-Editor)"}
                </h2>
                <p className="text-[11px] text-[#6e6c70] truncate">
                  {displayMode === "drawer" ? "Live-Änderungen parallel zur Quiz-Vorschau" : "Texte, Optionen, Reihenfolge & Struktur anpassen"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {/* Display Mode Toggle: Drawer <-> Modal */}
              <button
                type="button"
                onClick={toggleDisplayMode}
                className="px-2.5 py-1 rounded-lg text-[#1b5c53] bg-white hover:bg-[#e3eeec] border border-[#bbd1cd] hover:border-[#247a6d] transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-semibold shadow-2xs"
                title={displayMode === "drawer" ? "Auf zentriertes Vollbild-Modal vergrößern" : "Als seitlichen Schiebe-Drawer anzeigen"}
              >
                {displayMode === "drawer" ? (
                  <>
                    <Maximize2 className="w-3.5 h-3.5 text-[#247a6d]" />
                    <span className="hidden sm:inline">Vollbild</span>
                  </>
                ) : (
                  <>
                    <Sidebar className="w-3.5 h-3.5 text-[#247a6d]" />
                    <span className="hidden sm:inline">Drawer-Modus</span>
                  </>
                )}
              </button>

              <button
                onClick={onClose}
                aria-label="Schließen"
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-[#e3eeec] transition-colors cursor-pointer"
                title="Editor schließen"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Station Navigation Tab Bar with Reorder & Add */}
          <div className="bg-[#fcfaf8] border-b border-[#e2ddd5] px-3.5 sm:px-5 py-2 flex items-center gap-2 shrink-0">
            {/* Scrollable Tabs Container */}
            <div className="flex-1 min-w-0 overflow-x-auto flex items-center gap-1.5 py-0.5 zqp-scrollbar">
              {stations.map((st, idx) => (
                <button
                  key={st.id || idx}
                  onClick={() => {
                    setActiveStationIdx(idx);
                    setEditorSection("station");
                  }}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                    editorSection === "station" && activeStationIdx === idx
                      ? "bg-[#247a6d] text-white shadow-2xs"
                      : "bg-white border border-[#bbd1cd] text-[#6e6c70] hover:text-[#1b5c53]"
                  }`}
                  title={`Station ${idx + 1}: ${st.title} (${st.type})`}
                >
                  <span>
                    {idx + 1} {getStationIcon(st.type)}
                  </span>
                  <span className="max-w-[80px] sm:max-w-[120px] truncate hidden xs:inline">
                    {st.title || st.type}
                  </span>
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      st.editorialStatus === "approved"
                        ? "bg-emerald-400"
                        : st.editorialStatus === "in_review"
                        ? "bg-sky-400"
                        : "bg-amber-400"
                    }`}
                  />
                </button>
              ))}

              {/* Add New Station Button */}
              <button
                type="button"
                onClick={() => setIsAddModalOpen(true)}
                className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-dashed border-[#247a6d] text-[#1b5c53] hover:bg-[#e3eeec] transition-colors flex items-center gap-1 cursor-pointer shrink-0"
                title="Neue Lernstation zum Quiz hinzufügen"
              >
                <Plus className="w-3.5 h-3.5 text-[#247a6d]" />
                <span>Station hinzufügen</span>
              </button>

              <div className="h-4 w-px bg-gray-300 mx-1 shrink-0" />

              {/* Special Tabs: Ergebnis-Station & UI-Texte */}
              <button
                type="button"
                onClick={() => setEditorSection("result")}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                  editorSection === "result"
                    ? "bg-[#247a6d] text-white shadow-2xs"
                    : "bg-white border border-[#bbd1cd] text-[#1b5c53] hover:bg-[#e3eeec]"
                }`}
                title="Ergebnis-Station und Abschluss-Texte bearbeiten"
              >
                <Award className={`w-3.5 h-3.5 ${editorSection === "result" ? "text-white" : "text-amber-500"}`} />
                <span>🏁 Ergebnis-Station</span>
              </button>

              <button
                type="button"
                onClick={() => setEditorSection("labels")}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                  editorSection === "labels"
                    ? "bg-[#247a6d] text-white shadow-2xs"
                    : "bg-white border border-[#bbd1cd] text-[#1b5c53] hover:bg-[#e3eeec]"
                }`}
                title="Text-Bausteine & UI-Labels für dieses Quiz bearbeiten"
              >
                <Sliders className={`w-3.5 h-3.5 ${editorSection === "labels" ? "text-white" : "text-[#247a6d]"}`} />
                <span>⚙️ Text-Bausteine</span>
              </button>
            </div>

            {/* Pinned Navigation Controls: only show station stepper when in station section */}
            {editorSection === "station" && stations.length > 1 && (
              <div className="flex items-center gap-1 shrink-0 pl-2 border-l border-[#bbd1cd]/60">
                <button
                  onClick={() => setActiveStationIdx((prev) => Math.max(0, prev - 1))}
                  disabled={activeStationIdx === 0}
                  className="p-1 text-gray-500 hover:text-[#1b5c53] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer rounded hover:bg-[#e3eeec]"
                  title="Vorherige Station"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-bold text-[#1b5c53] px-0.5 select-none whitespace-nowrap">
                  {activeStationIdx + 1} / {stations.length}
                </span>
                <button
                  onClick={() => setActiveStationIdx((prev) => Math.min(stations.length - 1, prev + 1))}
                  disabled={activeStationIdx === stations.length - 1}
                  className="p-1 text-gray-500 hover:text-[#1b5c53] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer rounded hover:bg-[#e3eeec]"
                  title="Nächste Station"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Editor Body */}
          <div className="p-6 overflow-y-auto flex-1 space-y-4">
            {editorSection === "station" && (
              <>
                {/* Redaktions- & Struktur-Toolbar (Status, Reorder, Copy, Delete) */}
            <div className="p-3 bg-[#f3f8f7] rounded-xl border border-[#bbd1cd] flex flex-wrap items-center justify-between gap-2.5">
              {/* Left: Reorder & Management */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-bold text-[#1b5c53] mr-1">Position:</span>
                <button
                  type="button"
                  onClick={() => handleMoveStation(activeStationIdx, activeStationIdx - 1)}
                  disabled={activeStationIdx === 0}
                  className="px-2 py-1 rounded-lg border border-[#bbd1cd] bg-white text-[#1b5c53] text-xs font-semibold hover:bg-[#e3eeec] disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer"
                  title="Diese Station nach links verschieben"
                >
                  <span>‹ Nach links</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleMoveStation(activeStationIdx, activeStationIdx + 1)}
                  disabled={activeStationIdx === stations.length - 1}
                  className="px-2 py-1 rounded-lg border border-[#bbd1cd] bg-white text-[#1b5c53] text-xs font-semibold hover:bg-[#e3eeec] disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer"
                  title="Diese Station nach rechts verschieben"
                >
                  <span>Nach rechts ›</span>
                </button>

                <span className="text-gray-300 mx-1">|</span>

                <button
                  type="button"
                  onClick={handleDuplicateStation}
                  className="px-2.5 py-1 rounded-lg border border-[#bbd1cd] bg-white text-[#1b5c53] text-xs font-semibold hover:bg-[#e3eeec] flex items-center gap-1.5 cursor-pointer"
                  title="Diese Station duplizieren"
                >
                  <Copy className="w-3.5 h-3.5 text-[#247a6d]" />
                  <span>Duplizieren</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(true)}
                  className="px-2.5 py-1 rounded-lg border border-dashed border-[#247a6d] bg-white text-[#1b5c53] text-xs font-semibold hover:bg-[#e3eeec] flex items-center gap-1.5 cursor-pointer"
                  title="Neue Lernstation zum Quiz hinzufügen"
                >
                  <Plus className="w-3.5 h-3.5 text-[#247a6d]" />
                  <span>Neue Station</span>
                </button>

                <button
                  type="button"
                  onClick={handleDeleteStation}
                  disabled={stations.length <= 1}
                  className="px-2.5 py-1 rounded-lg border border-rose-200 bg-white text-rose-700 text-xs font-semibold hover:bg-rose-50 disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer"
                  title="Diese Station löschen"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                  <span>Löschen</span>
                </button>
              </div>

              {/* Right: Editorial Status, Treasure chest & AI Variants */}
              <div className="flex items-center gap-2">
                {savedFavMsg && (
                  <span className="text-xs text-emerald-700 font-bold animate-in fade-in">
                    {savedFavMsg}
                  </span>
                )}

                <select
                  value={currentStation.editorialStatus || "draft"}
                  onChange={(e) => handleUpdateStation("editorialStatus", e.target.value as EditorialStatus)}
                  className="rounded-lg border border-[#bbd1cd] px-2 py-1 text-xs font-bold bg-white text-[#1b5c53] outline-none cursor-pointer"
                >
                  <option value="draft">🟡 Entwurf</option>
                  <option value="in_review">🔵 In Fachprüfung</option>
                  <option value="approved">🟢 Freigegeben</option>
                </select>

                <button
                  type="button"
                  onClick={handleSaveToFavorites}
                  className="px-2.5 py-1 rounded-lg border border-[#bbd1cd] bg-white hover:bg-[#e3eeec] text-[#1b5c53] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="In der Vorlagen-Schatzkiste speichern"
                >
                  <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  <span>Schatzkiste</span>
                </button>

                {settings && (
                  <button
                    type="button"
                    onClick={() => setIsVariantsModalOpen(true)}
                    className="px-2.5 py-1 rounded-lg bg-[#247a6d] hover:bg-[#1b5c53] text-white text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                    title="Gemini erzeugt 3 didaktische Alternativen"
                  >
                    <Dices className="w-3.5 h-3.5" />
                    <span>🎲 3 Varianten</span>
                  </button>
                )}
              </div>
            </div>

            {/* Attached Source Quote if present */}
            {currentStation.sourceQuote && (
              <div className="p-3 bg-emerald-50/70 border border-emerald-300 rounded-xl flex items-start justify-between gap-3">
                <div className="flex items-start gap-2">
                  <Quote className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[11px] font-bold text-emerald-900 block">
                      Angehefteter Quelltext-Beleg (Anti-Halluzination):
                    </span>
                    <p className="text-xs text-emerald-950 italic mt-0.5">
                      „{currentStation.sourceQuote}“
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleUpdateStation("sourceQuote", undefined)}
                  className="text-[10px] text-emerald-800 hover:text-red-700 underline shrink-0 cursor-pointer"
                >
                  Entfernen
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#1b5c53] mb-1">
                  Titel der Station
                </label>
                <input
                  type="text"
                  value={currentStation.title || ""}
                  onChange={(e) => handleUpdateStation("title", e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-[#bbd1cd] focus:ring-2 focus:ring-[#247a6d] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1b5c53] mb-1">
                  Spieltyp ({STATION_TYPE_LABELS[currentStation.type] || currentStation.type})
                </label>
                <input
                  type="text"
                  disabled
                  value={STATION_TYPE_LABELS[currentStation.type] || currentStation.type}
                  className="w-full text-xs p-2.5 rounded-lg border border-[#bbd1cd] bg-gray-100 text-gray-600 cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1b5c53] mb-1">
                Aufgabenstellung / Anweisung für Teilnehmende
              </label>
              <textarea
                rows={2}
                value={currentStation.promptOrInstruction || ""}
                onChange={(e) => handleUpdateStation("promptOrInstruction", e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-[#bbd1cd] focus:ring-2 focus:ring-[#247a6d] focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#1b5c53] mb-1">
                  ZQP-Praxiswissen / Fachlicher Hintergrund
                </label>
                <textarea
                  rows={3}
                  value={currentStation.zqpRationale || ""}
                  onChange={(e) => handleUpdateStation("zqpRationale", e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-[#bbd1cd] focus:ring-2 focus:ring-[#247a6d] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1b5c53] mb-1">
                  Gesamterklärung für „Lösung anzeigen“
                </label>
                <textarea
                  rows={3}
                  value={currentStation.solutionExplanation || ""}
                  onChange={(e) => handleUpdateStation("solutionExplanation", e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-[#bbd1cd] focus:ring-2 focus:ring-[#247a6d] focus:outline-none"
                />
              </div>
            </div>

            {/* Type-Specific Items Editor */}
            <div className="pt-2 border-t border-[#e2ddd5]">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold text-[#1b5c53] uppercase tracking-wider">
                  Antwort- & Zuordnungsoptionen
                </h4>
                <span className="text-[11px] text-[#6e6c70]">
                  Optionen flexibel anpassen, hinzufügen oder löschen
                </span>
              </div>

              {/* SINGLE CHOICE */}
              {currentStation.type === "single_choice" && currentStation.options && (
                <div className="space-y-3">
                  {currentStation.options.map((opt, oIdx) => (
                    <div key={oIdx} className="p-3 bg-[#f3f8f7] rounded-xl border border-[#bbd1cd] space-y-2 relative">
                      <div className="flex items-center justify-between gap-2">
                        <label className="flex items-center gap-2 text-xs font-bold text-[#1b5c53] cursor-pointer">
                          <input
                            type="radio"
                            name="single_choice_correct"
                            checked={opt.isCorrect}
                            onChange={() => {
                              const newOpts = currentStation.options!.map((o, idx) => ({
                                ...o,
                                isCorrect: idx === oIdx,
                              }));
                              handleUpdateStation("options", newOpts);
                            }}
                            className="text-[#247a6d] focus:ring-[#247a6d]"
                          />
                          <span>Option {oIdx + 1} ({opt.isCorrect ? "RICHTIG" : "FALSCH"})</span>
                        </label>

                        {currentStation.options!.length > 2 && (
                          <button
                            type="button"
                            onClick={() => {
                              const newOpts = currentStation.options!.filter((_, i) => i !== oIdx);
                              if (!newOpts.some((o) => o.isCorrect) && newOpts.length > 0) {
                                newOpts[0].isCorrect = true;
                              }
                              handleUpdateStation("options", newOpts);
                            }}
                            className="text-xs text-rose-600 hover:text-rose-800 p-1 rounded hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Option entfernen"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <input
                        type="text"
                        value={opt.text}
                        onChange={(e) => {
                          const newOpts = [...currentStation.options!];
                          newOpts[oIdx].text = e.target.value;
                          handleUpdateStation("options", newOpts);
                        }}
                        placeholder="Antworttext..."
                        className="w-full text-xs p-2 rounded-lg border border-[#bbd1cd] bg-white focus:outline-none focus:ring-1 focus:ring-[#247a6d]"
                      />

                      <input
                        type="text"
                        value={opt.explanation || ""}
                        onChange={(e) => {
                          const newOpts = [...currentStation.options!];
                          newOpts[oIdx].explanation = e.target.value;
                          handleUpdateStation("options", newOpts);
                        }}
                        placeholder="Begründung (Warum richtig / Warum falsch)..."
                        className="w-full text-xs p-2 rounded-lg border border-[#bbd1cd] bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#247a6d]"
                      />
                    </div>
                  ))}

                  {currentStation.options.length < 6 && (
                    <button
                      type="button"
                      onClick={() => {
                        const newOpts = [
                          ...currentStation.options!,
                          {
                            text: `Weitere Antwort ${currentStation.options!.length + 1}`,
                            isCorrect: false,
                            explanation: "Begründung für diese Option.",
                          },
                        ];
                        handleUpdateStation("options", newOpts);
                      }}
                      className="w-full py-2 border border-dashed border-[#247a6d] rounded-lg text-xs font-semibold text-[#1b5c53] hover:bg-[#e3eeec] transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 text-[#247a6d]" />
                      <span>+ Weitere Antwortoption hinzufügen</span>
                    </button>
                  )}
                </div>
              )}

              {/* DILEMMA */}
              {currentStation.type === "dilemma" && currentStation.dilemmaReactions && (
                <div className="space-y-3">
                  {currentStation.dilemmaReactions.map((reaction, rIdx) => (
                    <div key={reaction.id || rIdx} className="p-3 bg-[#f3f8f7] rounded-xl border border-[#bbd1cd] space-y-2 relative">
                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 text-xs font-bold text-[#1b5c53] cursor-pointer">
                          <input
                            type="radio"
                            name="dilemma_optimal"
                            checked={reaction.isOptimal}
                            onChange={() => {
                              const newR = currentStation.dilemmaReactions!.map((r, idx) => ({
                                ...r,
                                isOptimal: idx === rIdx,
                              }));
                              handleUpdateStation("dilemmaReactions", newR);
                            }}
                            className="text-[#247a6d] focus:ring-[#247a6d]"
                          />
                          <span>Handlungsoption {rIdx + 1} ({reaction.isOptimal ? "OPTIMAL" : "PROBLEMATISCH"})</span>
                        </label>

                        {currentStation.dilemmaReactions!.length > 2 && (
                          <button
                            type="button"
                            onClick={() => {
                              const newR = currentStation.dilemmaReactions!.filter((_, i) => i !== rIdx);
                              if (!newR.some((r) => r.isOptimal) && newR.length > 0) {
                                newR[0].isOptimal = true;
                              }
                              handleUpdateStation("dilemmaReactions", newR);
                            }}
                            className="text-xs text-rose-600 hover:text-rose-800 p-1 rounded hover:bg-rose-50 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <input
                        type="text"
                        value={reaction.text}
                        onChange={(e) => {
                          const newR = [...currentStation.dilemmaReactions!];
                          newR[rIdx].text = e.target.value;
                          handleUpdateStation("dilemmaReactions", newR);
                        }}
                        placeholder="Formulierung der Reaktion..."
                        className="w-full text-xs p-2 rounded-lg border border-[#bbd1cd] bg-white focus:outline-none focus:ring-1 focus:ring-[#247a6d]"
                      />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={reaction.consequence}
                          onChange={(e) => {
                            const newR = [...currentStation.dilemmaReactions!];
                            newR[rIdx].consequence = e.target.value;
                            handleUpdateStation("dilemmaReactions", newR);
                          }}
                          placeholder="Pflegerische Konsequenz..."
                          className="text-xs p-2 rounded-lg border border-[#bbd1cd] bg-white focus:outline-none focus:ring-1 focus:ring-[#247a6d]"
                        />
                        <input
                          type="text"
                          value={reaction.zqpAdvice}
                          onChange={(e) => {
                            const newR = [...currentStation.dilemmaReactions!];
                            newR[rIdx].zqpAdvice = e.target.value;
                            handleUpdateStation("dilemmaReactions", newR);
                          }}
                          placeholder="ZQP-Praxishinweis..."
                          className="text-xs p-2 rounded-lg border border-[#bbd1cd] bg-white focus:outline-none focus:ring-1 focus:ring-[#247a6d]"
                        />
                      </div>
                    </div>
                  ))}

                  {currentStation.dilemmaReactions.length < 4 && (
                    <button
                      type="button"
                      onClick={() => {
                        const newR = [
                          ...currentStation.dilemmaReactions!,
                          {
                            id: `reaction-${Date.now()}`,
                            text: `Weitere Handlungsoption ${currentStation.dilemmaReactions!.length + 1}`,
                            isOptimal: false,
                            consequence: "Konsequenz für Betroffene...",
                            zqpAdvice: "Fachlicher ZQP-Praxishinweis...",
                          },
                        ];
                        handleUpdateStation("dilemmaReactions", newR);
                      }}
                      className="w-full py-2 border border-dashed border-[#247a6d] rounded-lg text-xs font-semibold text-[#1b5c53] hover:bg-[#e3eeec] transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 text-[#247a6d]" />
                      <span>+ Weitere Handlungsoption hinzufügen</span>
                    </button>
                  )}
                </div>
              )}

              {/* MATCHING */}
              {currentStation.type === "matching" && currentStation.matchingPairs && (
                <div className="space-y-2.5">
                  {currentStation.matchingPairs.map((pair, pIdx) => (
                    <div key={pair.id || pIdx} className="p-2.5 bg-[#f3f8f7] rounded-xl border border-[#bbd1cd] space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-[#1b5c53]">
                          Paar {pIdx + 1}
                        </span>
                        {currentStation.matchingPairs!.length > 2 && (
                          <button
                            type="button"
                            onClick={() => {
                              const newP = currentStation.matchingPairs!.filter((_, i) => i !== pIdx);
                              handleUpdateStation("matchingPairs", newP);
                            }}
                            className="text-xs text-rose-600 hover:text-rose-800 p-1 rounded hover:bg-rose-50 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <span className="text-[10px] font-bold text-amber-800 uppercase block mb-1">Gefahr / Begriff {pIdx + 1}</span>
                          <input
                            type="text"
                            value={pair.threatOrTerm}
                            onChange={(e) => {
                              const newP = [...currentStation.matchingPairs!];
                              newP[pIdx].threatOrTerm = e.target.value;
                              handleUpdateStation("matchingPairs", newP);
                            }}
                            className="w-full text-xs p-2 rounded-lg border border-[#bbd1cd] bg-white"
                          />
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-[#1b5c53] uppercase block mb-1">Passende Lösung {pIdx + 1}</span>
                          <input
                            type="text"
                            value={pair.solutionOrDef}
                            onChange={(e) => {
                              const newP = [...currentStation.matchingPairs!];
                              newP[pIdx].solutionOrDef = e.target.value;
                              handleUpdateStation("matchingPairs", newP);
                            }}
                            className="w-full text-xs p-2 rounded-lg border border-[#bbd1cd] bg-white"
                          />
                        </div>
                      </div>

                      <input
                        type="text"
                        value={pair.explanation || ""}
                        onChange={(e) => {
                          const newP = [...currentStation.matchingPairs!];
                          newP[pIdx].explanation = e.target.value;
                          handleUpdateStation("matchingPairs", newP);
                        }}
                        placeholder="Begründung für dieses Paar..."
                        className="w-full text-xs p-1.5 rounded-lg border border-[#bbd1cd] bg-white text-gray-700"
                      />
                    </div>
                  ))}

                  {currentStation.matchingPairs.length < 6 && (
                    <button
                      type="button"
                      onClick={() => {
                        const newP = [
                          ...currentStation.matchingPairs!,
                          {
                            id: `pair-${Date.now()}`,
                            threatOrTerm: `Gefahr / Begriff ${currentStation.matchingPairs!.length + 1}`,
                            solutionOrDef: `Schutzmaßnahme ${currentStation.matchingPairs!.length + 1}`,
                            explanation: "Begründung für das neue Paar.",
                          },
                        ];
                        handleUpdateStation("matchingPairs", newP);
                      }}
                      className="w-full py-2 border border-dashed border-[#247a6d] rounded-lg text-xs font-semibold text-[#1b5c53] hover:bg-[#e3eeec] transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 text-[#247a6d]" />
                      <span>+ Weiteres Zuordnungs-Paar hinzufügen</span>
                    </button>
                  )}
                </div>
              )}

              {/* ORDERING */}
              {currentStation.type === "ordering" && currentStation.orderingSteps && (
                <div className="space-y-2.5">
                  {currentStation.orderingSteps.map((step, sIdx) => (
                    <div key={step.id || sIdx} className="p-2.5 bg-[#f3f8f7] rounded-xl border border-[#bbd1cd] flex items-start gap-2.5">
                      <span className="w-6 h-6 rounded-full bg-[#247a6d] text-white flex items-center justify-center text-xs font-bold shrink-0 mt-1">
                        {sIdx + 1}
                      </span>
                      <div className="flex-1 space-y-1.5">
                        <input
                          type="text"
                          value={step.text}
                          onChange={(e) => {
                            const newS = [...currentStation.orderingSteps!];
                            newS[sIdx].text = e.target.value;
                            handleUpdateStation("orderingSteps", newS);
                          }}
                          placeholder={`Schritt ${sIdx + 1}...`}
                          className="w-full text-xs p-2 rounded-lg border border-[#bbd1cd] bg-white"
                        />
                        <input
                          type="text"
                          value={step.reason || ""}
                          onChange={(e) => {
                            const newS = [...currentStation.orderingSteps!];
                            newS[sIdx].reason = e.target.value;
                            handleUpdateStation("orderingSteps", newS);
                          }}
                          placeholder="Begründung für diese Reihenfolge..."
                          className="w-full text-xs p-1.5 rounded-lg border border-[#bbd1cd] bg-white text-gray-700"
                        />
                      </div>

                      {currentStation.orderingSteps!.length > 2 && (
                        <button
                          type="button"
                          onClick={() => {
                            const newS = currentStation.orderingSteps!
                              .filter((_, i) => i !== sIdx)
                              .map((s, idx) => ({ ...s, correctIndex: idx }));
                            handleUpdateStation("orderingSteps", newS);
                          }}
                          className="text-xs text-rose-600 hover:text-rose-800 p-1 rounded hover:bg-rose-50 shrink-0 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}

                  {currentStation.orderingSteps.length < 6 && (
                    <button
                      type="button"
                      onClick={() => {
                        const newS = [
                          ...currentStation.orderingSteps!,
                          {
                            id: `step-${Date.now()}`,
                            text: `Schritt ${currentStation.orderingSteps!.length + 1}`,
                            correctIndex: currentStation.orderingSteps!.length,
                            reason: "Begründung für diesen Schritt.",
                          },
                        ];
                        handleUpdateStation("orderingSteps", newS);
                      }}
                      className="w-full py-2 border border-dashed border-[#247a6d] rounded-lg text-xs font-semibold text-[#1b5c53] hover:bg-[#e3eeec] transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 text-[#247a6d]" />
                      <span>+ Weiteren Ablauf-Schritt hinzufügen</span>
                    </button>
                  )}
                </div>
              )}

              {/* BUCKET SORT */}
              {currentStation.type === "bucket_sort" && currentStation.bucketSortItems && (
                <div className="space-y-2.5">
                  <div className="p-3 bg-white rounded-xl border border-[#bbd1cd] grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="block text-[11px] font-bold text-emerald-800 mb-0.5">
                        Positiver Eimer (Button & Ablagezone):
                      </label>
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          value={currentStation.bucketDoLabel || ""}
                          onChange={(e) => handleUpdateStation("bucketDoLabel", e.target.value)}
                          placeholder="Button (z. B. Do ✓)"
                          className="w-1/2 p-1.5 text-xs rounded border border-[#bbd1cd] bg-white text-[#3a352d]"
                          title="Button-Beschriftung für diesen Eimer"
                        />
                        <input
                          type="text"
                          value={currentStation.bucketDoHeader || ""}
                          onChange={(e) => handleUpdateStation("bucketDoHeader", e.target.value)}
                          placeholder="Titel (z. B. 🟢 Empfohlen)"
                          className="w-1/2 p-1.5 text-xs rounded border border-[#bbd1cd] bg-white text-[#3a352d]"
                          title="Titel der Ablagezone"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-rose-800 mb-0.5">
                        Negativer Eimer (Button & Ablagezone):
                      </label>
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          value={currentStation.bucketDontLabel || ""}
                          onChange={(e) => handleUpdateStation("bucketDontLabel", e.target.value)}
                          placeholder="Button (z. B. Don't ✕)"
                          className="w-1/2 p-1.5 text-xs rounded border border-[#bbd1cd] bg-white text-[#3a352d]"
                          title="Button-Beschriftung für diesen Eimer"
                        />
                        <input
                          type="text"
                          value={currentStation.bucketDontHeader || ""}
                          onChange={(e) => handleUpdateStation("bucketDontHeader", e.target.value)}
                          placeholder="Titel (z. B. 🔴 Vermeiden)"
                          className="w-1/2 p-1.5 text-xs rounded border border-[#bbd1cd] bg-white text-[#3a352d]"
                          title="Titel der Ablagezone"
                        />
                      </div>
                    </div>
                  </div>
                  {currentStation.bucketSortItems.map((item, bIdx) => (
                    <div key={item.id || bIdx} className="p-2.5 bg-[#f3f8f7] rounded-xl border border-[#bbd1cd] space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <select
                          value={item.targetBucket}
                          onChange={(e) => {
                            const newB = [...currentStation.bucketSortItems!];
                            newB[bIdx].targetBucket = e.target.value as "do" | "dont";
                            handleUpdateStation("bucketSortItems", newB);
                          }}
                          className={`text-xs font-bold px-2 py-1 rounded border ${
                            item.targetBucket === "do"
                              ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                              : "bg-rose-50 text-rose-800 border-rose-300"
                          } outline-none cursor-pointer`}
                        >
                          <option value="do">🟢 Empfohlen (DO)</option>
                          <option value="dont">🔴 Vermeiden (DON'T)</option>
                        </select>

                        {currentStation.bucketSortItems!.length > 2 && (
                          <button
                            type="button"
                            onClick={() => {
                              const newB = currentStation.bucketSortItems!.filter((_, i) => i !== bIdx);
                              handleUpdateStation("bucketSortItems", newB);
                            }}
                            className="text-xs text-rose-600 hover:text-rose-800 p-1 rounded hover:bg-rose-50 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <input
                        type="text"
                        value={item.text}
                        onChange={(e) => {
                          const newB = [...currentStation.bucketSortItems!];
                          newB[bIdx].text = e.target.value;
                          handleUpdateStation("bucketSortItems", newB);
                        }}
                        placeholder="Maßnahme / Aussage..."
                        className="w-full text-xs p-2 rounded-lg border border-[#bbd1cd] bg-white"
                      />

                      <input
                        type="text"
                        value={item.explanation || ""}
                        onChange={(e) => {
                          const newB = [...currentStation.bucketSortItems!];
                          newB[bIdx].explanation = e.target.value;
                          handleUpdateStation("bucketSortItems", newB);
                        }}
                        placeholder="Begründung..."
                        className="w-full text-xs p-1.5 rounded-lg border border-[#bbd1cd] bg-white text-gray-700"
                      />
                    </div>
                  ))}

                  {currentStation.bucketSortItems.length < 8 && (
                    <button
                      type="button"
                      onClick={() => {
                        const newB = [
                          ...currentStation.bucketSortItems!,
                          {
                            id: `bucket-${Date.now()}`,
                            text: `Neue Verhaltensweise ${currentStation.bucketSortItems!.length + 1}`,
                            targetBucket: "do" as const,
                            explanation: "Begründung für die Zuordnung.",
                          },
                        ];
                        handleUpdateStation("bucketSortItems", newB);
                      }}
                      className="w-full py-2 border border-dashed border-[#247a6d] rounded-lg text-xs font-semibold text-[#1b5c53] hover:bg-[#e3eeec] transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 text-[#247a6d]" />
                      <span>+ Weiteres Sortier-Item hinzufügen</span>
                    </button>
                  )}
                </div>
              )}

              {/* MYTH VS FACT */}
              {currentStation.type === "myth_fact" && currentStation.mythFactItems && (
                <div className="space-y-2.5">
                  {currentStation.mythFactItems.map((item, mIdx) => (
                    <div key={item.id || mIdx} className="p-2.5 bg-[#f3f8f7] rounded-xl border border-[#bbd1cd] space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <select
                          value={item.isFact ? "fact" : "myth"}
                          onChange={(e) => {
                            const newM = [...currentStation.mythFactItems!];
                            newM[mIdx].isFact = e.target.value === "fact";
                            handleUpdateStation("mythFactItems", newM);
                          }}
                          className={`text-xs font-bold px-2 py-1 rounded border ${
                            item.isFact
                              ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                              : "bg-amber-50 text-amber-800 border-amber-300"
                          } outline-none cursor-pointer`}
                        >
                          <option value="fact">💡 FAKT (Wahr)</option>
                          <option value="myth">❌ MYTHOS (Irrtum)</option>
                        </select>

                        {currentStation.mythFactItems!.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              const newM = currentStation.mythFactItems!.filter((_, i) => i !== mIdx);
                              handleUpdateStation("mythFactItems", newM);
                            }}
                            className="text-xs text-rose-600 hover:text-rose-800 p-1 rounded hover:bg-rose-50 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <input
                        type="text"
                        value={item.statement}
                        onChange={(e) => {
                          const newM = [...currentStation.mythFactItems!];
                          newM[mIdx].statement = e.target.value;
                          handleUpdateStation("mythFactItems", newM);
                        }}
                        placeholder="Aussage / Behauptung..."
                        className="w-full text-xs p-2 rounded-lg border border-[#bbd1cd] bg-white"
                      />

                      <input
                        type="text"
                        value={item.explanation || ""}
                        onChange={(e) => {
                          const newM = [...currentStation.mythFactItems!];
                          newM[mIdx].explanation = e.target.value;
                          handleUpdateStation("mythFactItems", newM);
                        }}
                        placeholder="Fachliche Aufklärung..."
                        className="w-full text-xs p-1.5 rounded-lg border border-[#bbd1cd] bg-white text-gray-700"
                      />
                    </div>
                  ))}

                  {currentStation.mythFactItems.length < 6 && (
                    <button
                      type="button"
                      onClick={() => {
                        const newM = [
                          ...currentStation.mythFactItems!,
                          {
                            id: `myth-${Date.now()}`,
                            statement: `Behauptung ${currentStation.mythFactItems!.length + 1}...`,
                            isFact: false,
                            explanation: "Erklärung der wissenschaftlichen Faktenlage.",
                          },
                        ];
                        handleUpdateStation("mythFactItems", newM);
                      }}
                      className="w-full py-2 border border-dashed border-[#247a6d] rounded-lg text-xs font-semibold text-[#1b5c53] hover:bg-[#e3eeec] transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 text-[#247a6d]" />
                      <span>+ Weitere Mythos/Fakt-Aussage hinzufügen</span>
                    </button>
                  )}
                </div>
              )}

              {/* CHECKLIST */}
              {currentStation.type === "checklist" && currentStation.checklistItems && (
                <div className="space-y-2.5">
                  {currentStation.checklistItems.map((item, cIdx) => (
                    <div key={item.id || cIdx} className="p-2.5 bg-[#f3f8f7] rounded-xl border border-[#bbd1cd] space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 text-xs font-bold text-[#1b5c53] cursor-pointer">
                          <input
                            type="checkbox"
                            checked={item.isCorrect}
                            onChange={(e) => {
                              const newC = [...currentStation.checklistItems!];
                              newC[cIdx].isCorrect = e.target.checked;
                              handleUpdateStation("checklistItems", newC);
                            }}
                            className="text-[#247a6d] focus:ring-[#247a6d] rounded"
                          />
                          <span>{item.isCorrect ? "RICHTIG (Sollte angehakt werden)" : "FALSCH (Nicht anhaken)"}</span>
                        </label>

                        {currentStation.checklistItems!.length > 2 && (
                          <button
                            type="button"
                            onClick={() => {
                              const newC = currentStation.checklistItems!.filter((_, i) => i !== cIdx);
                              handleUpdateStation("checklistItems", newC);
                            }}
                            className="text-xs text-rose-600 hover:text-rose-800 p-1 rounded hover:bg-rose-50 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <input
                        type="text"
                        value={item.text}
                        onChange={(e) => {
                          const newC = [...currentStation.checklistItems!];
                          newC[cIdx].text = e.target.value;
                          handleUpdateStation("checklistItems", newC);
                        }}
                        className="w-full text-xs p-2 rounded-lg border border-[#bbd1cd] bg-white"
                      />

                      <input
                        type="text"
                        value={item.explanation || ""}
                        onChange={(e) => {
                          const newC = [...currentStation.checklistItems!];
                          newC[cIdx].explanation = e.target.value;
                          handleUpdateStation("checklistItems", newC);
                        }}
                        placeholder="Begründung..."
                        className="w-full text-xs p-1.5 rounded-lg border border-[#bbd1cd] bg-white text-gray-700"
                      />
                    </div>
                  ))}

                  {currentStation.checklistItems.length < 8 && (
                    <button
                      type="button"
                      onClick={() => {
                        const newC = [
                          ...currentStation.checklistItems!,
                          {
                            id: `check-${Date.now()}`,
                            text: `Prüfpunkt ${currentStation.checklistItems!.length + 1}`,
                            isCorrect: true,
                            explanation: "Begründung für diesen Prüfpunkt.",
                          },
                        ];
                        handleUpdateStation("checklistItems", newC);
                      }}
                      className="w-full py-2 border border-dashed border-[#247a6d] rounded-lg text-xs font-semibold text-[#1b5c53] hover:bg-[#e3eeec] transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 text-[#247a6d]" />
                      <span>+ Weiteren Prüfpunkt hinzufügen</span>
                    </button>
                  )}
                </div>
              )}

              {/* BRANCHING SCENARIO */}
              {currentStation.type === "branching_scenario" && currentStation.branchingScenario && (
                <div className="space-y-4">
                  {/* Depth mode & summary */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-[#e3eeec]/60 rounded-xl border border-[#bbd1cd]">
                    <div>
                      <label className="block text-xs font-bold text-[#1b5c53] mb-1">
                        Szenario-Tiefe
                      </label>
                      <select
                        value={currentStation.branchingScenario.depthMode}
                        onChange={(e) => {
                          const mode = e.target.value as "compact_2_steps" | "deep_3_steps";
                          handleUpdateStation("branchingScenario", {
                            ...currentStation.branchingScenario!,
                            depthMode: mode,
                          });
                        }}
                        className="w-full text-xs p-1.5 rounded-lg border border-[#bbd1cd] bg-white font-semibold text-[#1b5c53]"
                      >
                        <option value="compact_2_steps">Kompakter 2-Schritte-Pfad (Standard)</option>
                        <option value="deep_3_steps">Ausführlicher 3-Schritte-Pfad (Vertieft)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#1b5c53] mb-1">
                        ZQP-Zusammenfassung & Leitfaden
                      </label>
                      <input
                        type="text"
                        value={currentStation.branchingScenario.zqpSummaryAdvice || ""}
                        onChange={(e) => {
                          handleUpdateStation("branchingScenario", {
                            ...currentStation.branchingScenario!,
                            zqpSummaryAdvice: e.target.value,
                          });
                        }}
                        placeholder="Leitsatz nach ZQP-Expertenstandards..."
                        className="w-full text-xs p-1.5 rounded-lg border border-[#bbd1cd] bg-white"
                      />
                    </div>
                  </div>

                  {/* List of Scenes / Nodes */}
                  <div className="space-y-3">
                    <label className="block text-xs font-bold text-[#1b5c53] uppercase tracking-wide">
                      Szenen & Handlungspfade ({Object.keys(currentStation.branchingScenario.nodes || {}).length} Szenen)
                    </label>

                    {Object.entries(currentStation.branchingScenario.nodes || {}).map(([nodeId, node], nIdx) => (
                      <div key={nodeId} className="p-3 bg-[#f3f8f7] rounded-xl border border-[#bbd1cd] space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[#1b5c53]">
                            Szene {nIdx + 1}: {node.sceneTitle || nodeId}
                          </span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white border border-[#bbd1cd] text-slate-600">
                            ID: {nodeId}
                          </span>
                        </div>

                        <div className="space-y-1">
                          <label className="block text-[11px] font-semibold text-slate-700">Szenentitel</label>
                          <input
                            type="text"
                            value={node.sceneTitle}
                            onChange={(e) => {
                              const newNodes = { ...currentStation.branchingScenario!.nodes };
                              newNodes[nodeId] = { ...node, sceneTitle: e.target.value };
                              handleUpdateStation("branchingScenario", { ...currentStation.branchingScenario!, nodes: newNodes });
                            }}
                            className="w-full text-xs p-1.5 rounded-lg border border-[#bbd1cd] bg-white"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="block text-[11px] font-semibold text-slate-700">Situationsbeschreibung</label>
                          <textarea
                            rows={2}
                            value={node.situationDescription}
                            onChange={(e) => {
                              const newNodes = { ...currentStation.branchingScenario!.nodes };
                              newNodes[nodeId] = { ...node, situationDescription: e.target.value };
                              handleUpdateStation("branchingScenario", { ...currentStation.branchingScenario!, nodes: newNodes });
                            }}
                            className="w-full text-xs p-1.5 rounded-lg border border-[#bbd1cd] bg-white"
                          />
                        </div>

                        {/* Choices in this node */}
                        <div className="space-y-2 pt-1 border-t border-[#bbd1cd]/50">
                          <label className="block text-[11px] font-bold text-slate-700">Entscheidungs-Optionen ({node.choices?.length || 0})</label>
                          {(node.choices || []).map((ch, cIdx) => (
                            <div key={ch.id || cIdx} className="p-2 bg-white rounded-lg border border-[#bbd1cd] space-y-1.5">
                              <div className="flex items-center justify-between">
                                <label className="flex items-center gap-1.5 text-[11px] font-bold text-[#1b5c53] cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={ch.isOptimal}
                                    onChange={(e) => {
                                      const newChoices = [...node.choices];
                                      newChoices[cIdx] = { ...ch, isOptimal: e.target.checked };
                                      const newNodes = { ...currentStation.branchingScenario!.nodes };
                                      newNodes[nodeId] = { ...node, choices: newChoices };
                                      handleUpdateStation("branchingScenario", { ...currentStation.branchingScenario!, nodes: newNodes });
                                    }}
                                    className="text-[#247a6d] focus:ring-[#247a6d] rounded"
                                  />
                                  <span>Option {cIdx + 1} ({ch.isOptimal ? "Deeskalierend / Optimal" : "Risikobehaftet"})</span>
                                </label>
                                {ch.nextStepId && (
                                  <span className="text-[10px] text-slate-500 font-mono">
                                    ➔ {ch.nextStepId}
                                  </span>
                                )}
                              </div>

                              <input
                                type="text"
                                value={ch.text}
                                onChange={(e) => {
                                  const newChoices = [...node.choices];
                                  newChoices[cIdx] = { ...ch, text: e.target.value };
                                  const newNodes = { ...currentStation.branchingScenario!.nodes };
                                  newNodes[nodeId] = { ...node, choices: newChoices };
                                  handleUpdateStation("branchingScenario", { ...currentStation.branchingScenario!, nodes: newNodes });
                                }}
                                placeholder="Reaktionstext..."
                                className="w-full text-xs p-1.5 rounded border border-[#bbd1cd]"
                              />

                              <input
                                type="text"
                                value={ch.consequenceText}
                                onChange={(e) => {
                                  const newChoices = [...node.choices];
                                  newChoices[cIdx] = { ...ch, consequenceText: e.target.value };
                                  const newNodes = { ...currentStation.branchingScenario!.nodes };
                                  newNodes[nodeId] = { ...node, choices: newChoices };
                                  handleUpdateStation("branchingScenario", { ...currentStation.branchingScenario!, nodes: newNodes });
                                }}
                                placeholder="Unmittelbare Konsequenz / Reaktion der Person..."
                                className="w-full text-xs p-1.5 rounded border border-[#bbd1cd] text-slate-600"
                              />

                              <input
                                type="text"
                                value={ch.zqpAdvice || ""}
                                onChange={(e) => {
                                  const newChoices = [...node.choices];
                                  newChoices[cIdx] = { ...ch, zqpAdvice: e.target.value };
                                  const newNodes = { ...currentStation.branchingScenario!.nodes };
                                  newNodes[nodeId] = { ...node, choices: newChoices };
                                  handleUpdateStation("branchingScenario", { ...currentStation.branchingScenario!, nodes: newNodes });
                                }}
                                placeholder="ZQP-Praxistipp zu dieser Wahl..."
                                className="w-full text-xs p-1.5 rounded border border-[#bbd1cd] text-slate-600"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* COMPARISON (Situationsvergleich) */}
              {currentStation.type === "comparison" && currentStation.comparisonScenarios && (
                <div className="space-y-3">
                  <div className="p-3 bg-[#e3eeec]/60 rounded-xl border border-[#bbd1cd] text-xs text-[#1b5c53]">
                    <span className="font-bold">Situationsvergleich:</span> Wählen Sie die fachlich empfohlene bzw. sichere Situation aus und begründen Sie den Unterschied.
                  </div>
                  {currentStation.comparisonScenarios.map((sc, scIdx) => (
                    <div key={sc.id || scIdx} className="p-3 bg-[#f3f8f7] rounded-xl border border-[#bbd1cd] space-y-2 relative">
                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 text-xs font-bold text-[#1b5c53] cursor-pointer">
                          <input
                            type="radio"
                            name="comparison_correct"
                            checked={sc.isCorrect}
                            onChange={() => {
                              const newScenarios = currentStation.comparisonScenarios!.map((s, idx) => ({
                                ...s,
                                isCorrect: idx === scIdx,
                                badge: idx === scIdx ? "Empfohlen" : "Riskant",
                              }));
                              handleUpdateStation("comparisonScenarios", newScenarios);
                            }}
                            className="text-[#247a6d] focus:ring-[#247a6d]"
                          />
                          <span>{sc.title || `Situation ${sc.id}`} ({sc.isCorrect ? "EMPFOHLEN / SICHER" : "RISKANT / UNGEEIGNET"})</span>
                        </label>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700">Titel der Situation</label>
                          <input
                            type="text"
                            value={sc.title}
                            onChange={(e) => {
                              const newSc = [...currentStation.comparisonScenarios!];
                              newSc[scIdx] = { ...sc, title: e.target.value };
                              handleUpdateStation("comparisonScenarios", newSc);
                            }}
                            className="w-full text-xs p-2 rounded-lg border border-[#bbd1cd] bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700">Badge / Kennzeichnung</label>
                          <input
                            type="text"
                            value={sc.badge}
                            onChange={(e) => {
                              const newSc = [...currentStation.comparisonScenarios!];
                              newSc[scIdx] = { ...sc, badge: e.target.value };
                              handleUpdateStation("comparisonScenarios", newSc);
                            }}
                            className="w-full text-xs p-2 rounded-lg border border-[#bbd1cd] bg-white"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700">Situationsbeschreibung</label>
                        <textarea
                          rows={2}
                          value={sc.description}
                          onChange={(e) => {
                            const newSc = [...currentStation.comparisonScenarios!];
                            newSc[scIdx] = { ...sc, description: e.target.value };
                            handleUpdateStation("comparisonScenarios", newSc);
                          }}
                          className="w-full text-xs p-2 rounded-lg border border-[#bbd1cd] bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700">Fachliche Begründung</label>
                        <input
                          type="text"
                          value={sc.explanation}
                          onChange={(e) => {
                            const newSc = [...currentStation.comparisonScenarios!];
                            newSc[scIdx] = { ...sc, explanation: e.target.value };
                            handleUpdateStation("comparisonScenarios", newSc);
                          }}
                          placeholder="Warum ist diese Situation sicher bzw. riskant?"
                          className="w-full text-xs p-2 rounded-lg border border-[#bbd1cd] bg-white"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* FILL IN THE BLANK (Lückentext) */}
              {currentStation.type === "fill_in_the_blank" && (
                <div className="space-y-3">
                  <div className="p-3 bg-[#f3f8f7] rounded-xl border border-[#bbd1cd] space-y-2">
                    <label className="block text-xs font-bold text-[#1b5c53]">
                      Lückensatz (nutzen Sie [BLANK_1], [BLANK_2] als Platzhalter)
                    </label>
                    <textarea
                      rows={3}
                      value={currentStation.fillInSentence || ""}
                      onChange={(e) => handleUpdateStation("fillInSentence", e.target.value)}
                      placeholder="z. B. Bei der Pflege ist [BLANK_1] besonders wichtig, um [BLANK_2] zu vermeiden."
                      className="w-full text-xs p-2.5 rounded-lg border border-[#bbd1cd] bg-white"
                    />
                  </div>

                  {(currentStation.fillInBlanks || []).map((blank, bIdx) => (
                    <div key={blank.id || bIdx} className="p-3 bg-white rounded-xl border border-[#bbd1cd] space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#1b5c53]">
                          Lücke {bIdx + 1} ({blank.id})
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700">Richtiges Wort</label>
                          <input
                            type="text"
                            value={blank.correctWord}
                            onChange={(e) => {
                              const newBlanks = [...(currentStation.fillInBlanks || [])];
                              newBlanks[bIdx] = { ...blank, correctWord: e.target.value };
                              handleUpdateStation("fillInBlanks", newBlanks);
                            }}
                            className="w-full text-xs p-2 rounded-lg border border-[#bbd1cd] bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700">Auswahloptionen (kommagetrennt)</label>
                          <input
                            type="text"
                            value={(blank.options || []).join(", ")}
                            onChange={(e) => {
                              const opts = e.target.value.split(",").map((s) => s.trim()).filter(Boolean);
                              const newBlanks = [...(currentStation.fillInBlanks || [])];
                              newBlanks[bIdx] = { ...blank, options: opts };
                              handleUpdateStation("fillInBlanks", newBlanks);
                            }}
                            className="w-full text-xs p-2 rounded-lg border border-[#bbd1cd] bg-white"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Redaktionelle Notizen / Fachlicher Prüfvermerk */}
            <div className="pt-2 border-t border-[#bbd1cd]">
              <label className="block text-xs font-bold text-[#1b5c53] mb-1">
                Redaktionelle Notizen / Fachlicher Prüfvermerk
              </label>
              <textarea
                rows={2}
                value={currentStation.editorialNotes || ""}
                onChange={(e) => handleUpdateStation("editorialNotes", e.target.value)}
                placeholder="z. B. Fachliche Rückfrage an Redaktionsleitung; Quellenabgleich durchgeführt..."
                className="w-full text-xs p-2.5 rounded-lg border border-[#bbd1cd] bg-white focus:ring-2 focus:ring-[#247a6d] focus:outline-none"
              />
            </div>
          </>
        )}

        {editorSection === "result" && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className="p-4 bg-[#f3f8f7] rounded-xl border border-[#bbd1cd] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center shadow-xs">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#1b5c53]">
                    Ergebnis-Station (Abschlussseite) bearbeiten
                  </h3>
                  <p className="text-xs text-[#6e6c70]">
                    Passen Sie Titel, Fazit, Rückmeldungen je nach Punktestand und Button-Texte an.
                  </p>
                </div>
              </div>
            </div>

            {/* Basis-Texte */}
            <div className="p-4 bg-white rounded-xl border border-[#bbd1cd] space-y-3">
              <h4 className="text-xs font-bold uppercase text-[#1b5c53]">Allgemeine Abschluss-Texte</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#3a352d] mb-1">
                    Standard-Haupttitel:
                  </label>
                  <input
                    type="text"
                    value={resultConfig.title || ""}
                    onChange={(e) => setResultConfig((prev) => ({ ...prev, title: e.target.value }))}
                    placeholder="Praxistest abgeschlossen"
                    className="w-full text-xs p-2 rounded-lg border border-[#bbd1cd] bg-white text-[#3a352d] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#3a352d] mb-1">
                    Score-Box Überschrift:
                  </label>
                  <input
                    type="text"
                    value={resultConfig.scoreLabel || ""}
                    onChange={(e) => setResultConfig((prev) => ({ ...prev, scoreLabel: e.target.value }))}
                    placeholder="Ihr Praxistest-Ergebnis:"
                    className="w-full text-xs p-2 rounded-lg border border-[#bbd1cd] bg-white text-[#3a352d] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#3a352d] mb-1">
                  Unterzeile / Fachlicher Praxistipp (Fazit):
                </label>
                <textarea
                  rows={2}
                  value={resultConfig.subtitle || ""}
                  onChange={(e) => setResultConfig((prev) => ({ ...prev, subtitle: e.target.value }))}
                  placeholder="Allgemeine didaktische Zusammenfassung..."
                  className="w-full text-xs p-2 rounded-lg border border-[#bbd1cd] bg-white text-[#3a352d] outline-none"
                />
              </div>
            </div>

            {/* Dynamische Auswertungen nach Score */}
            <div className="p-4 bg-white rounded-xl border border-[#bbd1cd] space-y-4">
              <div>
                <h4 className="text-xs font-bold uppercase text-[#1b5c53] mb-0.5">
                  Rückmeldungen nach Leistung (Platzhalter: &#123;total&#125;, &#123;solved&#125;, &#123;percent&#125;)
                </h4>
                <p className="text-[11px] text-[#6e6c70]">
                  Hier können Sie Begrifflichkeiten wie „ZQP-Leitlinien“ durch passgenaue Formulierungen für dieses Quiz ersetzen.
                </p>
              </div>

              {/* 0 Stationen gelöst (0%) */}
              <div className="p-3 bg-stone-50 rounded-lg border border-stone-200 space-y-2">
                <span className="text-xs font-bold text-stone-700 block">
                  🔴 0 Stationen gelöst (0 %):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">Überschrift:</label>
                    <input
                      type="text"
                      value={resultConfig.zeroScoreTitle || ""}
                      onChange={(e) => setResultConfig((prev) => ({ ...prev, zeroScoreTitle: e.target.value }))}
                      placeholder="Praxistest durchlaufen"
                      className="w-full text-xs p-1.5 rounded border border-[#bbd1cd] bg-white"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">Hinweistext (z. B. ohne starres „ZQP-Leitlinien“):</label>
                    <input
                      type="text"
                      value={resultConfig.zeroScoreText || ""}
                      onChange={(e) => setResultConfig((prev) => ({ ...prev, zeroScoreText: e.target.value }))}
                      placeholder="Keine Station eigenständig gelöst. Wiederholen Sie das Training, um das Wissen zu festigen."
                      className="w-full text-xs p-1.5 rounded border border-[#bbd1cd] bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Teil-Erfolg (> 0%) */}
              <div className="p-3 bg-amber-50/60 rounded-lg border border-amber-200 space-y-2">
                <span className="text-xs font-bold text-amber-800 block">
                  🟡 Einige Stationen gelöst (&gt; 0 %):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">Überschrift:</label>
                    <input
                      type="text"
                      value={resultConfig.lowScoreTitle || ""}
                      onChange={(e) => setResultConfig((prev) => ({ ...prev, lowScoreTitle: e.target.value }))}
                      placeholder="Praxistest abgeschlossen"
                      className="w-full text-xs p-1.5 rounded border border-[#bbd1cd] bg-white"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">Hinweistext:</label>
                    <input
                      type="text"
                      value={resultConfig.lowScoreText || ""}
                      onChange={(e) => setResultConfig((prev) => ({ ...prev, lowScoreText: e.target.value }))}
                      placeholder="{solved} von {total} Stationen gelöst ({percent}%). Nutzen Sie die Erklärungen zur Vertiefung."
                      className="w-full text-xs p-1.5 rounded border border-[#bbd1cd] bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Solides Ergebnis (>= 60%) */}
              <div className="p-3 bg-teal-50/60 rounded-lg border border-teal-200 space-y-2">
                <span className="text-xs font-bold text-[#1b5c53] block">
                  🟢 Gutes Ergebnis (&gt;= 60 %):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">Überschrift:</label>
                    <input
                      type="text"
                      value={resultConfig.goodScoreTitle || ""}
                      onChange={(e) => setResultConfig((prev) => ({ ...prev, goodScoreTitle: e.target.value }))}
                      placeholder="Gutes Ergebnis im Praxistest"
                      className="w-full text-xs p-1.5 rounded border border-[#bbd1cd] bg-white"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">Hinweistext:</label>
                    <input
                      type="text"
                      value={resultConfig.goodScoreText || ""}
                      onChange={(e) => setResultConfig((prev) => ({ ...prev, goodScoreText: e.target.value }))}
                      placeholder="Solide Leistung: {solved} von {total} Stationen eigenständig gelöst ({percent}%)."
                      className="w-full text-xs p-1.5 rounded border border-[#bbd1cd] bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Voller Erfolg (100%) */}
              <div className="p-3 bg-emerald-50/60 rounded-lg border border-emerald-200 space-y-2">
                <span className="text-xs font-bold text-emerald-800 block">
                  🏆 Perfektes Ergebnis (100 %):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">Überschrift:</label>
                    <input
                      type="text"
                      value={resultConfig.perfectScoreTitle || ""}
                      onChange={(e) => setResultConfig((prev) => ({ ...prev, perfectScoreTitle: e.target.value }))}
                      placeholder="Hervorragend! Alle Aufgaben gelöst"
                      className="w-full text-xs p-1.5 rounded border border-[#bbd1cd] bg-white"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">Hinweistext:</label>
                    <input
                      type="text"
                      value={resultConfig.perfectScoreText || ""}
                      onChange={(e) => setResultConfig((prev) => ({ ...prev, perfectScoreText: e.target.value }))}
                      placeholder="Perfektes Ergebnis: Alle {total} Stationen eigenständig gemeistert (100%)."
                      className="w-full text-xs p-1.5 rounded border border-[#bbd1cd] bg-white"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Buttons auf Abschlussseite */}
            <div className="p-4 bg-white rounded-xl border border-[#bbd1cd] space-y-3">
              <h4 className="text-xs font-bold uppercase text-[#1b5c53]">Buttons auf der Abschlussseite</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#3a352d] mb-1">
                    Wiederholen-Button:
                  </label>
                  <input
                    type="text"
                    value={resultConfig.restartButtonText || ""}
                    onChange={(e) => setResultConfig((prev) => ({ ...prev, restartButtonText: e.target.value }))}
                    placeholder="Praxistest wiederholen"
                    className="w-full text-xs p-2 rounded-lg border border-[#bbd1cd] bg-white text-[#3a352d] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#3a352d] mb-1">
                    PDF-Druck-Button:
                  </label>
                  <input
                    type="text"
                    value={resultConfig.printButtonText || ""}
                    onChange={(e) => setResultConfig((prev) => ({ ...prev, printButtonText: e.target.value }))}
                    placeholder="Ergebnis als PDF drucken"
                    className="w-full text-xs p-2 rounded-lg border border-[#bbd1cd] bg-white text-[#3a352d] outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {editorSection === "labels" && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className="p-4 bg-[#f3f8f7] rounded-xl border border-[#bbd1cd] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#247a6d] text-white flex items-center justify-center shadow-xs">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#1b5c53]">
                    Text-Bausteine & UI-Labels für dieses Quiz anpassen
                  </h3>
                  <p className="text-xs text-[#6e6c70]">
                    Überschreiben Sie Begrifflichkeiten wie „Ansicht ansehen“, „Warum richtig / Warum falsch“ oder „Do / Don't“.
                  </p>
                </div>
              </div>
            </div>

            {/* Feedback Drawer */}
            <div className="p-4 bg-white rounded-xl border border-[#bbd1cd] space-y-3">
              <h4 className="text-xs font-bold uppercase text-[#1b5c53]">Rückmeldungen & Feedback-Schublade</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#3a352d] mb-1">
                    Schließen-Button (Drawer):
                  </label>
                  <input
                    type="text"
                    value={customLabels.feedbackCloseLabel || ""}
                    onChange={(e) => setCustomLabels((prev) => ({ ...prev, feedbackCloseLabel: e.target.value }))}
                    placeholder="Ansicht ansehen ✕"
                    className="w-full text-xs p-2 rounded-lg border border-[#bbd1cd] bg-white text-[#3a352d] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#3a352d] mb-1">
                    Feedback-Box 1 (Erklärung):
                  </label>
                  <input
                    type="text"
                    value={customLabels.feedbackWhyLabel || ""}
                    onChange={(e) => setCustomLabels((prev) => ({ ...prev, feedbackWhyLabel: e.target.value }))}
                    placeholder="Warum richtig / Warum falsch:"
                    className="w-full text-xs p-2 rounded-lg border border-[#bbd1cd] bg-white text-[#3a352d] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#3a352d] mb-1">
                    Feedback-Box 2 (Hintergrund):
                  </label>
                  <input
                    type="text"
                    value={customLabels.feedbackKnowledgeLabel || ""}
                    onChange={(e) => setCustomLabels((prev) => ({ ...prev, feedbackKnowledgeLabel: e.target.value }))}
                    placeholder="ZQP-Praxiswissen:"
                    className="w-full text-xs p-2 rounded-lg border border-[#bbd1cd] bg-white text-[#3a352d] outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Buttons & Navigation */}
            <div className="p-4 bg-white rounded-xl border border-[#bbd1cd] space-y-3">
              <h4 className="text-xs font-bold uppercase text-[#1b5c53]">Navigation & Buttons</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#3a352d] mb-1">
                    Button Nächste Station:
                  </label>
                  <input
                    type="text"
                    value={customLabels.nextStationLabel || ""}
                    onChange={(e) => setCustomLabels((prev) => ({ ...prev, nextStationLabel: e.target.value }))}
                    placeholder="Nächste Station"
                    className="w-full text-xs p-2 rounded-lg border border-[#bbd1cd] bg-white text-[#3a352d] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#3a352d] mb-1">
                    Button Letzte Station (Abschluss):
                  </label>
                  <input
                    type="text"
                    value={customLabels.finishStationLabel || ""}
                    onChange={(e) => setCustomLabels((prev) => ({ ...prev, finishStationLabel: e.target.value }))}
                    placeholder="Zur Gesamtauswertung"
                    className="w-full text-xs p-2 rounded-lg border border-[#bbd1cd] bg-white text-[#3a352d] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#3a352d] mb-1">
                    Button Neustart:
                  </label>
                  <input
                    type="text"
                    value={customLabels.restartQuizLabel || ""}
                    onChange={(e) => setCustomLabels((prev) => ({ ...prev, restartQuizLabel: e.target.value }))}
                    placeholder="Praxistest wiederholen"
                    className="w-full text-xs p-2 rounded-lg border border-[#bbd1cd] bg-white text-[#3a352d] outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Dos & Don'ts Defaults */}
            <div className="p-4 bg-white rounded-xl border border-[#bbd1cd] space-y-3">
              <h4 className="text-xs font-bold uppercase text-[#1b5c53]">Dos & Don'ts (Standard für dieses Quiz)</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 bg-emerald-50/50 rounded-lg border border-emerald-200 space-y-2">
                  <span className="text-xs font-bold text-emerald-800 block">Positiver Bereich (Do)</span>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">Button-Beschriftung:</label>
                      <input
                        type="text"
                        value={customLabels.bucketDoLabel || ""}
                        onChange={(e) => setCustomLabels((prev) => ({ ...prev, bucketDoLabel: e.target.value }))}
                        placeholder="Do ✓"
                        className="w-full text-xs p-1.5 rounded border border-[#bbd1cd] bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">Ablage-Titel:</label>
                      <input
                        type="text"
                        value={customLabels.bucketDoHeader || ""}
                        onChange={(e) => setCustomLabels((prev) => ({ ...prev, bucketDoHeader: e.target.value }))}
                        placeholder="Empfohlen (Do)"
                        className="w-full text-xs p-1.5 rounded border border-[#bbd1cd] bg-white"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-rose-50/50 rounded-lg border border-rose-200 space-y-2">
                  <span className="text-xs font-bold text-rose-800 block">Negativer Bereich (Don't)</span>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">Button-Beschriftung:</label>
                      <input
                        type="text"
                        value={customLabels.bucketDontLabel || ""}
                        onChange={(e) => setCustomLabels((prev) => ({ ...prev, bucketDontLabel: e.target.value }))}
                        placeholder="Don't ✕"
                        className="w-full text-xs p-1.5 rounded border border-[#bbd1cd] bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">Ablage-Titel:</label>
                      <input
                        type="text"
                        value={customLabels.bucketDontHeader || ""}
                        onChange={(e) => setCustomLabels((prev) => ({ ...prev, bucketDontHeader: e.target.value }))}
                        placeholder="Vermeiden (Don't)"
                        className="w-full text-xs p-1.5 rounded border border-[#bbd1cd] bg-white"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

          {/* Footer */}
          <div className="bg-[#f3f8f7] border-t border-[#bbd1cd] px-5 py-3 flex items-center justify-between shrink-0 gap-2">
            <div className="min-w-0">
              {savedFavMsg ? (
                <span className="text-xs font-semibold text-emerald-700 animate-in fade-in">
                  ✓ {savedFavMsg}
                </span>
              ) : (
                <span className="text-[11px] text-[#6e6c70] hidden sm:inline truncate">
                  Speichern erzeugt eine neue Version im Revisionsverlauf.
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 bg-white border border-[#bbd1cd] hover:border-[#247a6d] text-xs font-semibold text-[#1b5c53] rounded-lg transition-colors cursor-pointer"
              >
                Abbrechen
              </button>
              <button
                type="button"
                onClick={handleApplyToPreview}
                className="px-3 py-1.5 bg-white hover:bg-[#edf7f4] border border-[#247a6d] text-xs font-semibold text-[#1b5c53] rounded-lg shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Sofort in die Live-Vorschau übernehmen, ohne den Editor zu schließen"
              >
                <Eye className="w-3.5 h-3.5 text-[#247a6d]" />
                <span className="hidden sm:inline">In Vorschau anwenden</span>
                <span className="sm:hidden">Anwenden</span>
              </button>
              <button
                type="button"
                onClick={handleSaveAll}
                className="px-3.5 py-1.5 bg-[#247a6d] hover:bg-[#1b5c53] text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Speichern & Schließen</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {settings && isVariantsModalOpen && (
        <StationVariantsModal
          isOpen={isVariantsModalOpen}
          onClose={() => setIsVariantsModalOpen(false)}
          station={currentStation}
          contextTopic={quiz.title}
          settings={settings}
          onSelectVariant={handleApplyVariant}
        />
      )}

      {/* Modal: Neue Station hinzufügen (Format-Auswahl) */}
      {isAddModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-station-title"
          className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 p-3 sm:p-5 backdrop-blur-xs animate-in fade-in duration-150"
        >
          {/* Backdrop overlay */}
          <div
            className="absolute inset-0 cursor-default"
            onClick={() => setIsAddModalOpen(false)}
            aria-hidden="true"
          />

          <div className="relative bg-white border border-[#bbd1cd] rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden z-10 animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="bg-[#f3f8f7] border-b border-[#bbd1cd] px-5 py-3.5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-[#247a6d] text-white flex items-center justify-center shadow-xs shrink-0">
                  <Plus className="w-4.5 h-4.5" />
                </div>
                <div className="min-w-0">
                  <h3 id="add-station-title" className="text-base font-bold text-[#1b5c53] truncate">
                    Neue Lernstation hinzufügen
                  </h3>
                  <p className="text-xs text-[#6e6c70] truncate">
                    Wählen Sie das didaktische Spielformat für Station {stations.length + 1} aus (10 ZQP-Formate):
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-[#e3eeec] transition-colors cursor-pointer"
                title="Abbrechen"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Grid of formats */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3 zqp-scrollbar">
              {STATION_FORMATS.map((fmt) => (
                <button
                  key={fmt.type}
                  type="button"
                  onClick={() => handleAddNewStation(fmt.type)}
                  className="text-left p-3.5 rounded-xl border border-[#bbd1cd] hover:border-[#247a6d] hover:bg-[#f3f8f7] bg-white transition-all shadow-2xs hover:shadow-sm cursor-pointer flex items-start gap-3 group focus:outline-none focus:ring-2 focus:ring-[#247a6d]"
                >
                  <div className="w-9 h-9 rounded-lg bg-[#e3eeec] group-hover:bg-[#247a6d] group-hover:text-white flex items-center justify-center text-lg shrink-0 transition-colors">
                    <span>{fmt.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <span className="text-xs font-bold text-[#1b5c53] group-hover:text-[#144740] truncate">
                        {fmt.title}
                      </span>
                      <span className="text-[10px] font-semibold text-[#6e6c70] bg-[#e3eeec]/80 px-1.5 py-0.5 rounded shrink-0">
                        {fmt.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#3a352d] font-medium leading-tight line-clamp-1 mb-0.5">
                      {fmt.tagline}
                    </p>
                    <p className="text-[10px] text-[#6e6c70] leading-snug line-clamp-2">
                      {fmt.description}
                    </p>
                  </div>
                </button>
              ))}
            </div>

            {/* Footer */}
            <div className="bg-[#fcfaf8] border-t border-[#e2ddd5] px-5 py-3 flex items-center justify-end shrink-0">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-1.5 rounded-lg border border-[#bbd1cd] bg-white text-xs font-semibold text-[#6e6c70] hover:bg-gray-100 transition-colors cursor-pointer"
              >
                Abbrechen
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
