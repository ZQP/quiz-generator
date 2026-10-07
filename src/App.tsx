import React, { useState, useEffect } from "react";
import { Header } from "./components/Header";
import { PromptInput } from "./components/PromptInput";
import { QuizRefiner } from "./components/QuizRefiner";
import { QuizPreview } from "./components/QuizPreview";
import { CodeExport } from "./components/CodeExport";
import { SettingsModal } from "./components/SettingsModal";
import { ProjectLibraryModal } from "./components/ProjectLibraryModal";
import { QualityAuditModal } from "./components/QualityAuditModal";
import { StationEditorModal } from "./components/StationEditorModal";
import { AppSettings, QuizGenerationResult, TargetAudience, StationType } from "./types";
import { loadSettings, saveSettings, generateQuizWithGemini, refineQuizWithGemini } from "./services/geminiService";
import {
  QuizProject,
  loadProjects,
  createNewProject,
  updateProjectHistory,
  getActiveProjectId,
  setActiveProjectId,
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

  const currentQuiz: QuizGenerationResult | null = historyIndex >= 0 ? quizHistory[historyIndex] : null;

  // Mode in left column: create new from scratch vs. refine existing
  const [leftPanelMode, setLeftPanelMode] = useState<"create" | "refine">(() =>
    quizHistory.length > 0 ? "refine" : "create"
  );

  // Save current quiz history to localStorage & active project whenever it changes
  useEffect(() => {
    if (quizHistory.length > 0 && historyIndex >= 0) {
      try {
        localStorage.setItem(
          DRAFT_STORAGE_KEY,
          JSON.stringify({ history: quizHistory, index: historyIndex })
        );
      } catch (err) {
        console.warn("Konnte Entwurf nicht in localStorage speichern:", err);
      }

      if (activeProjectId) {
        updateProjectHistory(activeProjectId, quizHistory, historyIndex);
      }
    }
  }, [quizHistory, historyIndex, activeProjectId]);

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
        ...params,
      });

      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);

      // Create new project in library
      const proj = createNewProject(quiz);
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
      {/* Header */}
      <Header
        settings={settings}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenLibrary={() => setIsLibraryOpen(true)}
        onOpenAudit={() => setIsAuditOpen(true)}
        hasCurrentQuiz={!!currentQuiz}
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
                {quizHistory.length > 1 && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#247a6d] text-white font-bold">
                    v{historyIndex + 1}
                  </span>
                )}
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
                versionInfo={`Version ${historyIndex + 1} von ${quizHistory.length}`}
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

            {/* Version & Persistence Indicator */}
            <div className="flex items-center gap-2">
              {quizHistory.length > 0 && (
                <span className="text-[11px] text-[#247a6d] bg-white px-2 py-0.5 rounded border border-[#bbd1cd] hidden sm:inline-flex items-center gap-1 font-medium shadow-2xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Gesichert
                </span>
              )}
              {quizHistory.length > 1 && (
                <div className="text-[11px] text-[#1b5c53] bg-white px-2 py-0.5 rounded border border-[#bbd1cd] font-semibold shadow-2xs">
                  v{historyIndex + 1}
                </div>
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
      />

      {/* WYSIWYG Station Editor Modal */}
      {currentQuiz && (
        <StationEditorModal
          isOpen={isStationEditorOpen}
          onClose={() => setIsStationEditorOpen(false)}
          quiz={currentQuiz}
          initialStationIndex={stationEditorIndex}
          onSaveQuiz={handleSaveStationEdit}
        />
      )}
    </div>
  );
};
export default App;
