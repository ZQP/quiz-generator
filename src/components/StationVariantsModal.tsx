import React, { useState } from "react";
import { X, Dices, Check, Sparkles, RefreshCw } from "lucide-react";
import { QuizStation, AppSettings } from "../types";
import { generateStationVariantsWithGemini } from "../services/geminiService";

interface StationVariantsModalProps {
  isOpen: boolean;
  onClose: () => void;
  station: QuizStation;
  contextTopic: string;
  settings: AppSettings;
  onSelectVariant: (selectedVariant: QuizStation) => void;
}

export const StationVariantsModal: React.FC<StationVariantsModalProps> = ({
  isOpen,
  onClose,
  station,
  contextTopic,
  settings,
  onSelectVariant,
}) => {
  const [variants, setVariants] = useState<QuizStation[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasGenerated, setHasGenerated] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    setIsLoading(true);
    try {
      const generated = await generateStationVariantsWithGemini({
        apiKey: settings.geminiApiKey,
        model: settings.selectedModel,
        station,
        contextTopic,
        editorialRules: settings.editorialRules,
        glossary: settings.glossary,
      });
      setVariants(generated);
      setHasGenerated(true);
    } catch (err: any) {
      alert(`Fehler bei der Varianten-Generierung: ${err?.message || "Unbekannter Fehler"}`);
    } finally {
      setIsLoading(false);
    }
  };

  const getVariantLabel = (index: number) => {
    switch (index) {
      case 0:
        return { label: "Variante A: Prägnant & Direkt", desc: "Kürzere Formulierung, didaktischer Fokus" };
      case 1:
        return { label: "Variante B: Praxisfall / Alltagsszene", desc: "Anschauliche Situation aus der häuslichen Pflege" };
      case 2:
        return { label: "Variante C: Alternative Mechanik", desc: "Anderer Aufgabentyp (z. B. Dilemma oder Mythos)" };
      default:
        return { label: `Variante ${index + 1}`, desc: "Alternative Station" };
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-3 md:p-6 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl border border-[#bbd1cd] max-w-4xl w-full max-h-[90vh] shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-[#f3f8f7] border-b border-[#bbd1cd] px-5 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#247a6d] text-white flex items-center justify-center shadow-2xs">
              <Dices className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#1b5c53]">
                Station neu würfeln / 3 KI-Varianten vorschlagen
              </h2>
              <p className="text-[11px] text-[#6e6c70]">
                Erzeugt 3 didaktisch unterschiedliche Alternativen für diese spezifische Station
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-[#e3eeec] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Current Station Basis */}
          <div className="p-3 bg-[#f8faf9] rounded-xl border border-[#bbd1cd]">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#6e6c70]">
                Ausgangs-Station:
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#e3eeec] text-[#1b5c53]">
                {station.type}
              </span>
            </div>
            <h3 className="text-xs font-bold text-[#1b5c53]">{station.title}</h3>
            <p className="text-xs text-[#444444] mt-0.5">{station.promptOrInstruction}</p>
          </div>

          {/* Trigger Generate Button */}
          {!hasGenerated && (
            <div className="p-8 text-center bg-white rounded-xl border border-dashed border-[#bbd1cd] flex flex-col items-center justify-center gap-3">
              <Sparkles className="w-8 h-8 text-[#247a6d]" />
              <div>
                <h4 className="text-sm font-bold text-[#1b5c53]">
                  3 maßgeschneiderte Varianten berechnen
                </h4>
                <p className="text-xs text-[#6e6c70] max-w-md mx-auto mt-1">
                  Gemini erzeugt eine prägnante Fassung, ein konkretes Alltags-Fallbeispiel sowie einen
                  alternativen Aufgabentyp (unter Beachtung des ZQP-Redaktionsleitfadens).
                </p>
              </div>
              <button
                type="button"
                onClick={handleGenerate}
                disabled={isLoading}
                className="mt-2 px-4 py-2 rounded-lg bg-[#247a6d] hover:bg-[#1b5c53] text-white text-xs font-semibold flex items-center gap-2 shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
              >
                <Dices className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
                <span>{isLoading ? "Varianten werden generiert..." : "Jetzt 3 Varianten erzeugen"}</span>
              </button>
            </div>
          )}

          {/* Generated Variants Grid */}
          {hasGenerated && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#1b5c53]">
                  Vorgeschlagene Varianten:
                </span>
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={isLoading}
                  className="text-[11px] text-[#247a6d] hover:underline flex items-center gap-1 font-semibold cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3 h-3 ${isLoading ? "animate-spin" : ""}`} />
                  <span>Nochmal neu würfeln</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {variants.map((variant, idx) => {
                  const meta = getVariantLabel(idx);
                  return (
                    <div
                      key={variant.id || idx}
                      className="bg-white rounded-xl border border-[#bbd1cd] hover:border-[#247a6d] p-3 flex flex-col justify-between shadow-2xs transition-all"
                    >
                      <div className="space-y-2">
                        <div>
                          <span className="text-[10px] font-bold text-[#247a6d] block">
                            {meta.label}
                          </span>
                          <span className="text-[10px] text-[#6e6c70] block leading-tight">
                            {meta.desc}
                          </span>
                        </div>

                        <div className="pt-2 border-t border-[#bbd1cd]/50">
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-[#f3f8f7] text-[#1b5c53] border border-[#bbd1cd] inline-block mb-1">
                            Typ: {variant.type}
                          </span>
                          <h4 className="text-xs font-bold text-[#1b5c53] leading-snug">
                            {variant.title}
                          </h4>
                          <p className="text-[11px] text-[#444444] mt-1 line-clamp-4 leading-relaxed">
                            {variant.promptOrInstruction}
                          </p>
                        </div>

                        <div className="p-2 bg-[#f9fbfb] rounded-lg text-[10px] text-[#555555] italic">
                          <strong className="not-italic text-[#1b5c53] block mb-0.5">Rationale:</strong>
                          <span className="line-clamp-3">{variant.zqpRationale}</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          onSelectVariant(variant);
                          onClose();
                        }}
                        className="mt-3 w-full py-2 rounded-lg bg-[#247a6d] hover:bg-[#1b5c53] text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Diese Variante übernehmen</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-[#f3f8f7] border-t border-[#bbd1cd] px-5 py-2.5 flex items-center justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border border-[#bbd1cd] text-xs font-medium hover:bg-gray-100 cursor-pointer"
          >
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
};
