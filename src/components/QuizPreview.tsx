import React, { useState, useEffect } from "react";
import { RotateCcw, Monitor, Smartphone, ArrowRight, ArrowUp, ArrowDown, Award, Lightbulb, CheckCircle2, AlertTriangle, HelpCircle, Puzzle, Check } from "lucide-react";
import { QuizGenerationResult, QuizStation, MatchingPair } from "../types";

interface QuizPreviewProps {
  quiz: QuizGenerationResult;
  onReset: () => void;
}

export const QuizPreview: React.FC<QuizPreviewProps> = ({ quiz, onReset }) => {
  const [viewport, setViewport] = useState<"desktop" | "mobile">("desktop");
  const [currentStationIdx, setCurrentStationIdx] = useState<number>(0);
  const [completed, setCompleted] = useState<boolean>(false);

  const currentStation: QuizStation | undefined = quiz.stations[currentStationIdx];

  // Matching state
  const [selectedThreat, setSelectedThreat] = useState<{ id: string; btnId: string } | null>(null);
  const [selectedSolution, setSelectedSolution] = useState<{ id: string; btnId: string } | null>(null);
  const [matchedIds, setMatchedIds] = useState<string[]>([]);
  // Shuffled solutions so they are NEVER in the same order as threats!
  const [shuffledSolutions, setShuffledSolutions] = useState<MatchingPair[]>([]);

  // Ordering state
  const [orderedList, setOrderedList] = useState<{ id: string; text: string; correctIndex: number; reason?: string }[]>([]);

  // Comparison state
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(null);

  // Single choice state
  const [selectedOptionIdx, setSelectedOptionIdx] = useState<number | null>(null);

  // Unified feedback state
  interface FeedbackState {
    type: "correct" | "incorrect" | "revealed";
    title: string;
    selectionExplanation: string;
    zqpBackground: string;
  }
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [canAdvance, setCanAdvance] = useState<boolean>(false);

  // Reset station state on change
  useEffect(() => {
    setSelectedThreat(null);
    setSelectedSolution(null);
    setMatchedIds([]);
    setSelectedScenarioId(null);
    setSelectedOptionIdx(null);
    setFeedback(null);
    setCanAdvance(false);

    // Shuffle solutions for matching station
    if (currentStation?.type === "matching" && currentStation.matchingPairs) {
      const original = [...currentStation.matchingPairs];
      const shuffled = [...original];
      
      // Fisher-Yates shuffle
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }

      // Ensure it is NOT identical to the original order (if length > 1)
      if (shuffled.length > 1 && shuffled.every((p, idx) => p.id === original[idx].id)) {
        [shuffled[0], shuffled[1]] = [shuffled[1], shuffled[0]];
      }

      setShuffledSolutions(shuffled);
    }

    // Shuffle steps for ordering station
    if (currentStation?.type === "ordering" && currentStation.orderingSteps) {
      const shuffled = [...currentStation.orderingSteps].sort(() => Math.random() - 0.5);
      setOrderedList(shuffled);
    }
  }, [currentStationIdx, currentStation]);

  const handleReset = () => {
    setCurrentStationIdx(0);
    setCompleted(false);
    onReset();
  };

  // --- REVEAL SOLUTION ---
  const handleRevealSolution = () => {
    if (!currentStation) return;

    if (currentStation.type === "matching" && currentStation.matchingPairs) {
      setMatchedIds(currentStation.matchingPairs.map((p) => p.id));
      setSelectedThreat(null);
      setSelectedSolution(null);
    } else if (currentStation.type === "ordering" && currentStation.orderingSteps) {
      const sorted = [...currentStation.orderingSteps].sort((a, b) => a.correctIndex - b.correctIndex);
      setOrderedList(sorted);
    } else if (currentStation.type === "comparison" && currentStation.comparisonScenarios) {
      const correctScenario = currentStation.comparisonScenarios.find((s) => s.isCorrect);
      if (correctScenario) setSelectedScenarioId(correctScenario.id);
    } else if (currentStation.type === "single_choice" && currentStation.options) {
      const correctIdx = currentStation.options.findIndex((o) => o.isCorrect);
      if (correctIdx !== -1) setSelectedOptionIdx(correctIdx);
    }

    setFeedback({
      type: "revealed",
      title: "Lösung aufgedeckt & Puzzleteile verzahnt",
      selectionExplanation: currentStation.solutionExplanation || "Hier sehen Sie die vollständige, empfohlene Lösung für diese Station.",
      zqpBackground: currentStation.zqpRationale || "Fachlich fundiert nach den Empfehlungen der Stiftung ZQP.",
    });
    setCanAdvance(true);
  };

  // --- MATCHING LOGIC ---
  const handleSelectThreat = (pair: MatchingPair) => {
    if (matchedIds.includes(pair.id) || canAdvance) return;
    setSelectedThreat({ id: pair.id, btnId: `threat-${pair.id}` });
    if (selectedSolution) checkMatch(pair.id, selectedSolution.id);
  };

  const handleSelectSolution = (pair: MatchingPair) => {
    if (matchedIds.includes(pair.id) || canAdvance) return;
    setSelectedSolution({ id: pair.id, btnId: `sol-${pair.id}` });
    if (selectedThreat) checkMatch(selectedThreat.id, pair.id);
  };

  const checkMatch = (threatId: string, solutionId: string) => {
    const pair = currentStation?.matchingPairs?.find((p) => p.id === threatId);
    if (threatId === solutionId && pair) {
      const nextMatched = [...matchedIds, threatId];
      setMatchedIds(nextMatched);

      setSelectedThreat(null);
      setSelectedSolution(null);

      const allSolved = nextMatched.length === (currentStation?.matchingPairs?.length || 0);
      setFeedback({
        type: "correct",
        title: allSolved ? "Großartig! Alle Puzzleteile perfekt verzahnt" : "Puzzleteil erfolgreich eingerastet! ✓",
        selectionExplanation: pair.explanation || "Diese beiden Puzzleteile greifen inhaltlich exakt ineinander.",
        zqpBackground: allSolved
          ? (currentStation?.zqpRationale || "Alle Schutzmaßnahmen neutralisieren die jeweiligen Gefahrenquellen nachhaltig.")
          : `Noch ${(currentStation?.matchingPairs?.length || 0) - nextMatched.length} Puzzleteil(e) offen.`,
      });

      if (allSolved) setCanAdvance(true);
    } else {
      setFeedback({
        type: "incorrect",
        title: "Puzzleteile passen nicht zusammen",
        selectionExplanation: "Diese beiden Teile lassen sich nicht verzahnen: Die Maßnahme ist für eine andere Gefahrenquelle vorgesehen.",
        zqpBackground: "Achten Sie auf die genaue Ursache der Gefahr (z. B. Feuchtigkeit am Boden vs. schlechte Sicht bei Nacht).",
      });
      setTimeout(() => {
        setSelectedThreat(null);
        setSelectedSolution(null);
      }, 900);
    }
  };

  // --- ORDERING LOGIC ---
  const handleMoveOrderItem = (idx: number, direction: -1 | 1) => {
    if (canAdvance) return;
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
      setFeedback({
        type: "correct",
        title: "Puzzlekette vollständig geschlossen! Richtiger Ablauf",
        selectionExplanation: currentStation?.solutionExplanation || "Alle Schritte greifen biomechanisch optimal ineinander.",
        zqpBackground: currentStation?.zqpRationale || "Vorrutschen und Standflächensicherung sind unverzichtbar vor der Streckbewegung.",
      });
      setCanAdvance(true);
    } else {
      setFeedback({
        type: "incorrect",
        title: "Die Kette ist noch unterbrochen",
        selectionExplanation: "Ein Schritt wurde zu früh oder zu spät angesetzt. Überlegen Sie, welcher vorbereitende Schritt zuerst Stabilität verleiht.",
        zqpBackground: "Erst Standfläche sichern, dann Schwerpunkt verlagern, dann aufrichten.",
      });
    }
  };

  // --- COMPARISON LOGIC ---
  const handleCheckComparison = () => {
    if (!selectedScenarioId || !currentStation?.comparisonScenarios) return;
    const scenario = currentStation.comparisonScenarios.find((s) => s.id === selectedScenarioId);
    if (!scenario) return;

    if (scenario.isCorrect) {
      setFeedback({
        type: "correct",
        title: "Hervorragend gewählt! Sturzsicheres Wohnen",
        selectionExplanation: scenario.explanation,
        zqpBackground: currentStation.zqpRationale || "Fixierte Kabel und freie Laufwege reduzieren das Sturzrisiko nachhaltig.",
      });
      setCanAdvance(true);
    } else {
      setFeedback({
        type: "incorrect",
        title: "Vorsicht: Dieses Szenario birgt erhebliche Sturzrisiken",
        selectionExplanation: scenario.explanation,
        zqpBackground: currentStation.solutionExplanation || "Lose Teppichläufer und im Raum liegende Kabel sind häufige Sturzursachen.",
      });
    }
  };

  // --- SINGLE CHOICE LOGIC ---
  const handleCheckChoice = () => {
    if (selectedOptionIdx === null || !currentStation?.options) return;
    const opt = currentStation.options[selectedOptionIdx];

    if (opt.isCorrect) {
      setFeedback({
        type: "correct",
        title: "Richtig entschieden!",
        selectionExplanation: opt.explanation,
        zqpBackground: currentStation.zqpRationale || "Eine fundierte Maßnahme nach aktuellem pflegewissenschaftlichem Stand.",
      });
      setCanAdvance(true);
    } else {
      setFeedback({
        type: "incorrect",
        title: "Nicht die empfohlene Maßnahme",
        selectionExplanation: opt.explanation,
        zqpBackground: currentStation.solutionExplanation || "Überlegen Sie, welche Option den sichersten Schutz bietet.",
      });
    }
  };

  const handleNextStation = () => {
    if (currentStationIdx < quiz.stations.length - 1) {
      setCurrentStationIdx((prev) => prev + 1);
    } else {
      setCompleted(true);
    }
  };

  // Color map for matching pairs to clearly show which left item links to which right item
  const pairColorThemes = [
    { border: "border-teal-500", bg: "bg-teal-50", badge: "bg-[#247a6d] text-white", label: "Paar #1" },
    { border: "border-emerald-500", bg: "bg-emerald-50", badge: "bg-emerald-600 text-white", label: "Paar #2" },
    { border: "border-cyan-600", bg: "bg-cyan-50", badge: "bg-cyan-700 text-white", label: "Paar #3" },
    { border: "border-indigo-500", bg: "bg-indigo-50", badge: "bg-indigo-700 text-white", label: "Paar #4" },
    { border: "border-amber-500", bg: "bg-amber-50", badge: "bg-amber-700 text-white", label: "Paar #5" },
  ];

  const getPairTheme = (pairId: string) => {
    const idx = currentStation?.matchingPairs?.findIndex((p) => p.id === pairId) ?? 0;
    return pairColorThemes[idx % pairColorThemes.length];
  };

  return (
    <div className="flex flex-col h-full">
      {/* Top Viewport & Reset Bar */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#bbd1cd] shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-[#1b5c53]">
            {completed
              ? "Auswertung & Zertifikat"
              : `Station ${currentStationIdx + 1} von ${quiz.stations.length}`}
          </span>
          <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-[#e3eeec] text-[#1b5c53] font-semibold border border-[#bbd1cd] flex items-center gap-1">
            <Puzzle className="w-3 h-3 text-[#247a6d]" />
            {currentStation?.type === "matching" && "Zuordnungs-Puzzle"}
            {currentStation?.type === "ordering" && "Ablauf-Puzzlekette"}
            {currentStation?.type === "comparison" && "Situationsvergleich"}
            {currentStation?.type === "single_choice" && "Wissenscheck"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-white border border-[#bbd1cd] rounded-lg p-0.5 text-xs shadow-sm">
            <button
              onClick={() => setViewport("desktop")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded font-medium transition-all ${
                viewport === "desktop"
                  ? "bg-[#e3eeec] text-[#1b5c53] shadow-xs"
                  : "text-[#6e6c70] hover:text-[#1b5c53]"
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>Desktop</span>
            </button>
            <button
              onClick={() => setViewport("mobile")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded font-medium transition-all ${
                viewport === "mobile"
                  ? "bg-[#e3eeec] text-[#1b5c53] shadow-xs"
                  : "text-[#6e6c70] hover:text-[#1b5c53]"
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Mobil</span>
            </button>
          </div>

          <button
            onClick={handleReset}
            className="p-1.5 text-[#247a6d] hover:bg-[#e3eeec] rounded border border-[#bbd1cd] bg-white transition-colors"
            title="Quiz neu starten"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Responsive Quiz Viewport with STABLE HEIGHT & ZERO SCROLLBARS */}
      <div className="flex-1 flex justify-center items-center overflow-hidden py-1 px-1">
        <div
          className={`w-full bg-white border border-[#bbd1cd] rounded-2xl shadow-md overflow-hidden transition-all duration-300 relative flex flex-col ${
            viewport === "mobile"
              ? "max-w-[380px] h-[570px] max-h-[85vh]"
              : "max-w-2xl h-[570px] max-h-[85vh]"
          }`}
        >
          {/* 1. FIXED HEADER (shrink-0) */}
          <header className="bg-gradient-to-r from-[#247a6d] to-[#1b5c53] text-white px-4 py-3 sm:px-5 sm:py-3.5 shadow-sm shrink-0">
            <div className="flex items-center justify-between text-[11px] text-[#bbd1cd] font-semibold uppercase tracking-wider mb-1">
              <span className="flex items-center gap-1.5">
                <Puzzle className="w-3.5 h-3.5 text-emerald-400" />
                ZQP Interaktiver Praxistest
              </span>
              <span>
                {completed
                  ? "Abgeschlossen"
                  : `Station ${currentStationIdx + 1} von ${quiz.stations.length}`}
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-bold leading-tight text-white line-clamp-1">
              {quiz.title}
            </h2>

            {/* Stepper Progress Bar */}
            <div className="w-full bg-[#00473d] h-1.5 rounded-full mt-2.5 overflow-hidden shadow-inner">
              <div
                className="bg-emerald-400 h-full transition-all duration-500 rounded-full"
                style={{
                  width: completed
                    ? "100%"
                    : `${((currentStationIdx + 1) / quiz.stations.length) * 100}%`,
                }}
              />
            </div>
          </header>

          {/* 2. COMPACT STAGE (flex-1 overflow-hidden p-4 sm:p-5 flex flex-col justify-start) */}
          <div className="flex-1 min-h-0 overflow-hidden p-4 sm:p-5 flex flex-col justify-start">
            {!completed && currentStation && (
              <div className="flex flex-col gap-3 h-full">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-[#1b5c53] leading-snug">
                    {currentStation.promptOrInstruction}
                  </h3>
                </div>

                {/* ==============================================================
                    1. AUTHENTIC MATCHING PUZZLE (COMPACT 2-COLUMNS, IN-PLACE DOCKING)
                    ============================================================== */}
                {currentStation.type === "matching" && currentStation.matchingPairs && (
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between text-xs text-[#6e6c70] bg-[#f3f8f7] px-2.5 py-1.5 rounded-lg border border-[#bbd1cd]">
                      <span className="text-[11px] sm:text-xs">
                        Wählen Sie links die Gefahr und rechts die passende Schutzmaßnahme:
                      </span>
                      <span className="font-bold text-[#1b5c53] shrink-0 ml-2 text-xs">
                        {matchedIds.length} von {currentStation.matchingPairs.length} verzahnt
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {/* Left: Threats */}
                      <div className="space-y-2">
                        <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block px-1">
                          ⚠️ Gefahrenquelle
                        </span>
                        {currentStation.matchingPairs.map((pair, idx) => {
                          const isMatched = matchedIds.includes(pair.id);
                          const isSelected = selectedThreat?.id === pair.id;
                          const theme = getPairTheme(pair.id);

                          return (
                            <div
                              key={`th-${pair.id}`}
                              onClick={() => handleSelectThreat(pair)}
                              className={`rounded-xl border-2 p-2 sm:p-2.5 text-left transition-all cursor-pointer ${
                                isMatched
                                  ? `${theme.border} ${theme.bg} shadow-xs`
                                  : isSelected
                                  ? "border-[#247a6d] bg-[#e3eeec] ring-2 ring-[#247a6d] shadow-sm"
                                  : "border-[#bbd1cd] bg-white hover:border-[#247a6d] hover:bg-[#f3f8f7]"
                              }`}
                            >
                              <div className="flex items-center justify-between mb-0.5">
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
                                  Teil A-{idx + 1}
                                </span>
                                {isMatched ? (
                                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${theme.badge} flex items-center gap-0.5 shadow-xs`}>
                                    <Check className="w-2.5 h-2.5" />
                                    <span>{theme.label}</span>
                                  </span>
                                ) : isSelected ? (
                                  <span className="text-[9px] font-bold text-[#247a6d]">Wählen ➔</span>
                                ) : null}
                              </div>
                              <p className="text-[11px] sm:text-xs font-semibold text-[#444] leading-tight">
                                {pair.threatOrTerm}
                              </p>
                            </div>
                          );
                        })}
                      </div>

                      {/* Right: Shuffled Solutions */}
                      <div className="space-y-2">
                        <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block px-1">
                          🛡️ Schutzmaßnahme
                        </span>
                        {shuffledSolutions.map((pair, idx) => {
                          const isMatched = matchedIds.includes(pair.id);
                          const isSelected = selectedSolution?.id === pair.id;
                          const theme = getPairTheme(pair.id);

                          return (
                            <div
                              key={`sol-${pair.id}`}
                              onClick={() => handleSelectSolution(pair)}
                              className={`rounded-xl border-2 p-2 sm:p-2.5 text-left transition-all cursor-pointer ${
                                isMatched
                                  ? `${theme.border} ${theme.bg} shadow-xs`
                                  : isSelected
                                  ? "border-[#247a6d] bg-[#e3eeec] ring-2 ring-[#247a6d] shadow-sm"
                                  : "border-[#bbd1cd] bg-white hover:border-[#247a6d] hover:bg-[#f3f8f7]"
                              }`}
                            >
                              <div className="flex items-center justify-between mb-0.5">
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-300">
                                  Teil B-{idx + 1}
                                </span>
                                {isMatched ? (
                                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${theme.badge} flex items-center gap-0.5 shadow-xs`}>
                                    <Check className="w-2.5 h-2.5" />
                                    <span>{theme.label}</span>
                                  </span>
                                ) : isSelected ? (
                                  <span className="text-[9px] font-bold text-[#247a6d]">Wählen ➔</span>
                                ) : null}
                              </div>
                              <p className="text-[11px] sm:text-xs font-semibold text-[#444] leading-tight">
                                {pair.solutionOrDef}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* ==============================================================
                    2. ORDERING STATION (VERTICAL JIGSAW PUZZLE CHAIN)
                    ============================================================== */}
                {currentStation.type === "ordering" && (
                  <div className="space-y-2.5">
                    <p className="text-xs text-[#6e6c70]">
                      Ordnen Sie die Schritte mit den Pfeiltasten in die richtige biomechanische Reihenfolge:
                    </p>
                    <div className="space-y-2">
                      {orderedList.map((step, idx) => {
                        const isFirst = idx === 0;
                        const isLast = idx === orderedList.length - 1;
                        return (
                          <div
                            key={step.id}
                            className={`p-2.5 sm:p-3 rounded-xl border-2 border-[#bbd1cd] bg-white flex items-center justify-between text-xs shadow-xs relative transition-all ${
                              canAdvance ? "border-emerald-500 bg-emerald-50/50" : "hover:border-[#247a6d]"
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className="w-6 h-6 rounded-md bg-[#247a6d] text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
                                #{idx + 1}
                              </span>
                              <span className="font-semibold text-[#444] text-xs leading-snug truncate">
                                {step.text}
                              </span>
                            </div>

                            <div className="flex gap-1 shrink-0 ml-2">
                              <button
                                type="button"
                                onClick={() => handleMoveOrderItem(idx, -1)}
                                disabled={isFirst || canAdvance}
                                className="p-1 rounded hover:bg-[#f3f8f7] text-[#1b5c53] border border-[#bbd1cd] disabled:opacity-30"
                                title="Nach oben schieben"
                              >
                                <ArrowUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleMoveOrderItem(idx, 1)}
                                disabled={isLast || canAdvance}
                                className="p-1 rounded hover:bg-[#f3f8f7] text-[#1b5c53] border border-[#bbd1cd] disabled:opacity-30"
                                title="Nach unten schieben"
                              >
                                <ArrowDown className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ==============================================================
                    3. COMPARISON STATION (A/B SCENARIOS)
                    ============================================================== */}
                {currentStation.type === "comparison" && currentStation.comparisonScenarios && (
                  <div className="space-y-2.5">
                    <p className="text-xs text-[#6e6c70]">
                      Klicken Sie auf das Szenario, das die ZQP-Präventionskriterien erfüllt:
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {currentStation.comparisonScenarios.map((scen) => {
                        const isSelected = selectedScenarioId === scen.id;
                        return (
                          <div
                            key={scen.id}
                            onClick={() => !canAdvance && setSelectedScenarioId(scen.id)}
                            className={`puzzle-piece cursor-pointer p-3 rounded-xl border-2 flex flex-col justify-between transition-all ${
                              isSelected
                                ? "border-[#247a6d] bg-[#f3f8f7] ring-2 ring-[#247a6d] shadow-sm"
                                : "border-[#bbd1cd] bg-white hover:border-[#247a6d]"
                            }`}
                          >
                            <div>
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="font-bold text-xs text-[#1b5c53]">
                                  {scen.title}
                                </span>
                                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-white border border-[#bbd1cd] text-[#6e6c70]">
                                  {scen.badge}
                                </span>
                              </div>
                              <p className="text-[11px] text-[#444] leading-snug line-clamp-3">
                                {scen.description}
                              </p>
                            </div>
                            <div className="mt-2 pt-1.5 border-t border-[#e3eeec] text-[11px] font-semibold text-[#1b5c53] flex justify-between items-center">
                              <span>{isSelected ? "Ausgewählt" : "Szenario wählen"}</span>
                              <span className="w-4 h-4 rounded-full border-2 border-[#247a6d] flex items-center justify-center font-bold text-[10px]">
                                {isSelected ? "✓" : ""}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ==============================================================
                    4. SINGLE CHOICE STATION
                    ============================================================== */}
                {currentStation.type === "single_choice" && currentStation.options && (
                  <div className="space-y-2.5">
                    <div className="space-y-2">
                      {currentStation.options.map((opt, idx) => {
                        const isSelected = selectedOptionIdx === idx;
                        return (
                          <label
                            key={idx}
                            className={`flex items-start gap-2.5 p-2.5 sm:p-3 rounded-xl border-2 cursor-pointer transition-all ${
                              isSelected
                                ? "border-[#247a6d] bg-[#f3f8f7] ring-1 ring-[#247a6d]"
                                : "border-[#e3eeec] bg-white hover:border-[#247a6d]"
                            }`}
                          >
                            <input
                              type="radio"
                              name="sc-option"
                              disabled={canAdvance}
                              checked={isSelected}
                              onChange={() => setSelectedOptionIdx(idx)}
                              className="mt-0.5 text-[#247a6d] focus:ring-[#247a6d]"
                            />
                            <span className="text-xs font-medium text-[#444] leading-snug">
                              {opt.text}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Completed Score & Certificate View */}
            {completed && (
              <div className="h-full flex flex-col items-center justify-center text-center p-2">
                <div className="w-12 h-12 rounded-full bg-[#e3eeec] border-2 border-[#247a6d] flex items-center justify-center mb-2 shadow-xs">
                  <Award className="w-6 h-6 text-[#247a6d]" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-[#1b5c53] mb-1">
                  Glückwunsch! Alle Stationen gemeistert
                </h3>
                <p className="text-xs text-[#444] mb-3">
                  Sie haben alle {quiz.stations.length} interaktiven Lernstationen erfolgreich absolviert.
                </p>

                <div className="bg-[#f3f8f7] border border-[#bbd1cd] p-3 rounded-xl text-left text-xs text-[#444] w-full space-y-1.5 shadow-xs">
                  <strong className="text-[#1b5c53] block font-bold text-xs">
                    ZQP-Praxisfazit für den Alltag:
                  </strong>
                  <p className="leading-relaxed text-[11px] sm:text-xs">
                    {quiz.summary || "Regelmäßiges Auffrischen von Pflegewissen und Sensibilität für Gefahrenquellen schützen nachhaltig im häuslichen Umfeld."}
                  </p>
                  <div className="pt-1.5 border-t border-[#bbd1cd]/50 text-[10px] sm:text-[11px] text-[#6e6c70]">
                    Tipp: Nutzen Sie die ZQP-Ratgeber und Sicherheits-Checklisten auf <strong>zqp.de</strong> für die barrierearme Wohnraumanpassung.
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 3. PINNED BOTTOM ACTION BAR (shrink-0) */}
          <div className="shrink-0 border-t border-[#bbd1cd] bg-white px-4 py-2 sm:px-5 sm:py-2.5 flex items-center justify-between gap-2 shadow-xs">
            {!completed ? (
              <>
                {/* Left: Solution reveal or Status */}
                <div>
                  {!canAdvance ? (
                    <button
                      type="button"
                      onClick={handleRevealSolution}
                      className="text-xs text-[#1b5c53] hover:text-[#247a6d] font-semibold flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#bbd1cd] bg-[#f3f8f7] hover:bg-[#e3eeec] transition-colors focus-visible:ring-2 focus-visible:ring-[#247a6d]"
                      title="Antwort und didaktische Erklärung aufdecken"
                    >
                      <HelpCircle className="w-3.5 h-3.5 text-[#247a6d] shrink-0" />
                      <span className="hidden sm:inline">Ich weiß es nicht / </span>
                      <span>Lösung anzeigen</span>
                    </button>
                  ) : (
                    <span className="text-xs text-emerald-800 font-semibold flex items-center gap-1.5 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Station gelöst</span>
                    </span>
                  )}
                </div>

                {/* Right: Check action OR Next station */}
                <div>
                  {!canAdvance ? (
                    <>
                      {currentStation?.type === "matching" && (
                        <span className="text-xs font-semibold text-[#1b5c53] bg-[#f3f8f7] px-3 py-1.5 rounded-lg border border-[#bbd1cd]">
                          {matchedIds.length} von {currentStation.matchingPairs?.length || 0} verzahnt
                        </span>
                      )}

                      {currentStation?.type === "ordering" && (
                        <button
                          type="button"
                          onClick={handleCheckOrder}
                          className="bg-[#247a6d] hover:bg-[#1b5c53] text-white text-xs font-semibold px-4 py-1.5 rounded-lg shadow-sm transition-colors focus-visible:ring-2 focus-visible:ring-[#247a6d]"
                        >
                          Reihenfolge prüfen
                        </button>
                      )}

                      {currentStation?.type === "comparison" && (
                        <button
                          type="button"
                          onClick={handleCheckComparison}
                          disabled={!selectedScenarioId}
                          className="bg-[#247a6d] hover:bg-[#1b5c53] text-white text-xs font-semibold px-4 py-1.5 rounded-lg shadow-sm disabled:opacity-40 transition-colors focus-visible:ring-2 focus-visible:ring-[#247a6d]"
                        >
                          Szenario prüfen
                        </button>
                      )}

                      {currentStation?.type === "single_choice" && (
                        <button
                          type="button"
                          onClick={handleCheckChoice}
                          disabled={selectedOptionIdx === null}
                          className="bg-[#247a6d] hover:bg-[#1b5c53] text-white text-xs font-semibold px-4 py-1.5 rounded-lg shadow-sm disabled:opacity-40 transition-colors focus-visible:ring-2 focus-visible:ring-[#247a6d]"
                        >
                          Antwort prüfen
                        </button>
                      )}
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={handleNextStation}
                      className="bg-[#247a6d] hover:bg-[#1b5c53] text-white font-semibold text-xs px-4 py-1.5 rounded-lg shadow-sm flex items-center gap-1.5 transition-all focus-visible:ring-2 focus-visible:ring-[#247a6d]"
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
              </>
            ) : (
              <div className="w-full flex items-center justify-between">
                <span className="text-xs text-[#6e6c70] flex items-center gap-1">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  Lerneinheit abgeschlossen
                </span>
                <button
                  type="button"
                  onClick={handleReset}
                  className="bg-[#247a6d] hover:bg-[#1b5c53] text-white text-xs font-semibold px-4 py-1.5 rounded-lg shadow-sm transition-colors flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-[#247a6d]"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Lernreise erneut starten</span>
                </button>
              </div>
            )}
          </div>

          {/* 4. ZQP COPYRIGHT & KALENDERJAHR FOOTER (shrink-0) */}
          <footer className="shrink-0 bg-[#f3f8f7] border-t border-[#bbd1cd]/60 px-4 py-1.5 text-center text-[10px] sm:text-[11px] text-[#6e6c70] font-medium tracking-wide">
            Stiftung Zentrum für Qualität in der Pflege • {new Date().getFullYear()}
          </footer>

          {/* 5. SLIDE-UP FEEDBACK DRAWER (DUOLINGO-STYLE: NO SCROLLBARS, ZERO LAYOUT SHIFT) */}
          <div
            className={`absolute bottom-0 inset-x-0 bg-white border-t-2 shadow-2xl transition-all duration-300 ease-out z-20 flex flex-col ${
              feedback
                ? "translate-y-0 opacity-100"
                : "translate-y-full opacity-0 pointer-events-none"
            } ${
              feedback?.type === "correct"
                ? "border-emerald-500 bg-emerald-50/98 text-emerald-950"
                : feedback?.type === "revealed"
                ? "border-amber-500 bg-amber-50/98 text-amber-950"
                : "border-[#722b28] bg-rose-50/98 text-rose-950"
            }`}
            style={{ maxHeight: "78%" }}
          >
            {/* Drawer Top Status Bar */}
            <div className="px-4 py-2 flex items-center justify-between border-b border-black/5 shrink-0">
              <div className="flex items-center gap-2 font-bold text-xs sm:text-sm">
                {feedback?.type === "correct" && (
                  <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 shrink-0" />
                )}
                {feedback?.type === "revealed" && (
                  <Lightbulb className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600 shrink-0" />
                )}
                {feedback?.type === "incorrect" && (
                  <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-[#722b28] shrink-0" />
                )}
                <span>{feedback?.title}</span>
              </div>

              {feedback?.type === "incorrect" && (
                <button
                  type="button"
                  onClick={() => setFeedback(null)}
                  className="px-2 py-0.5 rounded text-[#722b28] hover:bg-rose-100 text-xs font-semibold"
                  title="Schließen & erneut versuchen"
                >
                  ✕ Schließen
                </button>
              )}
            </div>

            {/* Drawer Body (Explanation & Didactics) */}
            <div className="p-3 space-y-2 text-xs overflow-hidden">
              <div className="bg-white/90 p-2.5 rounded-lg border border-black/5 shadow-2xs">
                <strong className="block text-[#1b5c53] font-bold text-[11px] mb-0.5">
                  {feedback?.type === "correct" ? "Warum diese Auswahl richtig ist:" : "Didaktische Erklärung:"}
                </strong>
                <p className="leading-snug text-[#444] text-[11px] sm:text-xs">
                  {feedback?.selectionExplanation}
                </p>
              </div>

              <div className="p-2 rounded-lg bg-[#247a6d]/10 border border-[#247a6d]/20 text-[#1b5c53]">
                <strong className="block font-bold text-[10px] sm:text-[11px] mb-0.5">
                  ZQP-Hintergrundwissen für die Praxis:
                </strong>
                <p className="leading-snug text-[10px] sm:text-[11px]">
                  {feedback?.zqpBackground}
                </p>
              </div>
            </div>

            {/* Drawer Bottom Actions */}
            <div className="px-4 py-2 bg-white border-t border-[#bbd1cd] flex items-center justify-between gap-2 shrink-0">
              {feedback?.type === "incorrect" ? (
                <>
                  <button
                    type="button"
                    onClick={handleRevealSolution}
                    className="text-xs text-[#1b5c53] hover:text-[#247a6d] font-semibold flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#bbd1cd] bg-[#f3f8f7] hover:bg-[#e3eeec] transition-colors"
                  >
                    <HelpCircle className="w-3.5 h-3.5 text-[#247a6d]" />
                    <span>Lösung anzeigen</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFeedback(null)}
                    className="bg-[#247a6d] hover:bg-[#1b5c53] text-white text-xs font-semibold px-4 py-1.5 rounded-lg shadow-sm transition-colors"
                  >
                    Erneut versuchen ↺
                  </button>
                </>
              ) : (
                <div className="w-full flex justify-end">
                  <button
                    type="button"
                    onClick={handleNextStation}
                    className="w-full sm:w-auto bg-[#247a6d] hover:bg-[#1b5c53] text-white font-semibold text-xs px-5 py-2 rounded-lg shadow-sm flex items-center justify-center gap-1.5 transition-all focus-visible:ring-2 focus-visible:ring-[#247a6d]"
                  >
                    <span>
                      {currentStationIdx === quiz.stations.length - 1
                        ? "Zur Auswertung"
                        : "Nächste Station"}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* ZQP Copyright strip inside drawer */}
            <div className="bg-[#f3f8f7] border-t border-[#bbd1cd]/50 px-4 py-1 text-center text-[10px] text-[#6e6c70]">
              Stiftung Zentrum für Qualität in der Pflege • {new Date().getFullYear()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
