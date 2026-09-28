import React, { useState, useEffect } from "react";
import { RotateCcw, Monitor, Smartphone, ArrowRight, ArrowUp, ArrowDown, Award } from "lucide-react";
import { QuizGenerationResult, QuizStation, MatchingPair } from "../types";

interface QuizPreviewProps {
  quiz: QuizGenerationResult;
  onReset: () => void;
}

export const QuizPreview: React.FC<QuizPreviewProps> = ({ quiz, onReset }) => {
  const [viewport, setViewport] = useState<"desktop" | "mobile">("desktop");
  const [currentStationIdx, setCurrentStationIdx] = useState<number>(0);
  const [completed, setCompleted] = useState<boolean>(false);

  // Station state
  const currentStation: QuizStation | undefined = quiz.stations[currentStationIdx];

  // Matching state
  const [selectedThreat, setSelectedThreat] = useState<{ id: string; btnId: string } | null>(null);
  const [selectedSolution, setSelectedSolution] = useState<{ id: string; btnId: string } | null>(null);
  const [matchedIds, setMatchedIds] = useState<string[]>([]);
  const [matchFeedback, setMatchFeedback] = useState<{ isCorrect: boolean; text: string } | null>(null);

  // Ordering state
  const [orderedList, setOrderedList] = useState<{ id: string; text: string; correctIndex: number }[]>([]);
  const [orderFeedback, setOrderFeedback] = useState<{ isCorrect: boolean; text: string } | null>(null);

  // Comparison state
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(null);
  const [comparisonFeedback, setComparisonFeedback] = useState<{ isCorrect: boolean; text: string } | null>(null);

  // Single choice state
  const [selectedOptionIdx, setSelectedOptionIdx] = useState<number | null>(null);
  const [choiceFeedback, setChoiceFeedback] = useState<{ isCorrect: boolean; text: string } | null>(null);

  const [canAdvance, setCanAdvance] = useState<boolean>(false);

  // Reset station sub-state on station change
  useEffect(() => {
    setSelectedThreat(null);
    setSelectedSolution(null);
    setMatchedIds([]);
    setMatchFeedback(null);
    setSelectedScenarioId(null);
    setComparisonFeedback(null);
    setSelectedOptionIdx(null);
    setChoiceFeedback(null);
    setCanAdvance(false);

    if (currentStation?.type === "ordering" && currentStation.orderingSteps) {
      // Shuffle ordering initially
      const shuffled = [...currentStation.orderingSteps].sort(() => Math.random() - 0.5);
      setOrderedList(shuffled);
    }
  }, [currentStationIdx, currentStation]);

  const handleReset = () => {
    setCurrentStationIdx(0);
    setCompleted(false);
    onReset();
  };

  // --- MATCHING HANDLER ---
  const handleSelectThreat = (pair: MatchingPair) => {
    if (matchedIds.includes(pair.id)) return;
    setSelectedThreat({ id: pair.id, btnId: `threat-${pair.id}` });

    if (selectedSolution) {
      checkMatch(pair.id, selectedSolution.id);
    }
  };

  const handleSelectSolution = (pair: MatchingPair) => {
    if (matchedIds.includes(pair.id)) return;
    setSelectedSolution({ id: pair.id, btnId: `sol-${pair.id}` });

    if (selectedThreat) {
      checkMatch(selectedThreat.id, pair.id);
    }
  };

  const checkMatch = (threatId: string, solutionId: string) => {
    if (threatId === solutionId) {
      const nextMatched = [...matchedIds, threatId];
      setMatchedIds(nextMatched);
      setSelectedThreat(null);
      setSelectedSolution(null);
      setMatchFeedback({
        isCorrect: true,
        text: `Treffer! (${nextMatched.length} von ${currentStation?.matchingPairs?.length || 0} gelöst)`,
      });

      if (nextMatched.length === (currentStation?.matchingPairs?.length || 0)) {
        setCanAdvance(true);
      }
    } else {
      setMatchFeedback({
        isCorrect: false,
        text: "Diese Maßnahme passt besser zu einer anderen Gefahr. Versuchen Sie es noch einmal!",
      });
      setTimeout(() => {
        setSelectedThreat(null);
        setSelectedSolution(null);
      }, 700);
    }
  };

  // --- ORDERING HANDLER ---
  const handleMoveOrderItem = (idx: number, direction: -1 | 1) => {
    const targetIdx = idx + direction;
    if (targetIdx < 0 || targetIdx >= orderedList.length) return;
    const copy = [...orderedList];
    const item = copy.splice(idx, 1)[0];
    copy.splice(targetIdx, 0, item);
    setOrderedList(copy);
  };

  const handleCheckOrder = () => {
    const isAllCorrect = orderedList.every((step, i) => step.correctIndex === i);
    if (isAllCorrect) {
      setOrderFeedback({
        isCorrect: true,
        text: currentStation?.zqpRationale || "Perfekt sortiert! Alle Schritte sind in der richtigen logischen Reihenfolge.",
      });
      setCanAdvance(true);
    } else {
      setOrderFeedback({
        isCorrect: false,
        text: "Die Reihenfolge ist noch nicht optimal. Überprüfen Sie, welcher Schritt als erstes erfolgen muss.",
      });
    }
  };

  // --- COMPARISON HANDLER ---
  const handleCheckComparison = () => {
    if (!selectedScenarioId) return;
    const scenario = currentStation?.comparisonScenarios?.find((s) => s.id === selectedScenarioId);
    if (!scenario) return;

    setComparisonFeedback({
      isCorrect: scenario.isCorrect,
      text: scenario.explanation || currentStation?.zqpRationale || "",
    });

    if (scenario.isCorrect) {
      setCanAdvance(true);
    }
  };

  // --- SINGLE CHOICE HANDLER ---
  const handleCheckChoice = () => {
    if (selectedOptionIdx === null || !currentStation?.options) return;
    const opt = currentStation.options[selectedOptionIdx];
    setChoiceFeedback({
      isCorrect: opt.isCorrect,
      text: opt.explanation || currentStation.zqpRationale || "",
    });

    if (opt.isCorrect) {
      setCanAdvance(true);
    }
  };

  const handleNextStation = () => {
    if (currentStationIdx < quiz.stations.length - 1) {
      setCurrentStationIdx((prev) => prev + 1);
    } else {
      setCompleted(true);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Top Controls Bar */}
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#bbd1cd]">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-[#1b5c53]">
            {completed
              ? "Auswertung"
              : `Station ${currentStationIdx + 1} von ${quiz.stations.length}`}
          </span>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#e3eeec] text-[#1b5c53] font-medium border border-[#bbd1cd]">
            {currentStation?.type === "matching" && "🧩 Zuordnungs-Puzzle"}
            {currentStation?.type === "ordering" && "🔢 Ablauf-Reihenfolge"}
            {currentStation?.type === "comparison" && "⚖️ Situationsvergleich"}
            {currentStation?.type === "single_choice" && "💡 Wissenscheck"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-white border border-[#bbd1cd] rounded-lg p-0.5 text-xs">
            <button
              onClick={() => setViewport("desktop")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded font-medium transition-colors ${
                viewport === "desktop"
                  ? "bg-[#e3eeec] text-[#1b5c53]"
                  : "text-[#6e6c70] hover:text-[#1b5c53]"
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>Desktop</span>
            </button>
            <button
              onClick={() => setViewport("mobile")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded font-medium transition-colors ${
                viewport === "mobile"
                  ? "bg-[#e3eeec] text-[#1b5c53]"
                  : "text-[#6e6c70] hover:text-[#1b5c53]"
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Mobil</span>
            </button>
          </div>

          <button
            onClick={handleReset}
            className="p-1.5 text-[#247a6d] hover:bg-[#e3eeec] rounded border border-[#bbd1cd] bg-white"
            title="Quiz neu starten"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Embedded Live Quiz Container */}
      <div className="flex-1 flex justify-center items-start overflow-y-auto">
        <div
          className={`w-full bg-white border border-[#bbd1cd] rounded-2xl shadow-md overflow-hidden transition-all duration-300 ${
            viewport === "mobile" ? "max-w-[375px]" : "max-w-2xl"
          }`}
        >
          {/* Quiz Header */}
          <div className="bg-[#247a6d] text-white p-5">
            <div className="flex items-center justify-between text-xs text-[#bbd1cd] font-semibold uppercase tracking-wider mb-1.5">
              <span>ZQP Wissenstest</span>
              <span>
                {completed
                  ? "Abgeschlossen"
                  : `Station ${currentStationIdx + 1} von ${quiz.stations.length}`}
              </span>
            </div>
            <h2 className="text-xl font-bold leading-tight text-white">{quiz.title}</h2>

            <div className="w-full bg-[#1b5c53] h-1.5 rounded-full mt-3 overflow-hidden">
              <div
                className="bg-white h-full transition-all duration-300"
                style={{
                  width: completed
                    ? "100%"
                    : `${((currentStationIdx + 1) / quiz.stations.length) * 100}%`,
                }}
              />
            </div>
          </div>

          {/* Quiz Body */}
          <div className="p-6">
            {!completed && currentStation && (
              <div>
                <div className="mb-4">
                  <h3 className="text-base font-bold text-[#1b5c53]">
                    {currentStation.promptOrInstruction}
                  </h3>
                </div>

                {/* 1. MATCHING STATION */}
                {currentStation.type === "matching" && currentStation.matchingPairs && (
                  <div className="space-y-4">
                    <p className="text-xs text-[#6e6c70]">
                      Klicken Sie zuerst links auf eine Karte und dann rechts auf den passenden Partner:
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      {/* Left: Threats */}
                      <div className="space-y-2">
                        {currentStation.matchingPairs.map((pair) => {
                          const isMatched = matchedIds.includes(pair.id);
                          const isSelected = selectedThreat?.id === pair.id;
                          return (
                            <button
                              key={`th-${pair.id}`}
                              onClick={() => handleSelectThreat(pair)}
                              disabled={isMatched}
                              className={`puzzle-piece w-full p-2.5 text-left rounded-xl border-2 text-xs font-semibold flex items-center justify-between transition-all ${
                                isMatched
                                  ? "border-emerald-500 bg-emerald-50 text-emerald-900"
                                  : isSelected
                                  ? "border-[#247a6d] bg-[#e3eeec] ring-2 ring-[#247a6d]"
                                  : "border-[#bbd1cd] bg-white hover:border-[#247a6d]"
                              }`}
                            >
                              <span>{pair.threatOrTerm}</span>
                              <span className="font-bold text-[11px]">
                                {isMatched ? "✓" : "➔"}
                              </span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Right: Solutions */}
                      <div className="space-y-2">
                        {currentStation.matchingPairs.map((pair) => {
                          const isMatched = matchedIds.includes(pair.id);
                          const isSelected = selectedSolution?.id === pair.id;
                          return (
                            <button
                              key={`sol-${pair.id}`}
                              onClick={() => handleSelectSolution(pair)}
                              disabled={isMatched}
                              className={`puzzle-piece w-full p-2.5 text-left rounded-xl border-2 text-xs font-semibold flex items-center justify-between transition-all ${
                                isMatched
                                  ? "border-emerald-500 bg-emerald-50 text-emerald-900"
                                  : isSelected
                                  ? "border-[#247a6d] bg-[#e3eeec] ring-2 ring-[#247a6d]"
                                  : "border-[#bbd1cd] bg-white hover:border-[#247a6d]"
                              }`}
                            >
                              <span>{pair.solutionOrDef}</span>
                              <span className="font-bold text-[11px]">
                                {isMatched ? "✓" : "○"}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {matchFeedback && (
                      <div
                        className={`p-3 rounded-xl border-2 text-xs ${
                          matchFeedback.isCorrect
                            ? "border-emerald-500 bg-emerald-50 text-emerald-950"
                            : "border-rose-400 bg-rose-50 text-rose-950"
                        }`}
                      >
                        {matchFeedback.text}
                      </div>
                    )}
                  </div>
                )}

                {/* 2. ORDERING STATION */}
                {currentStation.type === "ordering" && (
                  <div className="space-y-3">
                    <p className="text-xs text-[#6e6c70]">
                      Bringen Sie die Schritte mit den Pfeilen in die richtige Reihenfolge:
                    </p>
                    <div className="space-y-2">
                      {orderedList.map((step, idx) => (
                        <div
                          key={step.id}
                          className="p-3 rounded-xl border-2 border-[#bbd1cd] bg-white flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="w-5 h-5 rounded-full bg-[#247a6d] text-white flex items-center justify-center font-bold text-[10px]">
                              {idx + 1}
                            </span>
                            <span className="font-medium text-[#444]">{step.text}</span>
                          </div>
                          <div className="flex gap-1">
                            <button
                              type="button"
                              onClick={() => handleMoveOrderItem(idx, -1)}
                              disabled={idx === 0}
                              className="p-1 rounded hover:bg-[#f3f8f7] text-[#1b5c53] border border-[#bbd1cd] disabled:opacity-30"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveOrderItem(idx, 1)}
                              disabled={idx === orderedList.length - 1}
                              className="p-1 rounded hover:bg-[#f3f8f7] text-[#1b5c53] border border-[#bbd1cd] disabled:opacity-30"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {!canAdvance && (
                      <button
                        onClick={handleCheckOrder}
                        className="mt-2 bg-[#247a6d] hover:bg-[#1b5c53] text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-sm"
                      >
                        Reihenfolge prüfen
                      </button>
                    )}

                    {orderFeedback && (
                      <div
                        className={`p-3 rounded-xl border-2 text-xs ${
                          orderFeedback.isCorrect
                            ? "border-emerald-500 bg-emerald-50 text-emerald-950"
                            : "border-amber-400 bg-amber-50 text-amber-950"
                        }`}
                      >
                        {orderFeedback.text}
                      </div>
                    )}
                  </div>
                )}

                {/* 3. COMPARISON STATION */}
                {currentStation.type === "comparison" && currentStation.comparisonScenarios && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {currentStation.comparisonScenarios.map((scen) => {
                        const isSelected = selectedScenarioId === scen.id;
                        return (
                          <div
                            key={scen.id}
                            onClick={() => setSelectedScenarioId(scen.id)}
                            className={`puzzle-piece cursor-pointer p-3.5 rounded-xl border-2 flex flex-col justify-between transition-all ${
                              isSelected
                                ? "border-[#247a6d] bg-[#f3f8f7] ring-2 ring-[#247a6d]"
                                : "border-[#bbd1cd] bg-white hover:border-[#247a6d]"
                            }`}
                          >
                            <div>
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="font-bold text-xs text-[#1b5c53]">
                                  {scen.title}
                                </span>
                                <span className="text-[11px] font-semibold text-[#6e6c70]">
                                  {scen.badge}
                                </span>
                              </div>
                              <p className="text-xs text-[#444] leading-relaxed">
                                {scen.description}
                              </p>
                            </div>
                            <div className="mt-3 pt-2 border-t border-[#e3eeec] text-xs font-semibold text-[#1b5c53] flex justify-between items-center">
                              <span>{isSelected ? "Ausgewählt" : "Wählen"}</span>
                              <span className="w-4 h-4 rounded-full border border-[#bbd1cd] flex items-center justify-center">
                                {isSelected ? "✓" : "○"}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {!canAdvance && (
                      <button
                        onClick={handleCheckComparison}
                        disabled={!selectedScenarioId}
                        className="bg-[#247a6d] hover:bg-[#1b5c53] text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-sm disabled:opacity-50"
                      >
                        Auswahl begründen & prüfen
                      </button>
                    )}

                    {comparisonFeedback && (
                      <div
                        className={`p-3 rounded-xl border-2 text-xs ${
                          comparisonFeedback.isCorrect
                            ? "border-emerald-500 bg-emerald-50 text-emerald-950"
                            : "border-rose-400 bg-rose-50 text-rose-950"
                        }`}
                      >
                        {comparisonFeedback.text}
                      </div>
                    )}
                  </div>
                )}

                {/* 4. SINGLE CHOICE STATION */}
                {currentStation.type === "single_choice" && currentStation.options && (
                  <div className="space-y-3">
                    <div className="space-y-2">
                      {currentStation.options.map((opt, idx) => {
                        const isSelected = selectedOptionIdx === idx;
                        return (
                          <label
                            key={idx}
                            className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                              isSelected
                                ? "border-[#247a6d] bg-[#f3f8f7]"
                                : "border-[#e3eeec] bg-white hover:border-[#247a6d]"
                            }`}
                          >
                            <input
                              type="radio"
                              name="sc-option"
                              checked={isSelected}
                              onChange={() => setSelectedOptionIdx(idx)}
                              className="mt-1 text-[#247a6d] focus:ring-[#247a6d]"
                            />
                            <span className="text-xs font-medium text-[#444]">{opt.text}</span>
                          </label>
                        );
                      })}
                    </div>

                    {!canAdvance && (
                      <button
                        onClick={handleCheckChoice}
                        disabled={selectedOptionIdx === null}
                        className="bg-[#247a6d] hover:bg-[#1b5c53] text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-sm disabled:opacity-50"
                      >
                        Antwort prüfen
                      </button>
                    )}

                    {choiceFeedback && (
                      <div
                        className={`p-3 rounded-xl border-2 text-xs ${
                          choiceFeedback.isCorrect
                            ? "border-emerald-500 bg-emerald-50 text-emerald-950"
                            : "border-rose-400 bg-rose-50 text-rose-950"
                        }`}
                      >
                        {choiceFeedback.text}
                      </div>
                    )}
                  </div>
                )}

                {/* Bottom Navigation */}
                <div className="mt-6 pt-4 border-t border-[#e3eeec] flex items-center justify-between">
                  <span className="text-xs text-[#6e6c70]">
                    {canAdvance
                      ? "✓ Station gelöst! Bereit für den nächsten Schritt."
                      : "Lösen Sie die Aufgabe, um fortzufahren."}
                  </span>

                  {canAdvance && (
                    <button
                      onClick={handleNextStation}
                      className="bg-[#247a6d] hover:bg-[#1b5c53] text-white font-semibold text-xs px-5 py-2.5 rounded-lg shadow-sm flex items-center gap-1.5"
                    >
                      <span>
                        {currentStationIdx === quiz.stations.length - 1
                          ? "Zur Auswertung"
                          : "Nächste Station"}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Final Completed View */}
            {completed && (
              <div className="p-6 text-center flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-[#e3eeec] border-2 border-[#247a6d] flex items-center justify-center mb-3">
                  <Award className="w-8 h-8 text-[#247a6d]" />
                </div>
                <h3 className="text-xl font-bold text-[#1b5c53] mb-1">
                  Glückwunsch! Alle Stationen gemeistert
                </h3>
                <p className="text-xs text-[#444] mb-4">
                  Sie haben alle {quiz.stations.length} Stationen des Themas erfolgreich absolviert.
                </p>

                <div className="bg-[#f3f8f7] border border-[#bbd1cd] p-4 rounded-xl text-left text-xs text-[#444] mb-5 w-full space-y-1.5">
                  <strong className="text-[#1b5c53] block font-bold">ZQP-Praxistipp für den Alltag:</strong>
                  <p>{quiz.summary || "Regelmäßiges Auffrischen von Pflegewissen und Sensibilität für Gefahrenquellen schützen nachhaltig im häuslichen Umfeld."}</p>
                </div>

                <button
                  onClick={handleReset}
                  className="bg-[#247a6d] hover:bg-[#1b5c53] text-white text-xs font-semibold px-5 py-2.5 rounded-lg"
                >
                  Lernspiel wiederholen
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
