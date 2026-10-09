import React, { useState, useEffect, useMemo } from "react";
import { Header } from "./components/Header";
import { PromptInput } from "./components/PromptInput";
import { QuizRefiner } from "./components/QuizRefiner";
import { QuizPreview } from "./components/QuizPreview";
import { CodeExport } from "./components/CodeExport";
import { SettingsModal } from "./components/SettingsModal";
import { ProjectLibraryModal } from "./components/ProjectLibraryModal";
import { QualityAuditModal } from "./components/QualityAuditModal";
import { StationEditorModal } from "./components/StationEditorModal";
import { SourceInspectorModal } from "./components/SourceInspectorModal";
import { FavoritesLibraryModal } from "./components/FavoritesLibraryModal";
import { AppSettings, QuizGenerationResult, TargetAudience, StationType, EditorialStatus, QuizStation } from "./types";
import { loadSettings, saveSettings, generateQuizWithGemini, refineQuizWithGemini } from "./services/geminiService";
import { compileQuizToBundle } from "./services/exportCompiler";
import {
  QuizProject,
  loadProjects,
  createNewProject,
  updateProjectHistory,
  updateProjectMetadata,
  getActiveProjectId,
  setActiveProjectId,
  importProjectFromJson,
  stripCompiledBundle,
} from "./services/projectStorage";
import { Eye, Code2, Sparkles, PlusCircle } from "lucide-react";

const DRAFT_STORAGE_KEY = "zqp_quiz_generator_draft_v1";

interface SavedQuizDraft {
  history: QuizGenerationResult[];
  index: number;
}

function loadInitialDraft(): SavedQuizDraft | null {
  try {
    const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.history) && parsed.history.length > 0 && typeof parsed.index === "number") {
      return parsed;
    }
  } catch (err) {
    console.warn("Fehler beim Laden des Quiz-Entwurfs:", err);
  }
  return null;
}

export const App: React.FC = () => {
  const [settings, setSettings] = useState<AppSettings>(loadSettings);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isLibraryOpen, setIsLibraryOpen] = useState<boolean>(false);
  const [isAuditOpen, setIsAuditOpen] = useState<boolean>(false);
  const [isStationEditorOpen, setIsStationEditorOpen] = useState<boolean>(false);
  const [stationEditorIndex, setStationEditorIndex] = useState<number>(0);
  const [isSourceInspectorOpen, setIsSourceInspectorOpen] = useState<boolean>(false);
  const [isFavoritesLibraryOpen, setIsFavoritesLibraryOpen] = useState<boolean>(false);

  const [activeMainTab, setActiveMainTab] = useState<"preview" | "code">("preview");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingStepText, setLoadingStepText] = useState<string>("");

  // Project ID & history state
  const [activeProjectId, setActiveProjId] = useState<string | null>(getActiveProjectId);

  const [quizHistory, setQuizHistory] = useState<QuizGenerationResult[]>(() => {
    const projects = loadProjects();
    const currentId = getActiveProjectId();
    const matchingProj = projects.find((p) => p.id === currentId);
    if (matchingProj && matchingProj.history.length > 0) {
      return matchingProj.history;
    }
    const draft = loadInitialDraft();
    return draft?.history || [];
  });

  const [historyIndex, setHistoryIndex] = useState<number>(() => {
    const projects = loadProjects();
    const currentId = getActiveProjectId();
    const matchingProj = projects.find((p) => p.id === currentId);
    if (matchingProj && typeof matchingProj.currentIndex === "number") {
      return matchingProj.currentIndex;
    }
    const draft = loadInitialDraft();
    return draft ? draft.index : -1;
  });

  const rawCurrentQuiz: QuizGenerationResult | null = historyIndex >= 0 ? quizHistory[historyIndex] : null;

  // Ensure currentQuiz always has a compiled code bundle hydrated
  const currentQuiz = useMemo(() => {
    if (!rawCurrentQuiz) return null;
    if (!rawCurrentQuiz.generatedHtml || !rawCurrentQuiz.generatedCss || !rawCurrentQuiz.generatedJs) {
      const bundle = compileQuizToBundle(rawCurrentQuiz);
      return {
        ...rawCurrentQuiz,
        generatedHtml: bundle.html,
        generatedCss: bundle.css,
        generatedJs: bundle.js,
        tailwindConfig: bundle.tailwindConfig,
      };
    }
    return rawCurrentQuiz;
  }, [rawCurrentQuiz]);

  // Mode in left column: create new from scratch vs. refine existing (always start on 'create' / Neues Thema)
  const [leftPanelMode, setLeftPanelMode] = useState<"create" | "refine">("create");

  // Save compact current quiz history to localStorage & active project whenever it changes
  useEffect(() => {
    if (quizHistory.length > 0 && historyIndex >= 0) {
      try {
        const compactHistory = quizHistory.map(stripCompiledBundle);
        localStorage.setItem(
          DRAFT_STORAGE_KEY,
          JSON.stringify({ history: compactHistory, index: historyIndex })
        );
      } catch (err) {
        console.warn("Konnte Entwurf nicht in localStorage speichern:", err);
      }

      if (activeProjectId) {
        updateProjectHistory(activeProjectId, quizHistory, historyIndex);
      }
    }
  }, [quizHistory, historyIndex, activeProjectId]);

  // Listen for storage quota warnings
  useEffect(() => {
    const handleStorageQuota = (e: any) => {
      alert(`Speicher-Warnung: ${e?.detail?.message || "Lokaler Speicher ist voll."}`);
    };
    window.addEventListener("zqp_storage_quota_exceeded", handleStorageQuota);
    return () => window.removeEventListener("zqp_storage_quota_exceeded", handleStorageQuota);
  }, []);

  // Global Keyboard Shortcuts (Escape to close modals, Ctrl+Z Undo, Ctrl+Y Redo)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. ESC closes open modal
      if (e.key === "Escape") {
        if (isStationEditorOpen) { setIsStationEditorOpen(false); return; }
        if (isSourceInspectorOpen) { setIsSourceInspectorOpen(false); return; }
        if (isFavoritesLibraryOpen) { setIsFavoritesLibraryOpen(false); return; }
        if (isAuditOpen) { setIsAuditOpen(false); return; }
        if (isLibraryOpen) { setIsLibraryOpen(false); return; }
        if (isSettingsOpen) { setIsSettingsOpen(false); return; }
      }

      // Skip Undo/Redo if typing inside an input/textarea
      const target = e.target as HTMLElement | null;
      const isInput = target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);
      if (isInput) return;

      // 2. Undo: Ctrl+Z or Cmd+Z
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && (e.key === "z" || e.key === "Z")) {
        e.preventDefault();
        handleUndo();
      }

      // 3. Redo: Ctrl+Y or Cmd+Shift+Z or Ctrl+Shift+Z
      if (
        ((e.ctrlKey || e.metaKey) && (e.key === "y" || e.key === "Y")) ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === "z" || e.key === "Z"))
      ) {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    isStationEditorOpen,
    isSourceInspectorOpen,
    isFavoritesLibraryOpen,
    isAuditOpen,
    isLibraryOpen,
    isSettingsOpen,
    historyIndex,
    quizHistory.length,
  ]);

  const handleSaveSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  // Full creation from scratch
  const handleGenerateNewQuiz = async (
    params: {
      topicPrompt: string;
      referenceText: string;
      questionCount: number;
      targetAudience: TargetAudience;
      mechanics: StationType[];
    },
    autoSwitchToRefine: boolean = true
  ) => {
    // Check if API key is missing
    if (!settings.geminiApiKey || settings.geminiApiKey.trim() === "") {
      const openSettings = confirm(
        "Hinweis: Sie haben in den Einstellungen noch keinen Google Gemini API-Schlüssel hinterlegt.\n\n" +
        "Ohne API-Schlüssel kann keine echte KI aufgerufen werden; es wird stattdessen das vorprogrammierte Offline-Demo-Quiz geladen.\n\n" +
        "Möchten Sie jetzt die Einstellungen öffnen, um Ihren API-Schlüssel einzutragen?\n\n" +
        "[OK] = Einstellungen öffnen\n" +
        "[Abbrechen] = Weiter im Offline-Demo-Modus"
      );
      if (openSettings) {
        setIsSettingsOpen(true);
        return;
      }
    }

    setIsLoading(true);
    setLoadingStepText("Gemini API wird kontaktiert...");

    const stepTimer1 = setTimeout(() => {
      setLoadingStepText("Interaktive Stationen & Logik werden aufgebaut...");
    }, 1200);

    const stepTimer2 = setTimeout(() => {
      setLoadingStepText("Barrierefreiheit & ZQP-Farbkontraste prüfen...");
    }, 2200);

    try {
      const quiz = await generateQuizWithGemini({
        apiKey: settings.geminiApiKey,
        model: settings.selectedModel,
        editorialRules: settings.editorialRules,
        glossary: settings.glossary,
        ...params,
      });

      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);

      // Create new project in library
      const proj = createNewProject(quiz, {
        referenceSourceText: params.referenceText,
        editorialStatus: "draft",
      });
      setActiveProjId(proj.id);
      setActiveProjectId(proj.id);

      // Add to history
      const newHistory = [quiz];
      setQuizHistory(newHistory);
      setHistoryIndex(0);
      if (autoSwitchToRefine) {
        setLeftPanelMode("refine");
      }
      setActiveMainTab("preview");
    } catch (err: any) {
      alert(`Fehler bei der Generierung: ${err?.message || "Unbekannter Fehler"}`);
    } finally {
      setIsLoading(false);
      setLoadingStepText("");
    }
  };

  // Targeted prompt-based refinement
  const handleRefineQuiz = async (refinementPrompt: string) => {
    if (!currentQuiz) return;

    if (!settings.geminiApiKey || settings.geminiApiKey.trim() === "") {
      alert(
        "Für KI-Verfeinerungen ist ein Google Gemini API-Schlüssel erforderlich.\n\n" +
        "Bitte tragen Sie Ihren API-Schlüssel unter 'Einstellungen' ein, um Quizze und Erklärungen gezielt mit der KI anzupassen."
      );
      setIsSettingsOpen(true);
      return;
    }

    setIsLoading(true);
    setLoadingStepText("Wende gezielte Anpassung mit Gemini an...");

    const stepTimer = setTimeout(() => {
      setLoadingStepText("Passe betroffene Stationen an & behalte Rest bei...");
    }, 1200);

    try {
      const updatedQuiz = await refineQuizWithGemini({
        apiKey: settings.geminiApiKey,
        model: settings.selectedModel,
        existingQuiz: currentQuiz,
        refinementPrompt,
        editorialRules: settings.editorialRules,
        glossary: settings.glossary,
      });

      clearTimeout(stepTimer);

      // Push new version to history
      const newHistory = [...quizHistory.slice(0, historyIndex + 1), updatedQuiz];
      setQuizHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
      setActiveMainTab("preview");
    } catch (err: any) {
      alert(`Fehler bei der Anpassung: ${err?.message || "Unbekannter Fehler"}`);
    } finally {
      setIsLoading(false);
      setLoadingStepText("");
    }
  };

  // Direct WYSIWYG Station Edit Save
  const handleSaveStationEdit = (updatedQuiz: QuizGenerationResult) => {
    const newHistory = [...quizHistory.slice(0, historyIndex + 1), updatedQuiz];
    setQuizHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  // Editorial status change
  const handleChangeEditorialStatus = (status: EditorialStatus) => {
    if (!currentQuiz) return;
    const updatedQuiz: QuizGenerationResult = {
      ...currentQuiz,
      editorialStatus: status,
    };
    handleSaveStationEdit(updatedQuiz);
    if (activeProjectId) {
      updateProjectMetadata(activeProjectId, { editorialStatus: status });
    }
  };

  // Attach verified quote to a specific station
  const handleUpdateStationQuote = (stationIndex: number, quote: string) => {
    if (!currentQuiz || !currentQuiz.stations[stationIndex]) return;
    const newStations = [...currentQuiz.stations];
    newStations[stationIndex] = {
      ...newStations[stationIndex],
      sourceQuote: quote,
    };
    const updatedQuiz: QuizGenerationResult = {
      ...currentQuiz,
      stations: newStations,
    };
    handleSaveStationEdit(updatedQuiz);
  };

  // Update reference text for current quiz
  const handleUpdateReferenceText = (newRefText: string) => {
    if (!currentQuiz) return;
    const updatedQuiz: QuizGenerationResult = {
      ...currentQuiz,
      referenceSourceText: newRefText,
    };
    handleSaveStationEdit(updatedQuiz);
    if (activeProjectId) {
      updateProjectMetadata(activeProjectId, { referenceSourceText: newRefText });
    }
  };

  // Insert favorite station from treasure chest into current quiz
  const handleInsertFavoriteStation = (favStation: QuizStation) => {
    if (!currentQuiz) return;
    const newStation: QuizStation = {
      ...favStation,
      id: "station-" + Date.now(),
    };
    const updatedQuiz: QuizGenerationResult = {
      ...currentQuiz,
      stations: [...currentQuiz.stations, newStation],
    };
    handleSaveStationEdit(updatedQuiz);
  };

  // Global Drag & Drop listener for .zqpquiz and .json files
  useEffect(() => {
    const handleDragOver = (e: DragEvent) => e.preventDefault();
    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer?.files?.[0];
      if (file && (file.name.endsWith(".zqpquiz") || file.name.endsWith(".json"))) {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const content = event.target?.result as string;
            const imported = importProjectFromJson(content);
            handleSelectProject(imported);
          } catch (err: any) {
            alert("Fehler beim Öffnen der Projektdatei: " + (err?.message || "Ungültiges Format"));
          }
        };
        reader.readAsText(file);
      }
    };

    window.addEventListener("dragover", handleDragOver);
    window.addEventListener("drop", handleDrop);
    return () => {
      window.removeEventListener("dragover", handleDragOver);
      window.removeEventListener("drop", handleDrop);
    };
  }, []);

  // Optional Print/PDF toggle for web visitors
  const handleTogglePrintSummary = (enabled: boolean) => {
    if (!currentQuiz) return;
    const updatedQuiz: QuizGenerationResult = {
      ...currentQuiz,
      enablePrintSummary: enabled,
    };
    handleSaveStationEdit(updatedQuiz);
  };

  // Undo / Redo
  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
    }
  };

  const handleRedo = () => {
    if (historyIndex < quizHistory.length - 1) {
      setHistoryIndex(historyIndex + 1);
    }
  };

  // Library project selection
  const handleSelectProject = (proj: QuizProject) => {
    setActiveProjId(proj.id);
    setActiveProjectId(proj.id);
    setQuizHistory(proj.history);
    setHistoryIndex(proj.currentIndex);
    setLeftPanelMode("refine");
    setActiveMainTab("preview");
  };

  const handleStartFreshProject = () => {
    setActiveProjId(null);
    setActiveProjectId(null);
    setQuizHistory([]);
    setHistoryIndex(-1);
    setLeftPanelMode("create");
    try {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
    } catch {}
  };

  return (
    <div className="h-screen flex flex-col bg-[#f5f8f7] text-[#444444] overflow-hidden">
      {/* Header (Schlank & Fokussiert) */}
      <Header
        settings={settings}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenLibrary={() => setIsLibraryOpen(true)}
      />

      {/* Main Two-Column Content (Viewport-Fitted, Aligned Grid) */}
      <main className="flex-1 max-w-[1800px] w-full mx-auto p-3 md:p-4 grid grid-cols-1 lg:grid-cols-12 gap-3.5 min-h-0 overflow-hidden">
        {/* Left Column: Input, Customization & Refinement (5 cols) */}
        <div className="lg:col-span-5 flex flex-col min-h-0 bg-white rounded-xl border border-[#bbd1cd] shadow-2xs overflow-hidden">
          {/* Mode Switcher Tab Header (Aligned with Right Column) */}
          <div className="bg-[#f3f8f7] border-b border-[#bbd1cd] px-3.5 pt-2 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setLeftPanelMode("create")}
                className={`px-3 py-1.5 font-semibold text-xs rounded-t-lg flex items-center gap-1.5 transition-colors cursor-pointer ${
                  leftPanelMode === "create"
                    ? "bg-white border-t border-x border-[#bbd1cd] text-[#1b5c53] shadow-2xs"
                    : "text-[#6e6c70] hover:text-[#1b5c53]"
                }`}
              >
                <PlusCircle className="w-3.5 h-3.5 text-[#247a6d]" />
                <span>1. Neues Thema</span>
              </button>

              <button
                type="button"
                onClick={() => currentQuiz && setLeftPanelMode("refine")}
                disabled={!currentQuiz}
                className={`px-3 py-1.5 font-semibold text-xs rounded-t-lg flex items-center gap-1.5 transition-colors ${
                  leftPanelMode === "refine"
                    ? "bg-white border-t border-x border-[#bbd1cd] text-[#1b5c53] shadow-2xs cursor-pointer"
                    : currentQuiz
                    ? "text-[#6e6c70] hover:text-[#1b5c53] cursor-pointer"
                    : "text-gray-400 opacity-40 cursor-not-allowed"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-[#247a6d]" />
                <span>2. Quiz verfeinern</span>
              </button>
            </div>

            <span className="text-[11px] text-[#6e6c70] hidden sm:inline font-medium">
              {leftPanelMode === "create" ? "Themenwahl & Vorlagen" : "KI-Anpassung"}
            </span>
          </div>

          {/* Left Panel Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-3.5 bg-[#fcfaf8]">
            {leftPanelMode === "refine" && currentQuiz ? (
              <QuizRefiner
                currentQuiz={currentQuiz}
                onRefine={handleRefineQuiz}
                isLoading={isLoading}
                loadingStepText={loadingStepText}
                canUndo={historyIndex > 0}
                canRedo={historyIndex < quizHistory.length - 1}
                onUndo={handleUndo}
                onRedo={handleRedo}
                versionInfo={`Revision ${historyIndex + 1} von ${quizHistory.length}`}
                onSwitchToNewQuiz={() => setLeftPanelMode("create")}
              />
            ) : (
              <PromptInput
                onGenerate={handleGenerateNewQuiz}
                isLoading={isLoading}
                loadingStepText={loadingStepText}
              />
            )}
          </div>
        </div>

        {/* Right Column: Preview & Code Export (7 cols) */}
        <div className="lg:col-span-7 flex flex-col min-h-0 bg-white rounded-xl border border-[#bbd1cd] shadow-2xs overflow-hidden">
          {/* Tab Navigation Header (Matched with Left Column) */}
          <div className="bg-[#f3f8f7] border-b border-[#bbd1cd] px-3.5 pt-2 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setActiveMainTab("preview")}
                className={`px-3 py-1.5 font-semibold text-xs rounded-t-lg flex items-center gap-1.5 transition-colors cursor-pointer ${
                  activeMainTab === "preview"
                    ? "bg-white border-t border-x border-[#bbd1cd] text-[#1b5c53] shadow-2xs"
                    : "text-[#6e6c70] hover:text-[#1b5c53]"
                }`}
              >
                <Eye className="w-3.5 h-3.5 text-[#247a6d]" />
                <span>Interaktive Vorschau</span>
              </button>

              <button
                onClick={() => setActiveMainTab("code")}
                className={`px-3 py-1.5 font-semibold text-xs rounded-t-lg flex items-center gap-1.5 transition-colors cursor-pointer ${
                  activeMainTab === "code"
                    ? "bg-white border-t border-x border-[#bbd1cd] text-[#1b5c53] shadow-2xs"
                    : "text-[#6e6c70] hover:text-[#1b5c53]"
                }`}
              >
                <Code2 className="w-3.5 h-3.5 text-[#247a6d]" />
                <span>Code-Export (HTML, CSS, JS)</span>
              </button>
            </div>

            {/* Persistence & Revision Indicator */}
            <div className="flex items-center gap-2">
              {quizHistory.length > 0 && (
                <span className="text-[11px] text-[#247a6d] bg-white px-2 py-0.5 rounded border border-[#bbd1cd] hidden sm:inline-flex items-center gap-1 font-medium shadow-2xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Gesichert
                </span>
              )}
              {quizHistory.length > 1 && (
                <span
                  className="text-[11px] text-[#1b5c53] bg-white px-2 py-0.5 rounded border border-[#bbd1cd] font-semibold shadow-2xs"
                  title={`Aktueller Bearbeitungsstand: Revision ${historyIndex + 1} von ${quizHistory.length}`}
                >
                  Revision {historyIndex + 1}
                </span>
              )}
            </div>
          </div>

          {/* Right Tab Content Panels */}
          <div className="p-3.5 bg-[#fcfaf8] flex-1 flex flex-col min-h-0 overflow-y-auto">

              {currentQuiz ? (
                activeMainTab === "preview" ? (
                  <QuizPreview
                    quiz={currentQuiz}
                    onReset={() => {
                      // reset handled in component
                    }}
                    onEditStation={(idx) => {
                      setStationEditorIndex(idx);
                      setIsStationEditorOpen(true);
                    }}
                    editorialStatus={currentQuiz.editorialStatus || "draft"}
                    onChangeStatus={handleChangeEditorialStatus}
                    onOpenSourceInspector={() => setIsSourceInspectorOpen(true)}
                    onOpenFavorites={() => setIsFavoritesLibraryOpen(true)}
                    onOpenAudit={() => setIsAuditOpen(true)}
                  />
                ) : (
                  <CodeExport
                    quiz={currentQuiz}
                    onTogglePrintSummary={handleTogglePrintSummary}
                  />
                )
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-[#bbd1cd] rounded-xl bg-white/60 my-auto">
                  <div className="w-14 h-14 rounded-2xl bg-[#e3eeec] text-[#247a6d] flex items-center justify-center mb-3 shadow-xs">
                    <Sparkles className="w-7 h-7" />
                  </div>
                  <h3 className="text-base font-bold text-[#1b5c53] mb-1">
                    Bereit für Ihr neues Quiz
                  </h3>
                  <p className="text-xs text-[#6e6c70] max-w-sm mb-4 leading-relaxed">
                    Wählen Sie links ein Pflegethema, nutzen Sie eine der <strong>ZQP-Themenvorlagen</strong> und klicken Sie auf <strong>„Quiz mit Gemini generieren“</strong>.
                  </p>
                  <div className="flex items-center gap-2 text-[11px] text-[#247a6d] font-semibold bg-[#f3f8f7] px-3 py-1.5 rounded-lg border border-[#bbd1cd]">
                    <span>✓ Keine automatischen Kosten beim Programmstart</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSave={handleSaveSettings}
      />

      {/* Project Library Modal */}
      <ProjectLibraryModal
        isOpen={isLibraryOpen}
        onClose={() => setIsLibraryOpen(false)}
        activeProjectId={activeProjectId}
        onSelectProject={handleSelectProject}
        onNewProject={handleStartFreshProject}
      />

      {/* Quality & Accessibility Audit Modal */}
      <QualityAuditModal
        isOpen={isAuditOpen}
        onClose={() => setIsAuditOpen(false)}
        quiz={currentQuiz}
        glossary={settings.glossary}
        onApplyGlossaryFixes={(fixedQuiz) => handleSaveStationEdit(fixedQuiz)}
      />

      {/* WYSIWYG Station Editor Modal */}
      {currentQuiz && (
        <StationEditorModal
          isOpen={isStationEditorOpen}
          onClose={() => setIsStationEditorOpen(false)}
          quiz={currentQuiz}
          initialStationIndex={stationEditorIndex}
          onSaveQuiz={handleSaveStationEdit}
          settings={settings}
        />
      )}

      {/* Source Inspector Modal (Anti-Halluzination & Quelltext-Abgleich) */}
      {currentQuiz && (
        <SourceInspectorModal
          isOpen={isSourceInspectorOpen}
          onClose={() => setIsSourceInspectorOpen(false)}
          quiz={currentQuiz}
          onUpdateStationQuote={handleUpdateStationQuote}
          onUpdateReferenceText={handleUpdateReferenceText}
        />
      )}

      {/* Favorites Library Modal (Stations-Schatzkiste) */}
      <FavoritesLibraryModal
        isOpen={isFavoritesLibraryOpen}
        onClose={() => setIsFavoritesLibraryOpen(false)}
        onInsertStation={handleInsertFavoriteStation}
      />
    </div>
  );
};
export default App;
