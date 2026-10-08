import React, { useState, useEffect, useRef } from "react";
import {
  RotateCcw,
  Monitor,
  Smartphone,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Award,
  Lightbulb,
  CheckCircle2,
  XCircle,
  Puzzle,
  Check,
  GripVertical,
  Sparkles,
  Edit3,
  Printer,
  FileSearch,
  Star,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Trophy,
} from "lucide-react";
import {
  QuizGenerationResult,
  QuizStation,
  MatchingPair,
  EditorialStatus,
} from "../types";
import { EditorialStatusDropdown } from "./EditorialStatusDropdown";

interface QuizPreviewProps {
  quiz: QuizGenerationResult;
  onReset: () => void;
  onEditStation?: (stationIdx: number) => void;
  editorialStatus?: EditorialStatus;
  onChangeStatus?: (status: EditorialStatus) => void;
  onOpenSourceInspector?: () => void;
  onOpenFavorites?: () => void;
  onOpenAudit?: () => void;
}

export const QuizPreview: React.FC<QuizPreviewProps> = ({
  quiz,
  onReset,
  onEditStation,
  editorialStatus = "draft",
  onChangeStatus,
  onOpenSourceInspector,
  onOpenFavorites,
  onOpenAudit,
}) => {
  const [viewport, setViewport] = useState<"desktop" | "mobile">("desktop");
  const [currentStationIdx, setCurrentStationIdx] = useState<number>(0);
  const [completed, setCompleted] = useState<boolean>(false);

  const currentStation: QuizStation | undefined = quiz.stations[currentStationIdx];

  // UNIVERSAL POINTER DRAG STATE (Robust mouse & touch drag engine)
  interface ActivePointerDrag {
    type: "matching" | "ordering" | "myth_fact" | "bucket_sort" | "fill_in_the_blank";
    id: string;
    label: string;
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
    isDragging: boolean;
  }
  const [pointerDrag, setPointerDrag] = useState<ActivePointerDrag | null>(null);
  const pointerDragRef = useRef<ActivePointerDrag | null>(null);
  const hoverTargetRef = useRef<{ type: string; id: string } | null>(null);
  const wasDraggingRef = useRef<boolean>(false);

  // 1. MATCHING STATE
  const [selectedThreat, setSelectedThreat] = useState<{ id: string; btnId: string } | null>(null);
  const [selectedSolution, setSelectedSolution] = useState<{ id: string; btnId: string } | null>(null);
  const [matchedIds, setMatchedIds] = useState<string[]>([]);
  const [shuffledSolutions, setShuffledSolutions] = useState<MatchingPair[]>([]);
  const [draggedThreatId, setDraggedThreatId] = useState<string | null>(null);
  const [dragOverSolId, setDragOverSolId] = useState<string | null>(null);

  // 2. ORDERING STATE
  const [orderedList, setOrderedList] = useState<{ id: string; text: string; correctIndex: number; reason?: string }[]>([]);
  const [dragOverStepIdx, setDragOverStepIdx] = useState<number | null>(null);

  // 3. COMPARISON STATE
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(null);

  // 4. SINGLE CHOICE STATE
  const [selectedOptionIdx, setSelectedOptionIdx] = useState<number | null>(null);

  // 5. MYTH VS FACT STATE
  const [mythFactChoice, setMythFactChoice] = useState<boolean | null>(null);
  const [draggedMythStatement, setDraggedMythStatement] = useState<boolean>(false);
  const [dragOverMythTarget, setDragOverMythTarget] = useState<"myth" | "fact" | null>(null);

  // 6. BUCKET SORT (DOS & DON'TS) STATE
  const [bucketAssignments, setBucketAssignments] = useState<Record<string, "do" | "dont">>({});
  const [draggedBucketItemId, setDraggedBucketItemId] = useState<string | null>(null);
  const [dragOverBucket, setDragOverBucket] = useState<"do" | "dont" | null>(null);

  // 7. DILEMMA STATE
  const [selectedDilemmaId, setSelectedDilemmaId] = useState<string | null>(null);

  // 8. CHECKLIST STATE
  const [checkedItemIds, setCheckedItemIds] = useState<string[]>([]);

  // 9. FILL IN THE BLANKS STATE
  const [filledBlanks, setFilledBlanks] = useState<Record<string, string>>({});
  const [activeBlankId, setActiveBlankId] = useState<string | null>(null);
  const [draggedWord, setDraggedWord] = useState<string | null>(null);
  const [dragOverBlankId, setDragOverBlankId] = useState<string | null>(null);

  // UNIFIED FEEDBACK & DRAWER STATE
  interface FeedbackState {
    type: "correct" | "incorrect" | "revealed";
    title: string;
    selectionExplanation: string;
    zqpBackground: string;
  }
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [canAdvance, setCanAdvance] = useState<boolean>(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [stationResults, setStationResults] = useState<Record<number, "solved" | "unsolved">>({});

  // Reset station state on change
  useEffect(() => {
    setSelectedThreat(null);
    setSelectedSolution(null);
    setMatchedIds([]);
    setDraggedThreatId(null);
    setDragOverSolId(null);
    setDragOverStepIdx(null);

    setSelectedScenarioId(null);
    setSelectedOptionIdx(null);

    setMythFactChoice(null);
    setDraggedMythStatement(false);
    setDragOverMythTarget(null);

    setBucketAssignments({});
    setDraggedBucketItemId(null);
    setDragOverBucket(null);

    setSelectedDilemmaId(null);
    setCheckedItemIds([]);

    setFilledBlanks({});
    setActiveBlankId(null);
    setDraggedWord(null);
    setDragOverBlankId(null);

    setFeedback(null);
    setCanAdvance(false);
    setIsDrawerOpen(false);

    // Shuffle solutions for matching station
    if (currentStation?.type === "matching" && currentStation.matchingPairs) {
      const original = [...currentStation.matchingPairs];
      const shuffled = [...original];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
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

    // Set first blank active if fill_in_the_blank
    if (currentStation?.type === "fill_in_the_blank" && currentStation.fillInBlanks?.length) {
      setActiveBlankId(currentStation.fillInBlanks[0].id);
    }
  }, [currentStationIdx, currentStation]);

  const handleReset = () => {
    setCurrentStationIdx(0);
    setCompleted(false);
    setStationResults({});
    setIsDrawerOpen(false);
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
    } else if (currentStation.type === "myth_fact" && currentStation.mythFactItems?.length) {
      setMythFactChoice(currentStation.mythFactItems[0].isFact);
    } else if (currentStation.type === "bucket_sort" && currentStation.bucketSortItems) {
      const allAssigned: Record<string, "do" | "dont"> = {};
      currentStation.bucketSortItems.forEach((it) => {
        allAssigned[it.id] = it.targetBucket;
      });
      setBucketAssignments(allAssigned);
    } else if (currentStation.type === "dilemma" && currentStation.dilemmaReactions) {
      const opt = currentStation.dilemmaReactions.find((r) => r.isOptimal);
      if (opt) setSelectedDilemmaId(opt.id);
    } else if (currentStation.type === "checklist" && currentStation.checklistItems) {
      setCheckedItemIds(currentStation.checklistItems.filter((i) => i.isCorrect).map((i) => i.id));
    } else if (currentStation.type === "fill_in_the_blank" && currentStation.fillInBlanks) {
      const allFilled: Record<string, string> = {};
      currentStation.fillInBlanks.forEach((b) => {
        allFilled[b.id] = b.correctWord;
      });
      setFilledBlanks(allFilled);
    }

    setFeedback({
      type: "revealed",
      title: "Lösung aufgedeckt",
      selectionExplanation: currentStation.solutionExplanation || "Hier sehen Sie die vollständige, empfohlene Lösung für diese Station.",
      zqpBackground: currentStation.zqpRationale || "Fachlich fundiert nach den Empfehlungen der Stiftung ZQP.",
    });
    setStationResults((prev) => ({ ...prev, [currentStationIdx]: "unsolved" }));
    setCanAdvance(true);
    setIsDrawerOpen(true);
  };

  // --- 1. MATCHING LOGIC (CLICK & DRAG-AND-DROP) ---
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

      const totalPairs = currentStation?.matchingPairs?.length || 0;
      const allSolved = nextMatched.length === totalPairs;

      setFeedback({
        type: "correct",
        title: allSolved ? "Großartig! Alle Puzzleteile perfekt verzahnt" : `Puzzleteil eingerastet! (${nextMatched.length} von ${totalPairs})`,
        selectionExplanation: pair.explanation || "Diese beiden Puzzleteile greifen inhaltlich exakt ineinander.",
        zqpBackground: allSolved
          ? (currentStation?.zqpRationale || "Alle Schutzmaßnahmen neutralisieren die jeweiligen Gefahrenquellen nachhaltig.")
          : `Noch ${totalPairs - nextMatched.length} Puzzleteil(e) offen. Verzahnung fortsetzen.`,
      });

      if (allSolved) {
        setCanAdvance(true);
        setStationResults((prev) => ({ ...prev, [currentStationIdx]: "solved" }));
      } else {
        setCanAdvance(false);
      }
      setIsDrawerOpen(true);
    } else {
      setSelectedThreat(null);
      setSelectedSolution(null);
      setFeedback({
        type: "incorrect",
        title: "Puzzleteile passen nicht zusammen",
        selectionExplanation: "Diese Schutzmaßnahme greift bei der gewählten Gefahrenquelle nicht. Prüfen Sie die Anforderungen erneut.",
        zqpBackground: "Typische Gefahrenquellen erfordern spezifische, gezielte Absicherungen nach ZQP-Standard.",
      });
      setIsDrawerOpen(true);
    }
  };

  // --- 2. ORDERING LOGIC (DRAG-REORDER & ARROWS) ---
  const handleMoveOrderItem = (fromIndex: number, direction: -1 | 1) => {
    if (canAdvance) return;
    const toIndex = fromIndex + direction;
    if (toIndex < 0 || toIndex >= orderedList.length) return;
    const nextList = [...orderedList];
    const [moved] = nextList.splice(fromIndex, 1);
    nextList.splice(toIndex, 0, moved);
    setOrderedList(nextList);
  };

  const handleReorderDrop = (fromIndex: number, toIndex: number) => {
    if (canAdvance || fromIndex === toIndex) return;
    const nextList = [...orderedList];
    const [moved] = nextList.splice(fromIndex, 1);
    nextList.splice(toIndex, 0, moved);
    setOrderedList(nextList);
    setDragOverStepIdx(null);
  };

  const handleCheckOrder = () => {
    const isCorrect = orderedList.every((item, idx) => item.correctIndex === idx);
    if (isCorrect) {
      setFeedback({
        type: "correct",
        title: "Hervorragend! Perfekte Schrittfolge",
        selectionExplanation: "Alle Schritte wurden in der richtigen Reihenfolge angeordnet.",
        zqpBackground: currentStation?.zqpRationale || "Eine methodisch korrekte Abfolge verhindert Komplikationen.",
      });
      setStationResults((prev) => ({ ...prev, [currentStationIdx]: "solved" }));
      setCanAdvance(true);
    } else {
      setFeedback({
        type: "incorrect",
        title: "Die Kette ist noch nicht optimal",
        selectionExplanation: "Ein Schritt wurde zu früh oder zu spät angesetzt. Überlegen Sie, welcher vorbereitende Schritt zuerst Stabilität verleiht.",
        zqpBackground: "Erst Standfläche sichern, dann Schwerpunkt verlagern, dann aufrichten.",
      });
      setCanAdvance(false);
    }
    setIsDrawerOpen(true);
  };

  // --- 3. COMPARISON LOGIC ---
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
      setStationResults((prev) => ({ ...prev, [currentStationIdx]: "solved" }));
      setCanAdvance(true);
    } else {
      setFeedback({
        type: "incorrect",
        title: "Vorsicht: Dieses Szenario birgt erhebliche Sturzrisiken",
        selectionExplanation: scenario.explanation,
        zqpBackground: currentStation.solutionExplanation || "Lose Teppichläufer und im Raum liegende Kabel sind häufige Sturzursachen.",
      });
      setCanAdvance(false);
    }
    setIsDrawerOpen(true);
  };

  // --- 4. SINGLE CHOICE LOGIC ---
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
      setStationResults((prev) => ({ ...prev, [currentStationIdx]: "solved" }));
      setCanAdvance(true);
    } else {
      setFeedback({
        type: "incorrect",
        title: "Nicht die empfohlene Maßnahme",
        selectionExplanation: opt.explanation,
        zqpBackground: currentStation.solutionExplanation || "Überlegen Sie, welche Option den sichersten Schutz bietet.",
      });
      setCanAdvance(false);
    }
    setIsDrawerOpen(true);
  };

  // --- 5. MYTH VS FACT LOGIC ---
  const handleSelectMythFact = (userSaidFact: boolean) => {
    if (canAdvance || !currentStation?.mythFactItems?.length) return;
    const item = currentStation.mythFactItems[0];
    setMythFactChoice(userSaidFact);

    const isCorrect = userSaidFact === item.isFact;
    if (isCorrect) {
      setFeedback({
        type: "correct",
        title: item.isFact ? "Richtig erkannt! Es ist eine Tatsache." : "Richtig erkannt! Es ist ein Mythos.",
        selectionExplanation: item.explanation,
        zqpBackground: currentStation.zqpRationale || "Evidenzbasierte Aufklärung beseitigt riskante Alltagsgewohnheiten.",
      });
      setStationResults((prev) => ({ ...prev, [currentStationIdx]: "solved" }));
      setCanAdvance(true);
    } else {
      setFeedback({
        type: "incorrect",
        title: item.isFact ? "Irrtum: Dies ist eine belegte Tatsache!" : "Vorsicht: Dies ist ein verbreiteter Mythos!",
        selectionExplanation: item.explanation,
        zqpBackground: currentStation.solutionExplanation || "Wissenschaftliche Erkenntnisse zeigen hier ein anderes Bild.",
      });
      setCanAdvance(false);
    }
    setIsDrawerOpen(true);
  };

  // --- 6. BUCKET SORT (DOS & DON'TS) LOGIC ---
  const handleAssignBucket = (itemId: string, bucket: "do" | "dont") => {
    if (canAdvance) return;
    const next = { ...bucketAssignments, [itemId]: bucket };
    setBucketAssignments(next);

    const totalItems = currentStation?.bucketSortItems?.length || 0;
    if (Object.keys(next).length === totalItems) {
      // Evaluate all
      const allCorrect = currentStation?.bucketSortItems?.every(
        (it) => next[it.id] === it.targetBucket
      );

      if (allCorrect) {
        setFeedback({
          type: "correct",
          title: "Ausgezeichnet! Alle Maßnahmen richtig eingeordnet",
          selectionExplanation: "Sie haben alle Verhaltensweisen treffsicher in Do (Empfohlen) und Don't (Vermeiden) aufgeteilt.",
          zqpBackground: currentStation?.zqpRationale || "Empathische Deeskalation und Validation sind in Krisensituationen entscheidend.",
        });
        setStationResults((prev) => ({ ...prev, [currentStationIdx]: "solved" }));
        setCanAdvance(true);
      } else {
        setFeedback({
          type: "incorrect",
          title: "Noch nicht alle Zuordnungen stimmen",
          selectionExplanation: "Prüfen Sie insbesondere, welche Verhaltensweisen eher Frustration erzeugen und vermieden werden sollten.",
          zqpBackground: currentStation?.solutionExplanation || "Validation statt Widerspruch lautet die ZQP-Empfehlung.",
        });
        setCanAdvance(false);
      }
      setIsDrawerOpen(true);
    }
  };

  // --- 7. DILEMMA LOGIC ---
  const handleSelectDilemma = (id: string) => {
    if (canAdvance || !currentStation?.dilemmaReactions) return;
    setSelectedDilemmaId(id);
    const reaction = currentStation.dilemmaReactions.find((r) => r.id === id);
    if (!reaction) return;

    if (reaction.isOptimal) {
      setFeedback({
        type: "correct",
        title: "Beste Handlungsoption gewählt!",
        selectionExplanation: `${reaction.consequence} • ${reaction.zqpAdvice}`,
        zqpBackground: currentStation.zqpRationale || "Autonomie und Schutzbedürfnis stehen in der Pflegeberatung gleichberechtigt nebeneinander.",
      });
      setStationResults((prev) => ({ ...prev, [currentStationIdx]: "solved" }));
      setCanAdvance(true);
    } else {
      setFeedback({
        type: "incorrect",
        title: "Problematische Reaktion für den Pflegealltag",
        selectionExplanation: `${reaction.consequence} • ${reaction.zqpAdvice}`,
        zqpBackground: currentStation.solutionExplanation || "Versuchen Sie, die Selbstbestimmung der Person mit dezenten Hilfen zu wahren.",
      });
      setCanAdvance(false);
    }
    setIsDrawerOpen(true);
  };

  // --- 8. CHECKLIST LOGIC ---
  const handleToggleChecklist = (id: string) => {
    if (canAdvance) return;
    setCheckedItemIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleCheckChecklist = () => {
    if (!currentStation?.checklistItems) return;
    const correctIds = currentStation.checklistItems.filter((i) => i.isCorrect).map((i) => i.id);
    const isExactMatch =
      checkedItemIds.length === correctIds.length &&
      checkedItemIds.every((id) => correctIds.includes(id));

    if (isExactMatch) {
      setFeedback({
        type: "correct",
        title: "Perfekt ausgewählt! Alle Kernmaßnahmen markiert",
        selectionExplanation: "Sie haben exakt die wirksamen Maßnahmen nach ZQP-Leitlinie identifiziert.",
        zqpBackground: currentStation.zqpRationale || "Gezielte Wohnraumanpassungen senken das Sturzrisiko nachhaltig.",
      });
      setStationResults((prev) => ({ ...prev, [currentStationIdx]: "solved" }));
      setCanAdvance(true);
    } else {
      setFeedback({
        type: "incorrect",
        title: "Checkliste ist noch nicht stimmig",
        selectionExplanation: "Einige gewählte Punkte sind entweder ineffektiv oder es fehlen wesentliche Sicherheitsmaßnahmen.",
        zqpBackground: currentStation.solutionExplanation || "Feste Haltegriffe, rutschfreie Böden und Licht sind die 3 Säulen.",
      });
      setCanAdvance(false);
    }
    setIsDrawerOpen(true);
  };

  // --- 9. FILL IN THE BLANK LOGIC ---
  const handleAssignWordToBlank = (blankId: string, word: string) => {
    if (canAdvance) return;
    const next = { ...filledBlanks, [blankId]: word };
    setFilledBlanks(next);

    // Auto advance active blank
    const blanks = currentStation?.fillInBlanks || [];
    const nextEmpty = blanks.find((b) => !next[b.id]);
    if (nextEmpty) {
      setActiveBlankId(nextEmpty.id);
    }
  };

  const handleCheckFillIn = () => {
    if (!currentStation?.fillInBlanks) return;
    const allCorrect = currentStation.fillInBlanks.every(
      (b) => filledBlanks[b.id] === b.correctWord
    );

    if (allCorrect) {
      setFeedback({
        type: "correct",
        title: "Wortbausteine exakt eingesetzt!",
        selectionExplanation: "Der ZQP-Leitsatz ist vollständig und fachlich präzise komplettiert.",
        zqpBackground: currentStation.zqpRationale || "Einprägsame Merksätze sichern klares Handeln im Ernstfall.",
      });
      setStationResults((prev) => ({ ...prev, [currentStationIdx]: "solved" }));
      setCanAdvance(true);
    } else {
      setFeedback({
        type: "incorrect",
        title: "Ein oder mehrere Wörter passen noch nicht",
        selectionExplanation: "Überlegen Sie, welches Verhalten im Notfall Beruhigung statt Hektik stiftet.",
        zqpBackground: currentStation.solutionExplanation || "Ruhe bewahren und kein überstürztes Aufrichten erzwingen.",
      });
      setCanAdvance(false);
    }
    setIsDrawerOpen(true);
  };

  const handleNextStation = () => {
    setIsDrawerOpen(false);
    setFeedback(null);
    if (currentStationIdx < quiz.stations.length - 1) {
      setCurrentStationIdx((prev) => prev + 1);
    } else {
      setCompleted(true);
    }
  };

  // --- UNIVERSAL POINTER DRAG ENGINE ---
  const startPointerDrag = (
    e: React.PointerEvent,
    type: ActivePointerDrag["type"],
    id: string,
    label: string
  ) => {
    if (e.button !== 0 || canAdvance) return;

    const initialDrag: ActivePointerDrag = {
      type,
      id,
      label,
      startX: e.clientX,
      startY: e.clientY,
      currentX: e.clientX,
      currentY: e.clientY,
      isDragging: false,
    };
    pointerDragRef.current = initialDrag;
    hoverTargetRef.current = null;

    const handlePointerMove = (moveEvt: PointerEvent) => {
      if (!pointerDragRef.current) return;
      const dx = moveEvt.clientX - pointerDragRef.current.startX;
      const dy = moveEvt.clientY - pointerDragRef.current.startY;
      const distance = Math.hypot(dx, dy);

      if (!pointerDragRef.current.isDragging && distance > 4) {
        pointerDragRef.current.isDragging = true;
      }

      if (pointerDragRef.current.isDragging) {
        moveEvt.preventDefault();

        pointerDragRef.current.currentX = moveEvt.clientX;
        pointerDragRef.current.currentY = moveEvt.clientY;
        setPointerDrag({ ...pointerDragRef.current });

        const el = document.elementFromPoint(moveEvt.clientX, moveEvt.clientY);

        if (type === "matching") {
          const dropEl = el?.closest("[data-drop-solution-id]") as HTMLElement | null;
          const solId = dropEl?.dataset.dropSolutionId || null;
          setDragOverSolId(solId);
          hoverTargetRef.current = solId ? { type: "matching", id: solId } : null;
        } else if (type === "ordering") {
          const dropEl = el?.closest("[data-drop-step-idx]") as HTMLElement | null;
          const stepIdx = dropEl ? Number(dropEl.dataset.dropStepIdx) : null;
          setDragOverStepIdx(stepIdx);
          hoverTargetRef.current = stepIdx !== null ? { type: "ordering", id: String(stepIdx) } : null;
        } else if (type === "myth_fact") {
          const dropEl = el?.closest("[data-drop-myth-target]") as HTMLElement | null;
          const mythTarget = (dropEl?.dataset.dropMythTarget as "myth" | "fact") || null;
          setDragOverMythTarget(mythTarget);
          hoverTargetRef.current = mythTarget ? { type: "myth_fact", id: mythTarget } : null;
        } else if (type === "bucket_sort") {
          const dropEl = el?.closest("[data-drop-bucket]") as HTMLElement | null;
          const bucket = (dropEl?.dataset.dropBucket as "do" | "dont") || null;
          setDragOverBucket(bucket);
          hoverTargetRef.current = bucket ? { type: "bucket_sort", id: bucket } : null;
        } else if (type === "fill_in_the_blank") {
          const dropEl = el?.closest("[data-drop-blank-id]") as HTMLElement | null;
          const blankId = dropEl?.dataset.dropBlankId || null;
          setDragOverBlankId(blankId);
          hoverTargetRef.current = blankId ? { type: "fill_in_the_blank", id: blankId } : null;
        }
      }
    };

    const handlePointerUp = (upEvt: PointerEvent) => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);

      const drag = pointerDragRef.current;
      if (drag && drag.isDragging) {
        wasDraggingRef.current = true;
        setTimeout(() => {
          wasDraggingRef.current = false;
        }, 150);

        const el = document.elementFromPoint(upEvt.clientX, upEvt.clientY);
        const activeHover = hoverTargetRef.current;

        if (drag.type === "matching") {
          const dropEl = el?.closest("[data-drop-solution-id]") as HTMLElement | null;
          const targetSolId = dropEl?.dataset.dropSolutionId || (activeHover?.type === "matching" ? activeHover.id : undefined);
          if (targetSolId) {
            checkMatch(drag.id, targetSolId);
          }
        } else if (drag.type === "ordering") {
          const dropEl = el?.closest("[data-drop-step-idx]") as HTMLElement | null;
          const targetStepIdx = dropEl?.dataset.dropStepIdx !== undefined
            ? Number(dropEl.dataset.dropStepIdx)
            : (activeHover?.type === "ordering" ? Number(activeHover.id) : undefined);
          if (targetStepIdx !== undefined && !isNaN(targetStepIdx)) {
            handleReorderDrop(Number(drag.id), targetStepIdx);
          }
        } else if (drag.type === "myth_fact") {
          const dropEl = el?.closest("[data-drop-myth-target]") as HTMLElement | null;
          const target = dropEl?.dataset.dropMythTarget || (activeHover?.type === "myth_fact" ? activeHover.id : undefined);
          if (target === "myth") handleSelectMythFact(false);
          else if (target === "fact") handleSelectMythFact(true);
        } else if (drag.type === "bucket_sort") {
          const dropEl = el?.closest("[data-drop-bucket]") as HTMLElement | null;
          const bucket = dropEl?.dataset.dropBucket || (activeHover?.type === "bucket_sort" ? activeHover.id : undefined);
          if (bucket === "do" || bucket === "dont") {
            handleAssignBucket(drag.id, bucket as "do" | "dont");
          }
        } else if (drag.type === "fill_in_the_blank") {
          const dropEl = el?.closest("[data-drop-blank-id]") as HTMLElement | null;
          const blankId = dropEl?.dataset.dropBlankId || (activeHover?.type === "fill_in_the_blank" ? activeHover.id : undefined);
          if (blankId) {
            handleAssignWordToBlank(blankId, drag.id);
          }
        }
      }

      hoverTargetRef.current = null;
      setDragOverSolId(null);
      setDragOverStepIdx(null);
      setDragOverMythTarget(null);
      setDragOverBucket(null);
      setDragOverBlankId(null);
      setDraggedThreatId(null);
      setDraggedBucketItemId(null);
      setDraggedWord(null);
      setDraggedMythStatement(false);

      pointerDragRef.current = null;
      setPointerDrag(null);
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: false });
    window.addEventListener("pointerup", handlePointerUp);
  };

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
      {/* 1. EDITORIAL & PREVIEW TOOLBAR (Top Bar) */}
      <div className="flex flex-col gap-2 pb-2.5 mb-2.5 border-b border-[#bbd1cd] shrink-0">
        {/* Row 1: Status & Redaktions-Tools (Links) + Aktionen (Rechts) */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            {/* Custom Editorial Status Dropdown */}
            {onChangeStatus && (
              <EditorialStatusDropdown
                status={editorialStatus || "draft"}
                onChange={onChangeStatus}
              />
            )}

            {/* Segmented Editorial Tools Group */}
            <div className="inline-flex items-center rounded-lg border border-[#bbd1cd] bg-white divide-x divide-[#bbd1cd] shadow-2xs overflow-hidden h-7 text-xs font-semibold text-[#1b5c53]">
              {onOpenSourceInspector && (
                <button
                  type="button"
                  onClick={onOpenSourceInspector}
                  className="px-2.5 h-full hover:bg-[#f3f8f7] flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Quelltext-Abgleich & Zitat-Finder (Anti-Halluzination)"
                >
                  <FileSearch className="w-3.5 h-3.5 text-[#247a6d]" />
                  <span>Quellen</span>
                </button>
              )}

              {onOpenFavorites && (
                <button
                  type="button"
                  onClick={onOpenFavorites}
                  className="px-2.5 h-full hover:bg-[#f3f8f7] flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Stations-Schatzkiste (Favoriten & Vorlagen)"
                >
                  <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  <span>Schatzkiste</span>
                </button>
              )}

              {onOpenAudit && (
                <button
                  type="button"
                  onClick={onOpenAudit}
                  className="px-2.5 h-full hover:bg-[#f3f8f7] flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Qualitäts- & Barrierefreiheitsprüfung (WCAG 2.1 AA)"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-[#247a6d]" />
                  <span>Audit</span>
                </button>
              )}
            </div>
          </div>

          {/* Right: Station bearbeiten & Viewport / Reset */}
          <div className="flex items-center gap-1.5">
            {onEditStation && !completed && (
              <button
                type="button"
                onClick={() => onEditStation(currentStationIdx)}
                className="flex items-center gap-1 h-7 px-2.5 text-xs font-semibold text-[#1b5c53] bg-white hover:bg-[#e3eeec] rounded-lg border border-[#bbd1cd] hover:border-[#247a6d] shadow-2xs transition-colors cursor-pointer"
                title="Diese Station direkt im WYSIWYG-Editor anpassen"
              >
                <Edit3 className="w-3.5 h-3.5 text-[#247a6d]" />
                <span className="hidden sm:inline">Station bearbeiten</span>
              </button>
            )}

            <div className="flex bg-[#e3eeec] p-0.5 rounded-lg border border-[#bbd1cd] h-7 items-center">
              <button
                type="button"
                onClick={() => setViewport("desktop")}
                className={`p-1 rounded text-xs transition-colors ${
                  viewport === "desktop" ? "bg-white text-[#1b5c53] shadow-xs" : "text-[#6e6c70]"
                }`}
                title="Desktop-Ansicht"
              >
                <Monitor className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setViewport("mobile")}
                className={`p-1 rounded text-xs transition-colors ${
                  viewport === "mobile" ? "bg-white text-[#1b5c53] shadow-xs" : "text-[#6e6c70]"
                }`}
                title="Smartphone-Ansicht"
              >
                <Smartphone className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              type="button"
              onClick={handleReset}
              className="p-1 h-7 w-7 flex items-center justify-center rounded-lg bg-white hover:bg-[#e3eeec] border border-[#bbd1cd] text-[#6e6c70] hover:text-[#1b5c53] shadow-2xs transition-colors cursor-pointer"
              title="Vorschau komplett auf Anfang zurücksetzen"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Row 2: Freie Redaktions-Navigation zwischen Stationen */}
        <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#bbd1cd]/50 flex-wrap">
          {/* Klickbare Stationen-Leiste */}
          <div className="flex items-center gap-1 flex-wrap">
            <span className="text-[11px] font-bold text-[#6e6c70] mr-1 hidden sm:inline">
              Station wählen:
            </span>

            {/* Prev Button */}
            <button
              type="button"
              onClick={() => {
                if (completed) {
                  setCompleted(false);
                  setCurrentStationIdx(quiz.stations.length - 1);
                } else if (currentStationIdx > 0) {
                  setCurrentStationIdx((prev) => prev - 1);
                }
              }}
              disabled={!completed && currentStationIdx === 0}
              className="h-6 w-6 rounded flex items-center justify-center border border-[#bbd1cd] bg-white text-[#1b5c53] hover:bg-[#e3eeec] disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
              title="Vorherige Station"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            {/* Clickable Station Pills */}
            {quiz.stations.map((st, idx) => {
              const isActive = !completed && currentStationIdx === idx;
              const isSolved = stationResults[idx] === "solved";
              return (
                <button
                  key={st.id || idx}
                  type="button"
                  onClick={() => {
                    setCompleted(false);
                    setCurrentStationIdx(idx);
                  }}
                  className={`h-6 min-w-[24px] px-1.5 rounded text-xs font-bold transition-all cursor-pointer border flex items-center justify-center gap-0.5 ${
                    isActive
                      ? "bg-[#247a6d] text-white border-[#1b5c53] shadow-2xs"
                      : "bg-white hover:bg-[#e3eeec] text-[#1b5c53] border-[#bbd1cd]"
                  }`}
                  title={`Zu Station ${idx + 1} springen: „${st.title}“`}
                >
                  <span>{idx + 1}</span>
                  {isSolved && !isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  )}
                </button>
              );
            })}

            {/* Next Button */}
            <button
              type="button"
              onClick={() => {
                if (currentStationIdx < quiz.stations.length - 1) {
                  setCurrentStationIdx((prev) => prev + 1);
                } else {
                  setCompleted(true);
                }
              }}
              disabled={completed}
              className="h-6 w-6 rounded flex items-center justify-center border border-[#bbd1cd] bg-white text-[#1b5c53] hover:bg-[#e3eeec] disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
              title="Nächste Station"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>

            {/* Auswertung Jump Button */}
            <button
              type="button"
              onClick={() => setCompleted(true)}
              className={`h-6 px-2 rounded text-[11px] font-bold transition-all cursor-pointer border flex items-center gap-1 ${
                completed
                  ? "bg-[#247a6d] text-white border-[#1b5c53] shadow-2xs"
                  : "bg-white hover:bg-[#e3eeec] text-[#1b5c53] border-[#bbd1cd]"
              }`}
              title="Direkt zur Abschluss-Auswertung springen"
            >
              <Trophy className="w-3 h-3" />
              <span>Ergebnis</span>
            </button>
          </div>

          {/* Current Station Type & Quote indicator */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#e3eeec] text-[#1b5c53] font-semibold border border-[#bbd1cd] flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#247a6d]"></span>
              <span>
                {completed
                  ? "Praxistest-Auswertung"
                  : currentStation?.type === "matching"
                  ? "🧩 Zuordnungs-Puzzle"
                  : currentStation?.type === "ordering"
                  ? "🔢 Ablauf-Reihenfolge"
                  : currentStation?.type === "myth_fact"
                  ? "❌/💡 Mythos vs. Fakt"
                  : currentStation?.type === "bucket_sort"
                  ? "📥 Dos & Don'ts"
                  : currentStation?.type === "comparison"
                  ? "⚖️ Situationsvergleich"
                  : currentStation?.type === "dilemma"
                  ? "🎭 Praxis-Dilemma"
                  : currentStation?.type === "checklist"
                  ? "📋 Checkliste"
                  : currentStation?.type === "fill_in_the_blank"
                  ? "✍️ Wort-Lückentext"
                  : "💡 Wissenscheck"}
              </span>
            </span>

            {currentStation?.sourceQuote && !completed && (
              <span
                className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200"
                title={`Quelltext-Zitat: "${currentStation.sourceQuote}"`}
              >
                📖 Belegt
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main Responsive Quiz Viewport with STABLE HEIGHT & ZERO SCROLLBARS */}
      <div className="flex-1 flex justify-center items-center overflow-hidden py-1 px-1">
        <div
          className={`w-full bg-[#fbf9f5] border border-[#d8d2c7] rounded-2xl shadow-md overflow-hidden transition-all duration-300 relative flex flex-col ${
            viewport === "mobile"
              ? "max-w-[390px] h-[570px] max-h-[85vh]"
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
                  width: `${
                    completed
                      ? 100
                      : ((currentStationIdx + 1) / quiz.stations.length) * 100
                  }%`,
                }}
              />
            </div>
          </header>

          {/* 2. COMPACT STAGE (flex-1 overflow-hidden p-3 sm:p-4 flex flex-col justify-start) */}
          <div className="flex-1 min-h-0 overflow-hidden p-3 sm:p-4 flex flex-col justify-start relative">
            {!completed && currentStation && (
              <div className="flex flex-col gap-2.5 h-full">
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-[#1b5c53] leading-snug">
                    {currentStation.promptOrInstruction}
                  </h3>
                </div>

                {/* ==============================================================
                    1. MATCHING PUZZLE (DRAG & DROP + CLICK FALLBACK)
                    ============================================================== */}
                {currentStation.type === "matching" && currentStation.matchingPairs && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-[#6e6c70] bg-[#f2ede4] px-2.5 py-1 rounded-lg border border-[#e2ddd5]">
                      <span>
                        Kärtchen per Drag & Drop oder Klick verknüpfen:
                      </span>
                      <span className="font-bold text-[#1b5c53] shrink-0 ml-2">
                        {matchedIds.length} von {currentStation.matchingPairs.length} verzahnt
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {/* Left: Threats */}
                      <div className="space-y-1.5">
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded zqp-papercut-tag bg-[#fef8eb] border border-amber-300/80 text-amber-900 text-[10px] font-bold uppercase tracking-wider mb-0.5">
                          <span>⚠️</span>
                          <span>Gefahrenquelle</span>
                        </div>
                        {currentStation.matchingPairs.map((pair, idx) => {
                          const isMatched = matchedIds.includes(pair.id);
                          const isSelected = selectedThreat?.id === pair.id;
                          const theme = getPairTheme(pair.id);

                          return (
                            <div
                              key={`th-${pair.id}`}
                              style={{ touchAction: "none" }}
                              onPointerDown={(e) => {
                                if (!isMatched && !canAdvance) {
                                  startPointerDrag(e, "matching", pair.id, pair.threatOrTerm);
                                }
                              }}
                              onDragStart={(e) => e.preventDefault()}
                              onClick={() => {
                                if (!wasDraggingRef.current) handleSelectThreat(pair);
                              }}
                              className={`zqp-papercut-card zqp-draggable select-none p-2 text-left transition-all ${
                                isMatched
                                  ? `zqp-papercut-matched ${theme.border} ${theme.bg} cursor-default`
                                  : isSelected
                                  ? "zqp-papercut-selected"
                                  : ""
                              } ${canAdvance ? "locked pointer-events-none" : ""}`}
                            >
                              <div className="flex items-center justify-between mb-0.5">
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded zqp-papercut-tag bg-[#fef4e8] text-amber-950 border-amber-300/80">
                                  Teil A-{idx + 1}
                                </span>
                                {isMatched ? (
                                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full zqp-papercut-tag ${theme.badge} flex items-center gap-0.5`}>
                                    <Check className="w-2.5 h-2.5" />
                                    <span>{theme.label}</span>
                                  </span>
                                ) : isSelected ? (
                                  <span className="text-[9px] font-bold text-[#247a6d]">Wählen ➔</span>
                                ) : (
                                  <span className="text-[9px] text-[#8e8578] font-mono">Ziehen 🖐️</span>
                                )}
                              </div>
                              <p className="text-[11px] sm:text-xs font-semibold text-[#3a352d] leading-tight">
                                {pair.threatOrTerm}
                              </p>
                            </div>
                          );
                        })}
                      </div>

                      {/* Right: Shuffled Solutions (Drop Targets) */}
                      <div className="space-y-1.5">
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded zqp-papercut-tag bg-[#edf7f4] border border-emerald-300/80 text-emerald-900 text-[10px] font-bold uppercase tracking-wider mb-0.5">
                          <span>🛡️</span>
                          <span>Schutzmaßnahme</span>
                        </div>
                        {shuffledSolutions.map((pair, idx) => {
                          const isMatched = matchedIds.includes(pair.id);
                          const isSelected = selectedSolution?.id === pair.id;
                          const isDragTarget = dragOverSolId === pair.id;
                          const theme = getPairTheme(pair.id);

                          return (
                            <div
                              key={`sol-${pair.id}`}
                              data-drop-solution-id={pair.id}
                              onDragOver={(e) => {
                                e.preventDefault();
                                e.dataTransfer.dropEffect = "move";
                                if (!isMatched && !canAdvance) setDragOverSolId(pair.id);
                              }}
                              onDragLeave={() => setDragOverSolId(null)}
                              onDrop={(e) => {
                                e.preventDefault();
                                setDragOverSolId(null);
                                const threatId = e.dataTransfer.getData("text/plain") || draggedThreatId;
                                if (threatId) checkMatch(threatId, pair.id);
                              }}
                              onClick={() => {
                                if (!wasDraggingRef.current) handleSelectSolution(pair);
                              }}
                              className={`zqp-papercut-card p-2 text-left cursor-pointer transition-all ${
                                isMatched
                                  ? `zqp-papercut-matched ${theme.border} ${theme.bg} cursor-default`
                                  : isSelected
                                  ? "zqp-papercut-selected"
                                  : isDragTarget
                                  ? "border-dashed border-2 border-[#247a6d] bg-[#edf7f4] scale-[1.02] shadow-md"
                                  : ""
                              } ${canAdvance ? "locked pointer-events-none" : ""}`}
                            >
                              <div className="flex items-center justify-between mb-0.5">
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded zqp-papercut-tag bg-[#eef7f4] text-emerald-950 border-emerald-300/80">
                                  Teil B-{idx + 1}
                                </span>
                                {isMatched ? (
                                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full zqp-papercut-tag ${theme.badge} flex items-center gap-0.5`}>
                                    <Check className="w-2.5 h-2.5" />
                                    <span>{theme.label}</span>
                                  </span>
                                ) : isSelected ? (
                                  <span className="text-[9px] font-bold text-[#247a6d]">Wählen ➔</span>
                                ) : isDragTarget ? (
                                  <span className="text-[9px] font-bold text-[#247a6d] animate-pulse">Hier einrasten!</span>
                                ) : (
                                  <span className="text-[9px] text-[#8e8578] font-mono">Gegenstück</span>
                                )}
                              </div>
                              <p className="text-[11px] sm:text-xs font-semibold text-[#3a352d] leading-tight">
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
                    2. ORDERING STATION (DRAG-REORDER & ARROWS)
                    ============================================================== */}
                {currentStation.type === "ordering" && (
                  <div className="space-y-2">
                    <p className="text-[11px] text-[#6e6c70]">
                      Per Anfasser 🖐️ ziehen oder mit den Pfeilen sortieren:
                    </p>
                    <div className="space-y-1.5">
                      {orderedList.map((step, idx) => {
                        const isFirst = idx === 0;
                        const isLast = idx === orderedList.length - 1;
                        const isDragOver = dragOverStepIdx === idx;
                        return (
                          <div
                            key={step.id}
                            data-drop-step-idx={idx}
                            style={{ touchAction: "none" }}
                            onPointerDown={(e) => {
                              if (!canAdvance) {
                                startPointerDrag(e, "ordering", String(idx), step.text);
                              }
                            }}
                            onDragStart={(e) => e.preventDefault()}
                            className={`zqp-papercut-card zqp-draggable select-none p-2 sm:p-2.5 flex items-center justify-between text-xs relative transition-all ${
                              canAdvance
                                ? "border-emerald-500 bg-[#edf7f4] locked cursor-default"
                                : isDragOver
                                ? "border-dashed border-2 border-[#247a6d] bg-[#edf7f4] scale-[1.01]"
                                : ""
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <GripVertical className="w-3.5 h-3.5 text-[#888] shrink-0" />
                              <span className="w-5 h-5 rounded bg-[#247a6d] text-white flex items-center justify-center font-bold text-[10px] zqp-papercut-tag shrink-0 shadow-xs">
                                #{idx + 1}
                              </span>
                              <span className="font-semibold text-[#3a352d] text-xs leading-snug truncate">
                                {step.text}
                              </span>
                            </div>

                            <div className="flex gap-1 shrink-0 ml-2">
                              <button
                                type="button"
                                onClick={() => handleMoveOrderItem(idx, -1)}
                                disabled={isFirst || canAdvance}
                                className="p-1 rounded zqp-papercut-tag bg-[#faf8f5] hover:bg-[#edf5f3] text-[#1b5c53] disabled:opacity-30 transition-colors"
                                title="Nach oben schieben"
                              >
                                <ArrowUp className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleMoveOrderItem(idx, 1)}
                                disabled={isLast || canAdvance}
                                className="p-1 rounded zqp-papercut-tag bg-[#faf8f5] hover:bg-[#edf5f3] text-[#1b5c53] disabled:opacity-30 transition-colors"
                                title="Nach unten schieben"
                              >
                                <ArrowDown className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ==============================================================
                    3. MYTH VS FACT STATION (SWIPE / BUCKET CHOICE)
                    ============================================================== */}
                {currentStation.type === "myth_fact" && currentStation.mythFactItems?.length && (
                  <div className="space-y-3">
                    <div
                      style={{ touchAction: "none" }}
                      onPointerDown={(e) => {
                        if (!canAdvance && currentStation.mythFactItems?.[0]) {
                          startPointerDrag(e, "myth_fact", "statement", currentStation.mythFactItems[0].statement);
                        }
                      }}
                      onDragStart={(e) => e.preventDefault()}
                      className={`zqp-papercut-card zqp-draggable select-none p-3 sm:p-4 text-center border-[#e2ddd5] transition-all ${
                        draggedMythStatement ? "opacity-60 scale-95 shadow-lg" : ""
                      }`}
                    >
                      <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded zqp-papercut-tag bg-[#faf4ea] text-amber-950 border border-amber-300 text-[10px] font-bold uppercase mb-2">
                        <span>🏷️</span>
                        <span>Behauptung im Alltag</span>
                      </div>
                      <p className="text-xs sm:text-sm font-bold text-[#2d251e] leading-snug">
                        „{currentStation.mythFactItems[0].statement}“
                      </p>
                      <p className="text-[10px] text-[#8e8578] mt-1.5 font-mono">
                        🖐️ Karte auf Mythos oder Fakt ziehen oder unten antippen
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-1">
                      {/* Myth Target */}
                      <button
                        type="button"
                        data-drop-myth-target="myth"
                        disabled={canAdvance}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.dataTransfer.dropEffect = "move";
                          setDragOverMythTarget("myth");
                        }}
                        onDragLeave={() => setDragOverMythTarget(null)}
                        onDrop={(e) => {
                          e.preventDefault();
                          setDragOverMythTarget(null);
                          handleSelectMythFact(false);
                        }}
                        onClick={() => {
                          if (!wasDraggingRef.current) handleSelectMythFact(false);
                        }}
                        className={`zqp-papercut-card p-3 sm:p-3.5 flex flex-col items-center justify-center gap-1.5 text-center transition-all ${
                          mythFactChoice === false
                            ? "zqp-papercut-selected border-rose-500 bg-rose-50/70"
                            : dragOverMythTarget === "myth"
                            ? "border-dashed border-2 border-rose-500 bg-rose-50 scale-105 shadow-md"
                            : "hover:border-rose-400"
                        }`}
                      >
                        <span className="w-8 h-8 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-sm zqp-papercut-tag">
                          ❌
                        </span>
                        <div>
                          <span className="font-bold text-xs text-rose-900 block">Mythos</span>
                          <span className="text-[10px] text-[#777]">Ein gefährlicher Irrtum</span>
                        </div>
                      </button>

                      {/* Fact Target */}
                      <button
                        type="button"
                        data-drop-myth-target="fact"
                        disabled={canAdvance}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.dataTransfer.dropEffect = "move";
                          setDragOverMythTarget("fact");
                        }}
                        onDragLeave={() => setDragOverMythTarget(null)}
                        onDrop={(e) => {
                          e.preventDefault();
                          setDragOverMythTarget(null);
                          handleSelectMythFact(true);
                        }}
                        onClick={() => {
                          if (!wasDraggingRef.current) handleSelectMythFact(true);
                        }}
                        className={`zqp-papercut-card p-3 sm:p-3.5 flex flex-col items-center justify-center gap-1.5 text-center transition-all ${
                          mythFactChoice === true
                            ? "zqp-papercut-selected border-emerald-500 bg-emerald-50/70"
                            : dragOverMythTarget === "fact"
                            ? "border-dashed border-2 border-emerald-500 bg-emerald-50 scale-105 shadow-md"
                            : "hover:border-emerald-400"
                        }`}
                      >
                        <span className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm zqp-papercut-tag">
                          💡
                        </span>
                        <div>
                          <span className="font-bold text-xs text-emerald-900 block">Fakt</span>
                          <span className="text-[10px] text-[#777]">Belegte Tatsache</span>
                        </div>
                      </button>
                    </div>
                  </div>
                )}

                {/* ==============================================================
                    4. BUCKET SORT STATION (DOS & DON'TS)
                    ============================================================== */}
                {currentStation.type === "bucket_sort" && currentStation.bucketSortItems && (
                  <div className="space-y-2">
                    {/* Two Trays */}
                    <div className="grid grid-cols-2 gap-2">
                      <div
                        data-drop-bucket="do"
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.dataTransfer.dropEffect = "move";
                          setDragOverBucket("do");
                        }}
                        onDragLeave={() => setDragOverBucket(null)}
                        onDrop={(e) => {
                          e.preventDefault();
                          setDragOverBucket(null);
                          const id = e.dataTransfer.getData("text/plain") || draggedBucketItemId;
                          if (id) handleAssignBucket(id, "do");
                        }}
                        className={`rounded-lg p-2 border transition-all ${
                          dragOverBucket === "do"
                            ? "border-dashed border-2 border-emerald-500 bg-emerald-50 scale-[1.02] shadow-md"
                            : "bg-[#edf7f4] border-emerald-300"
                        }`}
                      >
                        <span className="text-[10px] font-bold text-emerald-900 uppercase block mb-1">
                          🟢 Empfohlen (Do)
                        </span>
                        <div className="text-[10px] text-emerald-700 font-semibold">
                          {Object.values(bucketAssignments).filter((b) => b === "do").length} zugeordnet
                        </div>
                      </div>

                      <div
                        data-drop-bucket="dont"
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.dataTransfer.dropEffect = "move";
                          setDragOverBucket("dont");
                        }}
                        onDragLeave={() => setDragOverBucket(null)}
                        onDrop={(e) => {
                          e.preventDefault();
                          setDragOverBucket(null);
                          const id = e.dataTransfer.getData("text/plain") || draggedBucketItemId;
                          if (id) handleAssignBucket(id, "dont");
                        }}
                        className={`rounded-lg p-2 border transition-all ${
                          dragOverBucket === "dont"
                            ? "border-dashed border-2 border-rose-500 bg-rose-50 scale-[1.02] shadow-md"
                            : "bg-[#fdf2f2] border-rose-300"
                        }`}
                      >
                        <span className="text-[10px] font-bold text-rose-900 uppercase block mb-1">
                          🔴 Vermeiden (Don't)
                        </span>
                        <div className="text-[10px] text-rose-700 font-semibold">
                          {Object.values(bucketAssignments).filter((b) => b === "dont").length} zugeordnet
                        </div>
                      </div>
                    </div>

                    {/* Items to sort */}
                    <div className="space-y-1.5 pt-1">
                      {currentStation.bucketSortItems.map((item) => {
                        const assigned = bucketAssignments[item.id];
                        return (
                          <div
                            key={item.id}
                            style={{ touchAction: "none" }}
                            onPointerDown={(e) => {
                              if (!canAdvance) {
                                startPointerDrag(e, "bucket_sort", item.id, item.text);
                              }
                            }}
                            onDragStart={(e) => e.preventDefault()}
                            className={`zqp-papercut-card zqp-draggable select-none p-2 flex items-center justify-between text-xs transition-all ${
                              assigned === "do"
                                ? "border-emerald-400 bg-emerald-50/50"
                                : assigned === "dont"
                                ? "border-rose-400 bg-rose-50/50"
                                : ""
                            }`}
                          >
                            <span className="font-semibold text-[#3a352d] leading-tight pr-2">
                              {item.text}
                            </span>
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                disabled={canAdvance}
                                onClick={() => handleAssignBucket(item.id, "do")}
                                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                                  assigned === "do"
                                    ? "bg-emerald-600 text-white shadow-xs"
                                    : "bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-50"
                                }`}
                              >
                                Do ✓
                              </button>
                              <button
                                type="button"
                                disabled={canAdvance}
                                onClick={() => handleAssignBucket(item.id, "dont")}
                                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                                  assigned === "dont"
                                    ? "bg-rose-600 text-white shadow-xs"
                                    : "bg-white border border-rose-300 text-rose-800 hover:bg-rose-50"
                                }`}
                              >
                                Don't ✕
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ==============================================================
                    5. COMPARISON STATION (A/B SCENARIOS)
                    ============================================================== */}
                {currentStation.type === "comparison" && currentStation.comparisonScenarios && (
                  <div className="space-y-2">
                    <p className="text-[11px] text-[#6e6c70]">
                      Klicken Sie auf das Szenario, das die ZQP-Präventionskriterien erfüllt:
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {currentStation.comparisonScenarios.map((scen) => {
                        const isSelected = selectedScenarioId === scen.id;
                        return (
                          <div
                            key={scen.id}
                            onClick={() => !canAdvance && setSelectedScenarioId(scen.id)}
                            className={`zqp-papercut-card cursor-pointer p-2.5 sm:p-3 flex flex-col justify-between ${
                              isSelected ? "zqp-papercut-selected" : ""
                            } ${canAdvance ? "locked pointer-events-none" : ""}`}
                          >
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-bold text-xs text-[#1b5c53]">
                                  {scen.title}
                                </span>
                                <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded zqp-papercut-tag bg-[#faf8f5] text-[#554a3e] border-[#e2ddd5]">
                                  {scen.badge}
                                </span>
                              </div>
                              <p className="text-[11px] text-[#3a352d] leading-snug line-clamp-3">
                                {scen.description}
                              </p>
                            </div>
                            <div className="mt-2 pt-1 border-t border-[#ede8df] text-[10px] font-semibold text-[#1b5c53] flex justify-between items-center">
                              <span>{isSelected ? "Ausgewählt" : "Wählen"}</span>
                              <span className="w-3.5 h-3.5 rounded-full border-2 border-[#247a6d] flex items-center justify-center font-bold text-[9px]">
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
                    6. DILEMMA STATION
                    ============================================================== */}
                {currentStation.type === "dilemma" && currentStation.dilemmaReactions && (
                  <div className="space-y-2">
                    <p className="text-[11px] text-[#6e6c70]">
                      Wählen Sie die pädagogisch und pflegerisch optimalste Reaktion:
                    </p>
                    <div className="space-y-1.5">
                      {currentStation.dilemmaReactions.map((reaction) => {
                        const isSelected = selectedDilemmaId === reaction.id;
                        return (
                          <div
                            key={reaction.id}
                            onClick={() => handleSelectDilemma(reaction.id)}
                            className={`zqp-papercut-card p-2 sm:p-2.5 cursor-pointer flex items-start gap-2.5 transition-all ${
                              isSelected ? "zqp-papercut-selected" : ""
                            } ${canAdvance ? "locked pointer-events-none" : ""}`}
                          >
                            <span className="w-5 h-5 rounded-full border-2 border-[#247a6d] flex items-center justify-center font-bold text-[10px] text-[#1b5c53] shrink-0 mt-0.5">
                              {isSelected ? "✓" : ""}
                            </span>
                            <span className="text-xs font-semibold text-[#3a352d] leading-snug">
                              {reaction.text}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ==============================================================
                    7. CHECKLIST STATION
                    ============================================================== */}
                {currentStation.type === "checklist" && currentStation.checklistItems && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-[#6e6c70] bg-[#f2ede4] px-2.5 py-1 rounded-lg border border-[#e2ddd5]">
                      <span>Wählen Sie genau die 3 Kernmaßnahmen:</span>
                      <span className="font-bold text-[#1b5c53]">
                        {checkedItemIds.length} von 3 gewählt
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      {currentStation.checklistItems.map((item) => {
                        const isChecked = checkedItemIds.includes(item.id);
                        return (
                          <label
                            key={item.id}
                            onClick={(e) => {
                              e.preventDefault();
                              handleToggleChecklist(item.id);
                            }}
                            className={`zqp-papercut-card p-2 flex items-center gap-2.5 cursor-pointer transition-all ${
                              isChecked ? "zqp-papercut-selected" : ""
                            } ${canAdvance ? "locked pointer-events-none" : ""}`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              readOnly
                              className="w-4 h-4 text-[#247a6d] rounded focus:ring-[#247a6d]"
                            />
                            <span className="text-xs font-semibold text-[#3a352d] leading-snug">
                              {item.text}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ==============================================================
                    8. FILL IN THE BLANKS STATION
                    ============================================================== */}
                {currentStation.type === "fill_in_the_blank" && currentStation.fillInBlanks && (
                  <div className="space-y-3">
                    {/* Sentence with Blank slots */}
                    <div className="zqp-papercut-card p-3 sm:p-3.5 bg-white text-xs sm:text-sm font-semibold text-[#3a352d] leading-relaxed">
                      {(() => {
                        const parts = (currentStation.fillInSentence || "").split(/(\[BLANK_\d+\])/g);
                        return parts.map((part, pIdx) => {
                          const match = part.match(/\[(BLANK_\d+)\]/);
                          if (match) {
                            const blankId = match[1];
                            const currentWord = filledBlanks[blankId];
                            const isActive = activeBlankId === blankId;
                            const isOver = dragOverBlankId === blankId;
                            return (
                              <button
                                key={pIdx}
                                type="button"
                                data-drop-blank-id={blankId}
                                onDragOver={(e) => {
                                  e.preventDefault();
                                  e.dataTransfer.dropEffect = "move";
                                  setDragOverBlankId(blankId);
                                }}
                                onDragLeave={() => setDragOverBlankId(null)}
                                onDrop={(e) => {
                                  e.preventDefault();
                                  setDragOverBlankId(null);
                                  const word = e.dataTransfer.getData("text/plain") || draggedWord;
                                  if (word) handleAssignWordToBlank(blankId, word);
                                }}
                                onClick={() => {
                                  if (!wasDraggingRef.current) setActiveBlankId(blankId);
                                }}
                                className={`inline-flex items-center px-2 py-0.5 mx-1 rounded border font-bold transition-all ${
                                  currentWord
                                    ? "bg-[#edf7f4] border-[#247a6d] text-[#1b5c53]"
                                    : isActive || isOver
                                    ? "bg-amber-50 border-dashed border-2 border-amber-600 text-amber-900 animate-pulse"
                                    : "bg-gray-100 border-gray-300 text-gray-500"
                                }`}
                              >
                                {currentWord || "___"}
                              </button>
                            );
                          }
                          return <span key={pIdx}>{part}</span>;
                        });
                      })()}
                    </div>

                    {/* Word Pills to Drag or Tap */}
                    <div>
                      <span className="text-[10px] text-[#6e6c70] block mb-1">
                        Wortbausteine (🖐️ Ziehen oder Antippen):
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {Array.from(
                          new Set(currentStation.fillInBlanks.flatMap((b) => b.options))
                        ).map((word, wIdx) => {
                          const isUsed = Object.values(filledBlanks).includes(word);
                          return (
                            <button
                              key={wIdx}
                              style={{ touchAction: "none" }}
                              onPointerDown={(e) => {
                                if (!canAdvance && !isUsed) {
                                  startPointerDrag(e, "fill_in_the_blank", word, word);
                                }
                              }}
                              onDragStart={(e) => e.preventDefault()}
                              onClick={() => {
                                if (!wasDraggingRef.current && activeBlankId) {
                                  handleAssignWordToBlank(activeBlankId, word);
                                }
                              }}
                              className={`px-3 py-1.5 rounded-lg zqp-papercut-card zqp-draggable select-none text-xs font-bold transition-all ${
                                isUsed
                                  ? "opacity-40 border-gray-300 bg-gray-100 cursor-default"
                                  : "text-[#1b5c53] hover:border-[#247a6d]"
                              }`}
                            >
                              {word}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* ==============================================================
                    9. SINGLE CHOICE STATION
                    ============================================================== */}
                {currentStation.type === "single_choice" && currentStation.options && (
                  <div className="space-y-2">
                    <div className="space-y-1.5">
                      {currentStation.options.map((opt, idx) => {
                        const isSelected = selectedOptionIdx === idx;
                        return (
                          <label
                            key={idx}
                            className={`zqp-papercut-card flex items-start gap-2.5 p-2 sm:p-2.5 cursor-pointer ${
                              isSelected ? "zqp-papercut-selected" : ""
                            } ${canAdvance ? "locked pointer-events-none" : ""}`}
                          >
                            <input
                              type="radio"
                              name="sc-option"
                              disabled={canAdvance}
                              checked={isSelected}
                              onChange={() => setSelectedOptionIdx(idx)}
                              className="mt-0.5 text-[#247a6d] focus:ring-[#247a6d]"
                            />
                            <span className="text-xs font-medium text-[#3a352d] leading-snug">
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

            {/* Completed Score & Evaluation View */}
            {completed && (
              <div className="h-full flex flex-col items-center justify-center text-center p-2 sm:p-3">
                {(() => {
                  const solvedCount = Object.values(stationResults).filter((v) => v === "solved").length;
                  const totalCount = quiz.stations.length;
                  const percentage = totalCount > 0 ? Math.round((solvedCount / totalCount) * 100) : 0;

                  let headline = "Praxistest abgeschlossen";
                  let subtext = `Sie haben ${solvedCount} von ${totalCount} Stationen erfolgreich gelöst (${percentage}%).`;
                  let badgeBg = "bg-teal-50 text-[#1b5c53] border-teal-300";
                  let iconBg = "bg-[#e3eeec] border-[#247a6d]";
                  let iconColor = "text-[#247a6d]";

                  if (solvedCount === totalCount) {
                    headline = "Hervorragend! Alle Aufgaben gelöst";
                    subtext = `Perfektes Ergebnis: Alle ${totalCount} Stationen eigenständig gemeistert (100%).`;
                    badgeBg = "bg-emerald-50 text-emerald-800 border-emerald-300";
                    iconBg = "bg-emerald-50 border-emerald-600";
                    iconColor = "text-emerald-700";
                  } else if (solvedCount >= Math.ceil(totalCount * 0.6)) {
                    headline = "Gutes Ergebnis im Praxistest";
                    subtext = `Solide Leistung: ${solvedCount} von ${totalCount} Stationen eigenständig gelöst (${percentage}%).`;
                    badgeBg = "bg-teal-50 text-[#1b5c53] border-[#247a6d]/40";
                    iconBg = "bg-[#e3eeec] border-[#247a6d]";
                    iconColor = "text-[#247a6d]";
                  } else if (solvedCount > 0) {
                    headline = "Praxistest abgeschlossen";
                    subtext = `${solvedCount} von ${totalCount} Stationen gelöst (${percentage}%). Nutzen Sie die ZQP-Erklärungen zur Vertiefung.`;
                    badgeBg = "bg-amber-50 text-amber-900 border-amber-300";
                    iconBg = "bg-amber-50 border-amber-500";
                    iconColor = "text-amber-700";
                  } else {
                    headline = "Praxistest durchlaufen";
                    subtext = `Keine Station eigenständig gelöst. Wiederholen Sie das Training, um die ZQP-Leitlinien zu festigen.`;
                    badgeBg = "bg-stone-50 text-stone-800 border-stone-300";
                    iconBg = "bg-stone-100 border-stone-400";
                    iconColor = "text-stone-600";
                  }

                  return (
                    <div className="w-full max-w-lg flex flex-col items-center">
                      <div className={`w-9 h-9 rounded-full ${iconBg} border-2 flex items-center justify-center mb-1 shadow-xs`}>
                        <Award className={`w-5 h-5 ${iconColor}`} />
                      </div>
                      <h3 className="text-sm sm:text-base font-bold text-[#1b5c53] mb-0.5 leading-tight">
                        {headline}
                      </h3>
                      <p className="text-[11px] text-[#6e6c70] mb-2 leading-tight px-2">
                        {subtext}
                      </p>

                      {/* Score & Evaluation Box (2 Columns for compact fit) */}
                      <div className="bg-[#f3f8f7] border border-[#bbd1cd] p-2 sm:p-2.5 rounded-xl text-left text-xs text-[#444] w-full shadow-xs">
                        <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-[#bbd1cd]/50">
                          <span className="font-bold text-[#1b5c53] text-xs">Ihr Praxistest-Ergebnis:</span>
                          <span className={`font-bold px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] border ${badgeBg}`}>
                            {solvedCount} von {totalCount} gelöst ({percentage}%)
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-x-2 gap-y-1 max-h-[170px] overflow-y-auto zqp-scrollbar pr-0.5">
                          {quiz.stations.map((st, sIdx) => {
                            const isSolved = stationResults[sIdx] === "solved";
                            return (
                              <div
                                key={st.id || sIdx}
                                className="flex items-center justify-between text-[10px] sm:text-[11px] px-2 py-1 rounded bg-white/85 border border-[#e2ddd5]"
                              >
                                <span className="truncate pr-1.5 font-medium text-[#3a352d]" title={st.title}>
                                  <span className="font-bold text-[#1b5c53] mr-1">#{sIdx + 1}</span>
                                  {st.title.replace(/^Station \d+:\s*/, "")}
                                </span>
                                <span
                                  className={`font-semibold shrink-0 px-1.5 py-0.2 rounded text-[9px] ${
                                    isSolved
                                      ? "bg-emerald-100 text-emerald-800 font-bold"
                                      : "bg-amber-100 text-amber-900 border border-amber-200"
                                  }`}
                                >
                                  {isSolved ? "Gelöst ✓" : "Nicht gelöst"}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mt-2.5 flex-wrap justify-center">
                        <button
                          onClick={handleReset}
                          className="px-4 py-1.5 rounded-lg bg-[#247a6d] hover:bg-[#1b5c53] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Praxistest wiederholen</span>
                        </button>
                        {quiz.enablePrintSummary && (
                          <button
                            onClick={() => window.print()}
                            className="px-3.5 py-1.5 rounded-lg bg-white border border-[#bbd1cd] hover:border-[#247a6d] text-[#1b5c53] hover:bg-[#f3f8f7] text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                            title="Ergebnis und Merkzettel drucken oder als PDF speichern"
                          >
                            <Printer className="w-3.5 h-3.5 text-[#247a6d]" />
                            <span>Ergebnis als PDF drucken</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>

          {/* 3. PERMANENT COPYRIGHT FOOTER */}
          <div className="bg-[#f3f8f7] border-t border-[#bbd1cd]/60 px-3 py-1 text-center text-[10px] text-[#6e6c70] font-medium shrink-0">
            Stiftung Zentrum für Qualität in der Pflege • {new Date().getFullYear()}
          </div>

          {/* 4. FIXED ACTION FOOTER */}
          <footer className="bg-white border-t border-[#bbd1cd] px-3 py-2 sm:px-4 sm:py-2.5 flex items-center justify-between gap-2 shrink-0">
            {completed ? (
              <div className="flex items-center justify-between w-full">
                <div className="text-[11px] text-[#6e6c70] font-medium flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-[#247a6d]" />
                  <span>Praxistest vollständig abgeschlossen</span>
                </div>
                <div className="flex items-center gap-2">
                  {quiz.enablePrintSummary && (
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-white border border-[#bbd1cd] text-[#1b5c53] hover:bg-[#f3f8f7] shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Ergebnis drucken oder als PDF sichern"
                    >
                      <Printer className="w-3.5 h-3.5 text-[#247a6d]" />
                      <span>Als PDF drucken</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleReset}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#247a6d] hover:bg-[#1b5c53] text-white shadow-sm flex items-center gap-1 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Test neu starten</span>
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleRevealSolution}
                    disabled={canAdvance || completed}
                    className="text-[11px] font-semibold px-2.5 py-1.5 rounded-lg border border-[#bbd1cd] text-[#1b5c53] hover:bg-[#f3f8f7] flex items-center gap-1 disabled:opacity-40 transition-colors"
                    title="Lösung für diese Station aufdecken"
                  >
                    <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
                    <span>Lösung anzeigen</span>
                  </button>

                  {/* Drawer reopen toggle button if drawer was closed */}
                  {feedback && !isDrawerOpen && (
                    <button
                      type="button"
                      onClick={() => setIsDrawerOpen(true)}
                      className="text-[11px] font-semibold px-2.5 py-1.5 rounded-lg bg-[#e3eeec] text-[#1b5c53] hover:bg-[#bbd1cd] flex items-center gap-1 transition-colors"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-[#247a6d]" />
                      <span>Erklärung ansehen</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {currentStation?.type === "ordering" && !canAdvance && (
                    <button
                      type="button"
                      onClick={handleCheckOrder}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#247a6d] hover:bg-[#1b5c53] text-white shadow-sm transition-colors"
                    >
                      Reihenfolge prüfen
                    </button>
                  )}

                  {currentStation?.type === "comparison" && !canAdvance && (
                    <button
                      type="button"
                      disabled={!selectedScenarioId}
                      onClick={handleCheckComparison}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#247a6d] hover:bg-[#1b5c53] text-white shadow-sm disabled:opacity-40 transition-colors"
                    >
                      Szenario prüfen
                    </button>
                  )}

                  {currentStation?.type === "checklist" && !canAdvance && (
                    <button
                      type="button"
                      disabled={checkedItemIds.length !== 3}
                      onClick={handleCheckChecklist}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#247a6d] hover:bg-[#1b5c53] text-white shadow-sm disabled:opacity-40 transition-colors"
                    >
                      Checkliste prüfen
                    </button>
                  )}

                  {currentStation?.type === "fill_in_the_blank" && !canAdvance && (
                    <button
                      type="button"
                      disabled={Object.keys(filledBlanks).length < (currentStation.fillInBlanks?.length || 2)}
                      onClick={handleCheckFillIn}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#247a6d] hover:bg-[#1b5c53] text-white shadow-sm disabled:opacity-40 transition-colors"
                    >
                      Lösung prüfen
                    </button>
                  )}

                  {currentStation?.type === "single_choice" && !canAdvance && (
                    <button
                      type="button"
                      disabled={selectedOptionIdx === null}
                      onClick={handleCheckChoice}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#247a6d] hover:bg-[#1b5c53] text-white shadow-sm disabled:opacity-40 transition-colors"
                    >
                      Antwort prüfen
                    </button>
                  )}

                  {/* Skip to next station without solving (Editorial shortcut) */}
                  {!canAdvance && (
                    <button
                      type="button"
                      onClick={handleNextStation}
                      className="text-xs font-semibold text-[#6e6c70] hover:text-[#1b5c53] hover:underline px-2 py-1.5 transition-colors cursor-pointer"
                      title="Als Redakteur direkt zur nächsten Station springen ohne die Aufgabe zu lösen"
                    >
                      Station überspringen →
                    </button>
                  )}

                  {/* Next station button */}
                  <button
                    type="button"
                    onClick={handleNextStation}
                    disabled={!canAdvance}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#247a6d] hover:bg-[#1b5c53] text-white shadow-sm disabled:opacity-40 flex items-center gap-1 transition-colors"
                  >
                    <span>
                      {currentStationIdx === quiz.stations.length - 1
                        ? "Zur Gesamtauswertung"
                        : "Nächste Station"}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </>
            )}
          </footer>

          {/* 5. SLIDE-UP DRAWER (OVERLAY WITHIN FIXED CONTAINER) */}
          <div
            className={`absolute inset-x-0 bottom-0 max-h-[82%] bg-[#fdfcf9] border-t-2 border-[#247a6d] shadow-2xl transition-transform duration-300 ease-out z-20 flex flex-col ${
              isDrawerOpen && feedback ? "translate-y-0" : "translate-y-full"
            }`}
          >
            {/* Drawer Header */}
            <div className="bg-[#f2ede4] border-b border-[#bbd1cd] px-4 py-2 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                {feedback?.type === "correct" ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : feedback?.type === "revealed" ? (
                  <Lightbulb className="w-4 h-4 text-amber-600" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-600" />
                )}
                <span className="text-xs font-bold text-[#1b5c53]">
                  {feedback?.title}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                className="text-[11px] font-bold text-[#6e6c70] hover:text-[#1b5c53] px-2 py-0.5 rounded hover:bg-[#e3eeec] transition-colors"
                title="Erklärung schließen und Spielfeld betrachten"
              >
                Ansicht ansehen ✕
              </button>
            </div>

            {/* Drawer Content */}
            <div className="p-3 sm:p-4 text-xs text-[#444] space-y-2.5 flex-1 min-h-0 overflow-y-auto zqp-scrollbar">
              <div className="bg-[#faf8f5] p-2.5 rounded-lg border border-[#e2ddd5]">
                <span className="font-bold text-[#1b5c53] block text-[11px] mb-0.5">
                  Warum richtig / Warum falsch:
                </span>
                <p className="text-[11px] leading-relaxed text-[#3a352d]">
                  {feedback?.selectionExplanation}
                </p>
              </div>

              <div className="bg-[#edf7f4] p-2.5 rounded-lg border border-[#bbd1cd]">
                <span className="font-bold text-[#1b5c53] block text-[11px] mb-0.5">
                  ZQP-Praxiswissen:
                </span>
                <p className="text-[11px] leading-relaxed text-[#1b5c53]">
                  {feedback?.zqpBackground}
                </p>
              </div>
            </div>

            {/* Drawer Actions */}
            <div className="bg-white border-t border-[#bbd1cd] p-2.5 flex items-center justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={handleNextStation}
                disabled={!canAdvance}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#247a6d] hover:bg-[#1b5c53] text-white shadow-sm disabled:opacity-40 flex items-center gap-1 transition-colors"
              >
                <span>
                  {currentStationIdx === quiz.stations.length - 1
                    ? "Zur Gesamtauswertung"
                    : "Nächste Station"}
                </span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Ghost Element during Pointer Drag */}
      {pointerDrag?.isDragging && (
        <div
          className="fixed pointer-events-none z-[99999] shadow-2xl rounded-xl border-2 border-[#247a6d] bg-white/95 px-3 py-2 text-xs font-bold text-[#1b5c53] flex items-center gap-2 transform -translate-x-1/2 -translate-y-1/2 rotate-2 scale-105 transition-none select-none"
          style={{
            left: `${pointerDrag.currentX}px`,
            top: `${pointerDrag.currentY}px`,
          }}
        >
          <span className="text-sm">🖐️</span>
          <span className="truncate max-w-[220px]">{pointerDrag.label}</span>
        </div>
      )}
    </div>
  );
};
