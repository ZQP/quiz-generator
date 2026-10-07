import React, { useState } from "react";
import { Sparkles, Undo2, Redo2, PlusCircle } from "lucide-react";
import { QuizGenerationResult } from "../types";

interface QuizRefinerProps {
  currentQuiz: QuizGenerationResult;
  onRefine: (refinementPrompt: string) => void;
  isLoading: boolean;
  loadingStepText: string;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  versionInfo: string;
  onSwitchToNewQuiz: () => void;
}

export const QuizRefiner: React.FC<QuizRefinerProps> = ({
  currentQuiz,
  onRefine,
  isLoading,
  loadingStepText,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  versionInfo,
  onSwitchToNewQuiz,
}) => {
  const [refinementPrompt, setRefinementPrompt] = useState<string>("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!refinementPrompt.trim() || isLoading) return;
    onRefine(refinementPrompt.trim());
    setRefinementPrompt("");
  };

  const setQuickPrompt = (prompt: string) => {
    setRefinementPrompt(prompt);
  };

  return (
    <div className="bg-white rounded-xl border border-[#bbd1cd] p-4 flex flex-col gap-3.5 shadow-2xs">
      {/* Active Quiz Snippet & Version Control */}
      <div className="bg-[#f3f8f7] p-3 rounded-lg border border-[#bbd1cd] flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-[10px] uppercase font-bold text-[#1b5c53] tracking-wider">
              Aktives Quiz ({currentQuiz.stations.length} Stationen)
            </span>
            <span className="text-[10px] text-[#6e6c70] font-medium">• {versionInfo}</span>
          </div>
          <p className="font-semibold text-xs text-[#3a352d] truncate">
            {currentQuiz.title}
          </p>
        </div>

        {/* Undo / Redo buttons */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={onUndo}
            disabled={!canUndo || isLoading}
            className="p-1.5 rounded-lg border border-[#bbd1cd] text-[#444] bg-white hover:bg-[#f3f8f7] hover:border-[#247a6d] disabled:opacity-30 transition-colors shadow-2xs cursor-pointer"
            title="Vorherige Version wiederherstellen"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onRedo}
            disabled={!canRedo || isLoading}
            className="p-1.5 rounded-lg border border-[#bbd1cd] text-[#444] bg-white hover:bg-[#f3f8f7] hover:border-[#247a6d] disabled:opacity-30 transition-colors shadow-2xs cursor-pointer"
            title="Nächste Version wiederherstellen"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Refinement Prompt Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div>
          <label
            htmlFor="refine-prompt"
            className="block text-xs font-semibold text-[#1b5c53] mb-1"
          >
            Was möchten Sie an diesem Quiz gezielt anpassen?
          </label>
          <textarea
            id="refine-prompt"
            rows={3}
            value={refinementPrompt}
            onChange={(e) => setRefinementPrompt(e.target.value)}
            disabled={isLoading}
            placeholder="z. B.: 'Mache die Erklärungen bei allen Stationen etwas kürzer', 'Ersetze die 2. Station durch ein A/B-Szenario', 'Formuliere die Fragen in einfacher Sprache für Senior:innen'..."
            className="w-full rounded-lg border border-[#bbd1cd] p-2.5 text-xs focus:ring-2 focus:ring-[#247a6d] outline-none placeholder:text-gray-400 bg-white transition-all"
          />
        </div>

        {/* Quick Refinement Chips */}
        <div>
          <span className="text-[11px] text-[#6e6c70] block mb-1.5 font-medium">
            Schnell-Anpassungen per Klick:
          </span>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setQuickPrompt("Formuliere alle Fragen und Erklärungen in einfacherer, verständlicherer Sprache für Senior:innen.")}
              className="text-[11px] bg-white hover:bg-[#e3eeec] hover:border-[#247a6d] text-[#1b5c53] px-2.5 py-1 rounded-lg border border-[#bbd1cd] transition-colors shadow-2xs cursor-pointer"
            >
              💬 Einfachere Sprache
            </button>
            <button
              type="button"
              onClick={() => setQuickPrompt("Fasse die didaktischen Erklärungen prägnanter und kürzer zusammen.")}
              className="text-[11px] bg-white hover:bg-[#e3eeec] hover:border-[#247a6d] text-[#1b5c53] px-2.5 py-1 rounded-lg border border-[#bbd1cd] transition-colors shadow-2xs cursor-pointer"
            >
              ⚡ Kürzere Erklärungen
            </button>
            <button
              type="button"
              onClick={() => setQuickPrompt("Füge eine weitere interaktive Station zum Thema 'Sichere Beleuchtung in der Nacht' hinzu.")}
              className="text-[11px] bg-white hover:bg-[#e3eeec] hover:border-[#247a6d] text-[#1b5c53] px-2.5 py-1 rounded-lg border border-[#bbd1cd] transition-colors shadow-2xs cursor-pointer"
            >
              ➕ Station ergänzen
            </button>
            <button
              type="button"
              onClick={() => setQuickPrompt("Ergänze noch konkretere ZQP-Praxistipps für pflegende Angehörige bei jeder Station.")}
              className="text-[11px] bg-white hover:bg-[#e3eeec] hover:border-[#247a6d] text-[#1b5c53] px-2.5 py-1 rounded-lg border border-[#bbd1cd] transition-colors shadow-2xs cursor-pointer"
            >
              🎯 ZQP-Tipps vertiefen
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!refinementPrompt.trim() || isLoading}
          className="w-full mt-1 bg-linear-to-r from-[#247a6d] to-[#1b5c53] hover:from-[#1b5c53] hover:to-[#00473d] text-white font-semibold py-2 px-4 rounded-xl flex items-center justify-center gap-2 shadow-2xs transition-all focus:ring-2 focus:ring-[#247a6d] disabled:opacity-40 text-xs cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-emerald-200" />
          <span>{isLoading ? "Wende Änderung an..." : "Anpassung mit Gemini anwenden"}</span>
        </button>

        {isLoading && (
          <div className="p-2.5 bg-[#f3f8f7] border border-[#bbd1cd] rounded-lg text-xs text-[#1b5c53] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3.5 h-3.5 border-2 border-[#247a6d] border-t-transparent rounded-full animate-spin"></div>
              <span>{loadingStepText}</span>
            </div>
            <span className="text-[#6e6c70] text-[11px]">ca. 2-3 Sek.</span>
          </div>
        )}
      </form>

      {/* Switch to New Quiz Creation */}
      <div className="pt-2.5 border-t border-[#bbd1cd] flex items-center justify-between text-xs">
        <span className="text-[#6e6c70]">Neues Thema starten?</span>
        <button
          type="button"
          onClick={onSwitchToNewQuiz}
          className="text-[#1b5c53] hover:text-[#247a6d] font-semibold hover:underline flex items-center gap-1 cursor-pointer"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>Komplett neues Quiz erstellen</span>
        </button>
      </div>
    </div>
  );
};
