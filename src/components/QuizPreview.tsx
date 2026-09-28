import React, { useState, useEffect } from "react";
import { RotateCcw, Monitor, Smartphone, ArrowRight, ArrowUp, ArrowDown, Award, Lightbulb, CheckCircle2, AlertTriangle, HelpCircle, Puzzle, Link as LinkIcon } from "lucide-react";
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
  // Store connected pairs with their details for persistent visual interlocking
  const [connectedPairs, setConnectedPairs] = useState<{
    id: string;
    threat: string;
    solution: string;
    explanation?: string;
  }[]>([]);

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
    setConnectedPairs([]);
    setSelectedScenarioId(null);
    setSelectedOptionIdx(null);
    setFeedback(null);
    setCanAdvance(false);

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
      setConnectedPairs(
        currentStation.matchingPairs.map((p) => ({
          id: p.id,
          threat: p.threatOrTerm,
          solution: p.solutionOrDef,
          explanation: p.explanation,
        }))
      );
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

  // --- MATCHING LOGIC WITH VISIBLE INTERLOCKING ---
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

      // Add to visually connected pairs list
      setConnectedPairs((prev) => [
        ...prev,
        {
          id: pair.id,
          threat: pair.threatOrTerm,
          solution: pair.solutionOrDef,
          explanation: pair.explanation,
        },
      ]);

      setSelectedThreat(null);
      setSelectedSolution(null);

      const allSolved = nextMatched.length === (currentStation?.matchingPairs?.length || 0);
      setFeedback({
        type: "correct",
        title: allSolved ? "Großartig! Alle Puzzleteile perfekt verzahnt" : "Puzzleteile eingerastet! ✓",
        selectionExplanation: pair.explanation || "Diese beiden Puzzleteile greifen exakt ineinander.",
        zqpBackground: allSolved
          ? (currentStation?.zqpRationale || "Alle Maßnahmen tragen entscheidend zur Entschärfung typischer Wohnraumrisiken bei.")
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

  // Color badges for matched pairs to show their explicit link
  const pairColors = [
    { border: "border-teal-500", bg: "bg-teal-50", text: "text-teal-900", badge: "bg-[#247a6d] text-white" },
    { border: "border-emerald-500", bg: "bg-emerald-50", text: "text-emerald-900", badge: "bg-emerald-600 text-white" },
    { border: "border-cyan-500", bg: "bg-cyan-50", text: "text-cyan-900", badge: "bg-cyan-700 text-white" },
    { border: "border-indigo-500", bg: "bg-indigo-50", text: "text-indigo-900", badge: "bg-indigo-700 text-white" },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Top Viewport & Reset Bar */}
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#bbd1cd]">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-[#1b5c53]">
            {completed
              ? "Auswertung"
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

      {/* Main Responsive Quiz Viewport */}
      <div className="flex-1 flex justify-center items-start overflow-y-auto">
        <div
          className={`w-full bg-white border border-[#bbd1cd] rounded-2xl shadow-md overflow-hidden transition-all duration-300 ${
            viewport === "mobile" ? "max-w-[385px]" : "max-w-2xl"
          }`}
        >
          {/* Header with ZQP Petrol & dynamic progress bar */}
          <div className="bg-gradient-to-r from-[#247a6d] to-[#1b5c53] text-white p-5 shadow-sm">
            <div className="flex items-center justify-between text-xs text-[#bbd1cd] font-semibold uppercase tracking-wider mb-1.5">
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
            <h2 className="text-xl font-bold leading-tight text-white">{quiz.title}</h2>

            {/* Stepper Progress Bar */}
            <div className="w-full bg-[#00473d] h-2 rounded-full mt-3 overflow-hidden shadow-inner">
              <div
                className="bg-emerald-400 h-full transition-all duration-500 rounded-full"
                style={{
                  width: completed
                    ? "100%"
                    : `${((currentStationIdx + 1) / quiz.stations.length) * 100}%`,
                }}
              />
            </div>
          </div>

          {/* Station Body */}
          <div className="p-6">
            {!completed && currentStation && (
              <div className="flex flex-col gap-4">
                <div>
                  <h3 className="text-base md:text-lg font-bold text-[#1b5c53] leading-snug">
                    {currentStation.promptOrInstruction}
                  </h3>
                </div>

                {/* ==============================================================
                    1. AUTHENTIC JIGSAW MATCHING PUZZLE WITH VISIBLE CONNECTIONS
                    ============================================================== */}
                {currentStation.type === "matching" && currentStation.matchingPairs && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-xs text-[#6e6c70] bg-[#f3f8f7] p-2.5 rounded-lg border border-[#bbd1cd]">
                      <span>
                        Wählen Sie links ein Puzzleteil (凸) und rechts das Gegenstück (凹), um sie zu verzahnen:
                      </span>
                      <span className="font-bold text-[#1b5c53] shrink-0 ml-2">
                        {matchedIds.length} / {currentStation.matchingPairs.length} verzahnt
                      </span>
                    </div>

                    {/* Unmatched Interactive Grid */}
                    <div className="grid grid-cols-2 gap-4 relative">
                      {/* Left: Threats with protruding Jigsaw Tab on right */}
                      <div className="space-y-3">
                        <span className="text-[11px] font-bold text-[#1b5c53] uppercase tracking-wider block mb-1">
                          Puzzleteile: Gefahrenquelle
                        </span>
                        {currentStation.matchingPairs.map((pair) => {
                          const isMatched = matchedIds.includes(pair.id);
                          const isSelected = selectedThreat?.id === pair.id;
                          return (
                            <button
                              key={`th-${pair.id}`}
                              onClick={() => handleSelectThreat(pair)}
                              disabled={isMatched || canAdvance}
                              className={`jigsaw-left w-full p-3 pr-6 text-left border-2 text-xs font-semibold relative transition-all ${
                                isMatched
                                  ? "border-emerald-500 bg-emerald-50/70 text-emerald-950 opacity-60 shadow-none cursor-default"
                                  : isSelected
                                  ? "border-[#247a6d] bg-[#e3eeec] ring-2 ring-[#247a6d] shadow-md -translate-x-1"
                                  : "border-[#bbd1cd] bg-white hover:border-[#247a6d] hover:bg-[#f3f8f7] shadow-xs"
                              }`}
                            >
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 font-bold shrink-0">
                                  Gefahr
                                </span>
                                <span className="leading-snug">{pair.threatOrTerm}</span>
                              </div>

                              {/* Jigsaw Connector Tab on Right Edge */}
                              <div
                                className={`puzzle-tab-right border-2 ${
                                  isMatched
                                    ? "bg-emerald-50 border-emerald-500"
                                    : isSelected
                                    ? "bg-[#247a6d] border-[#1b5c53] shadow-sm animate-pulse"
                                    : "bg-white border-[#bbd1cd]"
                                }`}
                              />
                            </button>
                          );
                        })}
                      </div>

                      {/* Right: Solutions with inward Jigsaw Socket on left */}
                      <div className="space-y-3">
                        <span className="text-[11px] font-bold text-[#1b5c53] uppercase tracking-wider block mb-1">
                          Gegenstücke: Schutzmaßnahme
                        </span>
                        {currentStation.matchingPairs.map((pair) => {
                          const isMatched = matchedIds.includes(pair.id);
                          const isSelected = selectedSolution?.id === pair.id;
                          return (
                            <button
                              key={`sol-${pair.id}`}
                              onClick={() => handleSelectSolution(pair)}
                              disabled={isMatched || canAdvance}
                              className={`jigsaw-right w-full p-3 pl-6 text-left border-2 text-xs font-semibold relative transition-all ${
                                isMatched
                                  ? "border-emerald-500 bg-emerald-50/70 text-emerald-950 opacity-60 shadow-none cursor-default"
                                  : isSelected
                                  ? "border-[#247a6d] bg-[#e3eeec] ring-2 ring-[#247a6d] shadow-md translate-x-1"
                                  : "border-[#bbd1cd] bg-white hover:border-[#247a6d] hover:bg-[#f3f8f7] shadow-xs"
                              }`}
                            >
                              {/* Jigsaw Socket on Left Edge */}
                              <div
                                className={`puzzle-blank-left border-2 ${
                                  isMatched
                                    ? "bg-emerald-50 border-emerald-500"
                                    : isSelected
                                    ? "bg-[#e3eeec] border-[#247a6d] shadow-sm"
                                    : "bg-[#fcfaf8] border-[#bbd1cd]"
                                }`}
                              />

                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold shrink-0">
                                  Lösung
                                </span>
                                <span className="leading-snug">{pair.solutionOrDef}</span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* === PERSISTENT VISUAL CONNECTIONS & DOCKING SEAM === */}
                    {connectedPairs.length > 0 && (
                      <div className="mt-4 pt-3 border-t-2 border-dashed border-[#bbd1cd] space-y-2.5">
                        <span className="text-xs font-bold text-[#1b5c53] flex items-center gap-1.5">
                          <LinkIcon className="w-3.5 h-3.5 text-[#247a6d]" />
                          Erfolgreich verzahnte Puzzleteile ({connectedPairs.length}):
                        </span>

                        {connectedPairs.map((cp, idx) => {
                          const col = pairColors[idx % pairColors.length];
                          return (
                            <div
                              key={cp.id}
                              className={`p-3 rounded-xl border-2 ${col.border} ${col.bg} flex flex-col gap-1.5 animate-puzzle-snap shadow-xs`}
                            >
                              {/* Interlocking Puzzle Header */}
                              <div className="flex items-center justify-between gap-2 text-xs font-bold flex-wrap">
                                <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-lg border border-[#bbd1cd] text-[#444]">
                                  <Puzzle className="w-3.5 h-3.5 text-[#247a6d]" />
                                  <span>{cp.threat}</span>
                                </div>

                                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[11px] shadow-xs">
                                  <span>🧩 Verzahnt</span>
                                </div>

                                <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-lg border border-[#bbd1cd] text-[#444]">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>{cp.solution}</span>
                                </div>
                              </div>

                              {/* Why this pair interlocks */}
                              {cp.explanation && (
                                <p className="text-[11px] text-[#444] bg-white/70 p-2 rounded-lg border border-black/5 leading-relaxed">
                                  <strong>Didaktischer Zusammenhang:</strong> {cp.explanation}
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* ==============================================================
                    2. ORDERING STATION (VERTICAL JIGSAW PUZZLE CHAIN)
                    ============================================================== */}
                {currentStation.type === "ordering" && (
                  <div className="space-y-3">
                    <p className="text-xs text-[#6e6c70]">
                      Ordnen Sie die Puzzlekette mit den Pfeiltasten in die richtige biomechanische Reihenfolge:
                    </p>
                    <div className="space-y-2 relative">
                      {orderedList.map((step, idx) => {
                        const isFirst = idx === 0;
                        const isLast = idx === orderedList.length - 1;
                        return (
                          <div
                            key={step.id}
                            className={`p-3.5 rounded-xl border-2 border-[#bbd1cd] bg-white flex items-center justify-between text-xs shadow-xs relative transition-all ${
                              canAdvance ? "border-emerald-500 bg-emerald-50/50" : "hover:border-[#247a6d]"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span className="w-7 h-7 rounded-lg bg-[#247a6d] text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
                                #{idx + 1}
                              </span>
                              <div>
                                <span className="font-semibold text-[#444] block text-xs leading-snug">
                                  {step.text}
                                </span>
                                {canAdvance && step.reason && (
                                  <span className="text-[11px] text-[#1b5c53] mt-1 block">
                                    💡 {step.reason}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex gap-1 shrink-0 ml-2">
                              <button
                                type="button"
                                onClick={() => handleMoveOrderItem(idx, -1)}
                                disabled={isFirst || canAdvance}
                                className="p-1.5 rounded hover:bg-[#f3f8f7] text-[#1b5c53] border border-[#bbd1cd] disabled:opacity-30"
                                title="Nach oben schieben"
                              >
                                <ArrowUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleMoveOrderItem(idx, 1)}
                                disabled={isLast || canAdvance}
                                className="p-1.5 rounded hover:bg-[#f3f8f7] text-[#1b5c53] border border-[#bbd1cd] disabled:opacity-30"
                                title="Nach unten schieben"
                              >
                                <ArrowDown className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {!canAdvance && (
                      <button
                        onClick={handleCheckOrder}
                        className="mt-1 bg-[#247a6d] hover:bg-[#1b5c53] text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-sm"
                      >
                        Puzzlekette prüfen
                      </button>
                    )}
                  </div>
                )}

                {/* ==============================================================
                    3. COMPARISON STATION (A/B SCENARIOS)
                    ============================================================== */}
                {currentStation.type === "comparison" && currentStation.comparisonScenarios && (
                  <div className="space-y-4">
                    <p className="text-xs text-[#6e6c70]">
                      Klicken Sie auf das Szenario, das die ZQP-Präventionskriterien erfüllt:
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {currentStation.comparisonScenarios.map((scen) => {
                        const isSelected = selectedScenarioId === scen.id;
                        return (
                          <div
                            key={scen.id}
                            onClick={() => !canAdvance && setSelectedScenarioId(scen.id)}
                            className={`puzzle-piece cursor-pointer p-4 rounded-xl border-2 flex flex-col justify-between transition-all ${
                              isSelected
                                ? "border-[#247a6d] bg-[#f3f8f7] ring-2 ring-[#247a6d] shadow-sm"
                                : "border-[#bbd1cd] bg-white hover:border-[#247a6d]"
                            }`}
                          >
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-bold text-xs text-[#1b5c53]">
                                  {scen.title}
                                </span>
                                <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-white border border-[#bbd1cd] text-[#6e6c70]">
                                  {scen.badge}
                                </span>
                              </div>
                              <p className="text-xs text-[#444] leading-relaxed">
                                {scen.description}
                              </p>
                            </div>
                            <div className="mt-3 pt-2 border-t border-[#e3eeec] text-xs font-semibold text-[#1b5c53] flex justify-between items-center">
                              <span>{isSelected ? "Ausgewählt" : "Szenario wählen"}</span>
                              <span className="w-5 h-5 rounded-full border-2 border-[#247a6d] flex items-center justify-center font-bold text-xs">
                                {isSelected ? "✓" : ""}
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
                        className="bg-[#247a6d] hover:bg-[#1b5c53] text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-sm disabled:opacity-50"
                      >
                        Auswahl begründen & prüfen
                      </button>
                    )}
                  </div>
                )}

                {/* ==============================================================
                    4. SINGLE CHOICE STATION
                    ============================================================== */}
                {currentStation.type === "single_choice" && currentStation.options && (
                  <div className="space-y-3">
                    <div className="space-y-2">
                      {currentStation.options.map((opt, idx) => {
                        const isSelected = selectedOptionIdx === idx;
                        return (
                          <label
                            key={idx}
                            className={`flex items-start gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
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
                              className="mt-1 text-[#247a6d] focus:ring-[#247a6d]"
                            />
                            <span className="text-xs font-medium text-[#444] leading-relaxed">
                              {opt.text}
                            </span>
                          </label>
                        );
                      })}
                    </div>

                    {!canAdvance && (
                      <button
                        onClick={handleCheckChoice}
                        disabled={selectedOptionIdx === null}
                        className="bg-[#247a6d] hover:bg-[#1b5c53] text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-sm disabled:opacity-50"
                      >
                        Antwort überprüfen
                      </button>
                    )}
                  </div>
                )}

                {/* === DETAILED EXPLANATION CARD ("WARUM RICHTIG / FALSCH") === */}
                {feedback && (
                  <div
                    className={`mt-4 p-4 rounded-xl border-2 text-xs transition-all ${
                      feedback.type === "correct"
                        ? "border-emerald-500 bg-emerald-50 text-emerald-950"
                        : feedback.type === "revealed"
                        ? "border-amber-500 bg-amber-50 text-amber-950"
                        : "border-[#722b28] bg-rose-50 text-[#722b28]"
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold mb-2">
                      {feedback.type === "correct" && (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                      )}
                      {feedback.type === "revealed" && (
                        <Lightbulb className="w-5 h-5 text-amber-600 shrink-0" />
                      )}
                      {feedback.type === "incorrect" && (
                        <AlertTriangle className="w-5 h-5 text-[#722b28] shrink-0" />
                      )}
                      <span className="text-sm">{feedback.title}</span>
                    </div>

                    {/* Specific explanation why this selection was right or wrong */}
                    <div className="mb-2 bg-white/80 p-2.5 rounded-lg border border-black/5">
                      <strong className="block text-[#1b5c53] mb-0.5">
                        {feedback.type === "correct" ? "Warum diese Auswahl richtig ist:" : "Didaktische Erklärung:"}
                      </strong>
                      <p className="leading-relaxed">{feedback.selectionExplanation}</p>
                    </div>

                    {/* ZQP Practice advice */}
                    <div className="p-2.5 rounded-lg bg-[#247a6d]/10 border border-[#247a6d]/20 text-[#1b5c53]">
                      <strong className="block font-bold mb-0.5">
                        ZQP-Hintergrundwissen für die Praxis:
                      </strong>
                      <p className="leading-relaxed">{feedback.zqpBackground}</p>
                    </div>
                  </div>
                )}

                {/* Bottom Navigation & "LÖSUNG ANZEIGEN" Button */}
                <div className="mt-4 pt-4 border-t border-[#e3eeec] flex items-center justify-between gap-2 flex-wrap">
                  {!canAdvance ? (
                    <button
                      type="button"
                      onClick={handleRevealSolution}
                      className="text-xs text-[#1b5c53] hover:text-[#247a6d] font-semibold flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#bbd1cd] bg-[#f3f8f7] hover:bg-[#e3eeec] transition-colors"
                      title="Antwort und fachliche Erklärung aufdecken"
                    >
                      <HelpCircle className="w-4 h-4 text-[#247a6d]" />
                      <span>Ich weiß es nicht / Lösung anzeigen</span>
                    </button>
                  ) : (
                    <span className="text-xs text-emerald-800 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Station gelöst & abgeschlossen
                    </span>
                  )}

                  {canAdvance && (
                    <button
                      onClick={handleNextStation}
                      className="bg-[#247a6d] hover:bg-[#1b5c53] text-white font-semibold text-xs px-5 py-2.5 rounded-lg shadow-sm flex items-center gap-1.5 transition-all"
                    >
                      <span>
                        {currentStationIdx === quiz.stations.length - 1
                          ? "Zur Gesamtauswertung"
                          : "Nächste Station"}
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Completed Score & Certificate View */}
            {completed && (
              <div className="p-6 text-center flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-[#e3eeec] border-2 border-[#247a6d] flex items-center justify-center mb-3 shadow-sm">
                  <Award className="w-8 h-8 text-[#247a6d]" />
                </div>
                <h3 className="text-xl font-bold text-[#1b5c53] mb-1">
                  Glückwunsch! Alle Stationen gemeistert
                </h3>
                <p className="text-xs text-[#444] mb-4">
                  Sie haben alle {quiz.stations.length} interaktiven Lernstationen des Themas erfolgreich absolviert.
                </p>

                <div className="bg-[#f3f8f7] border-2 border-[#bbd1cd] p-4 rounded-xl text-left text-xs text-[#444] mb-5 w-full space-y-2 shadow-xs">
                  <strong className="text-[#1b5c53] block font-bold text-sm">
                    ZQP-Praxisfazit für den Alltag:
                  </strong>
                  <p className="leading-relaxed">
                    {quiz.summary || "Regelmäßiges Auffrischen von Pflegewissen und Sensibilität für Gefahrenquellen schützen nachhaltig im häuslichen Umfeld."}
                  </p>
                  <div className="pt-2 border-t border-[#bbd1cd]/50 text-[11px] text-[#6e6c70]">
                    Tipp: Nutzen Sie die ZQP-Ratgeber und Sicherheits-Checklisten auf <strong>zqp.de</strong> für die barrierearme Wohnraumanpassung.
                  </div>
                </div>

                <button
                  onClick={handleReset}
                  className="bg-[#247a6d] hover:bg-[#1b5c53] text-white text-xs font-semibold px-5 py-2.5 rounded-lg shadow-sm transition-colors"
                >
                  Lernreise erneut starten
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
