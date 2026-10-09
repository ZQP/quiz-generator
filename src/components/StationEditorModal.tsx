import React, { useState } from "react";
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
} from "lucide-react";
import { QuizGenerationResult, QuizStation, AppSettings, EditorialStatus, StationType } from "../types";
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
};

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
  const [activeStationIdx, setActiveStationIdx] = useState<number>(initialStationIndex);
  const [stations, setStations] = useState<QuizStation[]>(() =>
    JSON.parse(JSON.stringify(quiz.stations || []))
  );
  const [isVariantsModalOpen, setIsVariantsModalOpen] = useState<boolean>(false);
  const [isAddMenuOpen, setIsAddMenuOpen] = useState<boolean>(false);
  const [savedFavMsg, setSavedFavMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentStation = stations[activeStationIdx];
  if (!currentStation) return null;

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
    setIsAddMenuOpen(false);
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

  const handleSaveAll = () => {
    const updatedQuiz: QuizGenerationResult = {
      ...quiz,
      stations: stations,
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
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in duration-150"
      >
        <div className="bg-white rounded-2xl border border-[#bbd1cd] shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-[#f3f8f7] border-b border-[#bbd1cd] px-6 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#247a6d] text-white flex items-center justify-center shadow-xs">
                <Edit3 className="w-5 h-5" />
              </div>
              <div>
                <h2 id="station-editor-title" className="text-base font-bold text-[#1b5c53]">
                  Station direkt bearbeiten (WYSIWYG-Editor)
                </h2>
                <p className="text-xs text-[#6e6c70]">
                  Texte, Optionen, Reihenfolge & Struktur ohne KI anpassen
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              aria-label="Schließen"
              className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-[#e3eeec] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Station Navigation Tab Bar with Reorder & Add */}
          <div className="bg-[#fcfaf8] border-b border-[#e2ddd5] px-6 py-2 flex items-center justify-between gap-2 overflow-x-auto">
            <div className="flex items-center gap-1.5 flex-nowrap">
              {stations.map((st, idx) => (
                <button
                  key={st.id || idx}
                  onClick={() => setActiveStationIdx(idx)}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                    activeStationIdx === idx
                      ? "bg-[#247a6d] text-white shadow-2xs"
                      : "bg-white border border-[#bbd1cd] text-[#6e6c70] hover:text-[#1b5c53]"
                  }`}
                >
                  <span>
                    Station {idx + 1}: {st.type}
                  </span>
                  <span
                    className={`w-2 h-2 rounded-full ${
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
              <div className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => setIsAddMenuOpen(!isAddMenuOpen)}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-dashed border-[#247a6d] text-[#1b5c53] hover:bg-[#e3eeec] transition-colors flex items-center gap-1 cursor-pointer"
                  title="Neue Station hinzufügen"
                >
                  <Plus className="w-3.5 h-3.5 text-[#247a6d]" />
                  <span>+ Station</span>
                </button>

                {isAddMenuOpen && (
                  <div className="absolute left-0 mt-1.5 w-56 bg-white border border-[#bbd1cd] rounded-xl shadow-xl z-20 p-1.5 space-y-0.5 animate-in fade-in duration-100">
                    <span className="block px-2 py-1 text-[10px] font-bold uppercase text-[#1b5c53]">
                      Spielformat auswählen:
                    </span>
                    {(Object.keys(STATION_TYPE_LABELS) as StationType[]).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => handleAddNewStation(type)}
                        className="w-full text-left px-2 py-1.5 text-xs text-[#3a352d] hover:bg-[#f3f8f7] hover:text-[#1b5c53] rounded-lg transition-colors flex items-center justify-between cursor-pointer"
                      >
                        <span>{STATION_TYPE_LABELS[type]}</span>
                        <span className="text-[10px] text-gray-400 font-mono">{type}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => setActiveStationIdx((prev) => Math.max(0, prev - 1))}
                disabled={activeStationIdx === 0}
                className="p-1 text-gray-500 hover:text-[#1b5c53] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                title="Vorherige Station"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-bold text-[#1b5c53]">
                {activeStationIdx + 1} / {stations.length}
              </span>
              <button
                onClick={() => setActiveStationIdx((prev) => Math.min(stations.length - 1, prev + 1))}
                disabled={activeStationIdx === stations.length - 1}
                className="p-1 text-gray-500 hover:text-[#1b5c53] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                title="Nächste Station"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Editor Body */}
          <div className="p-6 overflow-y-auto flex-1 space-y-4">
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
          </div>

          {/* Footer */}
          <div className="bg-[#f3f8f7] border-t border-[#bbd1cd] px-6 py-3 flex items-center justify-between">
            <span className="text-xs text-[#6e6c70]">
              Speichern erzeugt eine neue Version im Revisionsverlauf (Undo/Redo bleibt erhalten).
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-white border border-[#bbd1cd] hover:border-[#247a6d] text-xs font-semibold text-[#1b5c53] rounded-lg transition-colors cursor-pointer"
              >
                Abbrechen
              </button>
              <button
                onClick={handleSaveAll}
                className="px-4 py-2 bg-[#247a6d] hover:bg-[#1b5c53] text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Änderungen als neue Version speichern</span>
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
    </>
  );
};
