import React, { useState } from "react";
import { Sparkles, Undo2, Redo2, MessageSquarePlus, PlusCircle } from "lucide-react";
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
    <div className="bg-white rounded-xl border-2 border-[#247a6d]/40 p-5 shadow-sm flex flex-col gap-4">
      {/* Header with Undo / Redo */}
      <div className="flex items-center justify-between pb-3 border-b border-[#bbd1cd]">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#247a6d] flex items-center justify-center text-white">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#1b5c53]">Quiz per KI anpassen</h3>
            <p className="text-[11px] text-[#6e6c70]">{versionInfo}</p>
          </div>
        </div>

        {/* Undo / Redo buttons */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onUndo}
            disabled={!canUndo || isLoading}
            className="p-1.5 rounded-lg border border-[#bbd1cd] text-[#444] hover:bg-[#f3f8f7] disabled:opacity-30 transition-colors"
            title="Vorherige Version wiederherstellen"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onRedo}
            disabled={!canRedo || isLoading}
            className="p-1.5 rounded-lg border border-[#bbd1cd] text-[#444] hover:bg-[#f3f8f7] disabled:opacity-30 transition-colors"
            title="Nächste Version wiederherstellen"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Current Active Quiz Snippet */}
      <div className="bg-[#f3f8f7] p-3 rounded-lg border border-[#bbd1cd] text-xs">
        <span className="text-[10px] uppercase font-bold text-[#1b5c53] tracking-wider block mb-0.5">
          Aktives Quiz ({currentQuiz.stations.length} Stationen):
        </span>
        <span className="font-semibold text-[#444] block line-clamp-1">
          {currentQuiz.title}
        </span>
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
            className="w-full rounded-lg border border-[#bbd1cd] p-2.5 text-xs focus:ring-2 focus:ring-[#247a6d] outline-none placeholder:text-gray-400"
          />
        </div>

        {/* Quick Refinement Chips */}
        <div>
          <span className="text-[11px] text-[#6e6c70] block mb-1.5">
            Schnell-Anpassungen per Klick:
          </span>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setQuickPrompt("Formuliere alle Fragen und Erklärungen in einfacherer, verständlicherer Sprache für Senior:innen.")}
              className="text-[11px] bg-[#f3f8f7] hover:bg-[#e3eeec] text-[#1b5c53] px-2 py-1 rounded border border-[#bbd1cd] transition-colors"
            >
              💬 Einfachere Sprache
            </button>
            <button
              type="button"
              onClick={() => setQuickPrompt("Fasse die didaktischen Erklärungen prägnanter und kürzer zusammen.")}
              className="text-[11px] bg-[#f3f8f7] hover:bg-[#e3eeec] text-[#1b5c53] px-2 py-1 rounded border border-[#bbd1cd] transition-colors"
            >
              ⚡ Kürzere Erklärungen
            </button>
            <button
              type="button"
              onClick={() => setQuickPrompt("Füge eine weitere interaktive Station zum Thema 'Sichere Beleuchtung in der Nacht' hinzu.")}
              className="text-[11px] bg-[#f3f8f7] hover:bg-[#e3eeec] text-[#1b5c53] px-2 py-1 rounded border border-[#bbd1cd] transition-colors"
            >
              ➕ Station ergänzen
            </button>
            <button
              type="button"
              onClick={() => setQuickPrompt("Ergänze noch konkretere ZQP-Praxistipps für pflegende Angehörige bei jeder Station.")}
              className="text-[11px] bg-[#f3f8f7] hover:bg-[#e3eeec] text-[#1b5c53] px-2 py-1 rounded border border-[#bbd1cd] transition-colors"
            >
              🎯 ZQP-Tipps vertiefen
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!refinementPrompt.trim() || isLoading}
          className="w-full mt-1 bg-[#247a6d] hover:bg-[#1b5c53] active:bg-[#00473d] text-white font-semibold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all focus:ring-4 focus:ring-[#bbd1cd] disabled:opacity-50 text-xs"
        >
          <MessageSquarePlus className="w-4 h-4" />
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
      <div className="pt-3 border-t border-[#bbd1cd] flex items-center justify-between text-xs">
        <span className="text-[#6e6c70]">Neues Thema starten?</span>
        <button
          type="button"
          onClick={onSwitchToNewQuiz}
          className="text-[#1b5c53] hover:text-[#247a6d] font-semibold hover:underline flex items-center gap-1"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>Komplett neues Quiz erstellen</span>
        </button>
      </div>
    </div>
  );
};
