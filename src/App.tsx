import React, { useState, useEffect } from "react";
import { Header } from "./components/Header";
import { PromptInput } from "./components/PromptInput";
import { QuizPreview } from "./components/QuizPreview";
import { CodeExport } from "./components/CodeExport";
import { SettingsModal } from "./components/SettingsModal";
import { AppSettings, QuizGenerationResult, TargetAudience, StationType } from "./types";
import { loadSettings, saveSettings, generateQuizWithGemini } from "./services/geminiService";
import { Eye, Code2 } from "lucide-react";

export const App: React.FC = () => {
  const [settings, setSettings] = useState<AppSettings>(loadSettings);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [activeMainTab, setActiveMainTab] = useState<"preview" | "code">("preview");

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingStepText, setLoadingStepText] = useState<string>("");

  const [currentQuiz, setCurrentQuiz] = useState<QuizGenerationResult | null>(null);

  // Initial load: generate initial preview
  useEffect(() => {
    generateQuiz({
      topicPrompt: "Sturzprävention im Alltag: Mitmachen & Prüfen",
      referenceText: "",
      questionCount: 3,
      targetAudience: "angehoerige",
      mechanics: ["matching", "ordering", "comparison"],
    });
  }, []);

  const handleSaveSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  const generateQuiz = async (params: {
    topicPrompt: string;
    referenceText: string;
    questionCount: number;
    targetAudience: TargetAudience;
    mechanics: StationType[];
  }) => {
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
      setCurrentQuiz(quiz);
      setActiveMainTab("preview");
    } catch (err: any) {
      alert(`Fehler bei der Generierung: ${err?.message || "Unbekannter Fehler"}`);
    } finally {
      setIsLoading(false);
      setLoadingStepText("");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f7faf9] text-[#444444]">
      {/* Header */}
      <Header settings={settings} onOpenSettings={() => setIsSettingsOpen(true)} />

      {/* Main Two-Column Content */}
      <main className="flex-1 max-w-[1700px] w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Input & Controls (5 cols) */}
        <div className="lg:col-span-5">
          <PromptInput
            onGenerate={generateQuiz}
            isLoading={isLoading}
            loadingStepText={loadingStepText}
          />
        </div>

        {/* Right Column: Preview & Code Export (7 cols) */}
        <div className="lg:col-span-7 flex flex-col">
          <div className="bg-white rounded-xl border border-[#bbd1cd] shadow-sm flex flex-col h-full overflow-hidden">
            {/* Tab Navigation Header */}
            <div className="bg-[#f3f8f7] border-b border-[#bbd1cd] px-4 pt-3 flex items-center justify-between">
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveMainTab("preview")}
                  className={`px-4 py-2 font-semibold text-xs rounded-t-lg flex items-center gap-1.5 transition-colors ${
                    activeMainTab === "preview"
                      ? "bg-white border-t border-x border-[#bbd1cd] text-[#1b5c53] shadow-sm"
                      : "text-[#6e6c70] hover:text-[#1b5c53]"
                  }`}
                >
                  <Eye className="w-4 h-4 text-[#247a6d]" />
                  <span>Interaktive Vorschau</span>
                </button>

                <button
                  onClick={() => setActiveMainTab("code")}
                  className={`px-4 py-2 font-semibold text-xs rounded-t-lg flex items-center gap-1.5 transition-colors ${
                    activeMainTab === "code"
                      ? "bg-white border-t border-x border-[#bbd1cd] text-[#1b5c53] shadow-sm"
                      : "text-[#6e6c70] hover:text-[#1b5c53]"
                  }`}
                >
                  <Code2 className="w-4 h-4 text-[#247a6d]" />
                  <span>Code-Export (HTML, CSS, JS)</span>
                </button>
              </div>
            </div>

            {/* Tab Content Panels */}
            <div className="p-4 md:p-6 bg-[#fcfaf8] flex-1 flex flex-col overflow-y-auto">
              {currentQuiz ? (
                activeMainTab === "preview" ? (
                  <QuizPreview
                    quiz={currentQuiz}
                    onReset={() => {
                      // re-trigger initial state
                    }}
                  />
                ) : (
                  <CodeExport quiz={currentQuiz} />
                )
              ) : (
                <div className="flex-1 flex items-center justify-center text-xs text-[#6e6c70]">
                  Geben Sie links ein Thema ein und klicken Sie auf „Quiz mit Gemini generieren“.
                </div>
              )}
            </div>
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
    </div>
  );
};
export default App;
