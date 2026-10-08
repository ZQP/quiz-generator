import React, { useState } from "react";
import { X, Edit3, Save, ArrowLeft, ArrowRight, Dices, Star, Quote, Shield } from "lucide-react";
import { QuizGenerationResult, QuizStation, AppSettings, EditorialStatus } from "../types";
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
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in duration-150">
        <div className="bg-white rounded-2xl border border-[#bbd1cd] shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-[#f3f8f7] border-b border-[#bbd1cd] px-6 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#247a6d] text-white flex items-center justify-center shadow-xs">
                <Edit3 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-[#1b5c53]">
                  Station direkt bearbeiten (WYSIWYG-Editor)
                </h2>
                <p className="text-xs text-[#6e6c70]">
                  Texte, Antwortoptionen & didaktische Erklärungen ohne KI anpassen
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-[#e3eeec] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Station Navigation Tab Bar */}
          <div className="bg-[#fcfaf8] border-b border-[#e2ddd5] px-6 py-2 flex items-center justify-between gap-2 overflow-x-auto">
            <div className="flex items-center gap-1.5">
              {stations.map((st, idx) => (
                <button
                  key={st.id || idx}
                  onClick={() => setActiveStationIdx(idx)}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all shrink-0 flex items-center gap-1.5 ${
                    activeStationIdx === idx
                      ? "bg-[#247a6d] text-white shadow-2xs"
                      : "bg-white border border-[#bbd1cd] text-[#6e6c70] hover:text-[#1b5c53]"
                  }`}
                >
                  <span>Station {idx + 1}: {st.type}</span>
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
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => setActiveStationIdx((prev) => Math.max(0, prev - 1))}
                disabled={activeStationIdx === 0}
                className="p-1 text-gray-500 hover:text-[#1b5c53] disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-bold text-[#1b5c53]">
                {activeStationIdx + 1} / {stations.length}
              </span>
              <button
                onClick={() => setActiveStationIdx((prev) => Math.min(stations.length - 1, prev + 1))}
                disabled={activeStationIdx === stations.length - 1}
                className="p-1 text-gray-500 hover:text-[#1b5c53] disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Editor Body */}
          <div className="p-6 overflow-y-auto flex-1 space-y-4">
            {/* Redaktions-Toolbar: Status, Varianten, Schatzkiste */}
            <div className="p-3 bg-[#f3f8f7] rounded-xl border border-[#bbd1cd] flex flex-wrap items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#1b5c53] flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5 text-[#247a6d]" />
                  <span>Redaktions-Status:</span>
                </span>
                <select
                  value={currentStation.editorialStatus || "draft"}
                  onChange={(e) => handleUpdateStation("editorialStatus", e.target.value as EditorialStatus)}
                  className="rounded-lg border border-[#bbd1cd] px-2.5 py-1 text-xs font-bold bg-white text-[#1b5c53] outline-none cursor-pointer"
                >
                  <option value="draft">🟡 Entwurf</option>
                  <option value="in_review">🔵 In Fachprüfung</option>
                  <option value="approved">🟢 Freigegeben für Web</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                {savedFavMsg && (
                  <span className="text-xs text-emerald-700 font-bold animate-in fade-in">
                    {savedFavMsg}
                  </span>
                )}

                <button
                  type="button"
                  onClick={handleSaveToFavorites}
                  className="px-2.5 py-1 rounded-lg border border-[#bbd1cd] bg-white hover:bg-[#e3eeec] text-[#1b5c53] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Diese Station in der Schatzkiste als wiederverwendbare Vorlage speichern"
                >
                  <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  <span>In Schatzkiste</span>
                </button>

                {settings && (
                  <button
                    type="button"
                    onClick={() => setIsVariantsModalOpen(true)}
                    className="px-2.5 py-1 rounded-lg bg-[#247a6d] hover:bg-[#1b5c53] text-white text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                    title="Gemini erzeugt 3 didaktische Alternativen für diese Station"
                  >
                    <Dices className="w-3.5 h-3.5" />
                    <span>🎲 3 KI-Varianten würfeln</span>
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
                  Spieltyp (Typ: {currentStation.type})
                </label>
                <input
                  type="text"
                  disabled
                  value={currentStation.type}
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
            <h4 className="text-xs font-bold text-[#1b5c53] uppercase tracking-wider mb-2">
              Antwort- & Zuordnungsoptionen
            </h4>

            {/* SINGLE CHOICE */}
            {currentStation.type === "single_choice" && currentStation.options && (
              <div className="space-y-3">
                {currentStation.options.map((opt, oIdx) => (
                  <div key={oIdx} className="p-3 bg-[#f3f8f7] rounded-xl border border-[#bbd1cd] space-y-2">
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
              </div>
            )}

            {/* DILEMMA */}
            {currentStation.type === "dilemma" && currentStation.dilemmaReactions && (
              <div className="space-y-3">
                {currentStation.dilemmaReactions.map((reaction, rIdx) => (
                  <div key={reaction.id || rIdx} className="p-3 bg-[#f3f8f7] rounded-xl border border-[#bbd1cd] space-y-2">
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
              </div>
            )}

            {/* MATCHING */}
            {currentStation.type === "matching" && currentStation.matchingPairs && (
              <div className="space-y-2.5">
                {currentStation.matchingPairs.map((pair, pIdx) => (
                  <div key={pair.id || pIdx} className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-2.5 bg-[#f3f8f7] rounded-xl border border-[#bbd1cd]">
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
                ))}
              </div>
            )}

            {/* MYTH FACT */}
            {currentStation.type === "myth_fact" && currentStation.mythFactItems && (
              <div className="space-y-3">
                {currentStation.mythFactItems.map((item, mIdx) => (
                  <div key={item.id || mIdx} className="p-3 bg-[#f3f8f7] rounded-xl border border-[#bbd1cd] space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-[#1b5c53]">Aussage ist:</span>
                      <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                        <input
                          type="radio"
                          name={`myth_fact_${mIdx}`}
                          checked={item.isFact}
                          onChange={() => {
                            const newM = [...currentStation.mythFactItems!];
                            newM[mIdx].isFact = true;
                            handleUpdateStation("mythFactItems", newM);
                          }}
                        />
                        <span className="font-semibold text-emerald-800">FAKT</span>
                      </label>
                      <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                        <input
                          type="radio"
                          name={`myth_fact_${mIdx}`}
                          checked={!item.isFact}
                          onChange={() => {
                            const newM = [...currentStation.mythFactItems!];
                            newM[mIdx].isFact = false;
                            handleUpdateStation("mythFactItems", newM);
                          }}
                        />
                        <span className="font-semibold text-amber-900">MYTHOS</span>
                      </label>
                    </div>

                    <input
                      type="text"
                      value={item.statement}
                      onChange={(e) => {
                        const newM = [...currentStation.mythFactItems!];
                        newM[mIdx].statement = e.target.value;
                        handleUpdateStation("mythFactItems", newM);
                      }}
                      placeholder="Aussage..."
                      className="w-full text-xs p-2 rounded-lg border border-[#bbd1cd] bg-white"
                    />

                    <input
                      type="text"
                      value={item.explanation}
                      onChange={(e) => {
                        const newM = [...currentStation.mythFactItems!];
                        newM[mIdx].explanation = e.target.value;
                        handleUpdateStation("mythFactItems", newM);
                      }}
                      placeholder="Begründung..."
                      className="w-full text-xs p-2 rounded-lg border border-[#bbd1cd] bg-white"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* CHECKLIST */}
            {currentStation.type === "checklist" && currentStation.checklistItems && (
              <div className="space-y-2">
                {currentStation.checklistItems.map((item, cIdx) => (
                  <div key={item.id || cIdx} className="p-2.5 bg-[#f3f8f7] rounded-xl border border-[#bbd1cd] space-y-1.5">
                    <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={item.isCorrect}
                        onChange={(e) => {
                          const newC = [...currentStation.checklistItems!];
                          newC[cIdx].isCorrect = e.target.checked;
                          handleUpdateStation("checklistItems", newC);
                        }}
                      />
                      <span>{item.isCorrect ? "KORREKTE KERNMASSNAHME" : "ABLENKER / FALSCH"}</span>
                    </label>
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
                  </div>
                ))}
              </div>
            )}
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
