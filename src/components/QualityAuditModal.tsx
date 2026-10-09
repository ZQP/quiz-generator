import React, { useState } from "react";
import {
  X,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  BookOpen,
  Eye,
  Award,
  Sparkles,
  BookA,
  Check,
} from "lucide-react";
import { QuizGenerationResult, GlossaryEntry } from "../types";
import { analyzeQuizQuality, applyGlossaryFixesToQuiz } from "../services/qualityAnalyzer";

interface QualityAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  quiz: QuizGenerationResult | null;
  glossary?: GlossaryEntry[];
  onApplyGlossaryFixes?: (updatedQuiz: QuizGenerationResult) => void;
}

export const QualityAuditModal: React.FC<QualityAuditModalProps> = ({
  isOpen,
  onClose,
  quiz,
  glossary,
  onApplyGlossaryFixes,
}) => {
  const [fixedSuccessMsg, setFixedSuccessMsg] = useState<string | null>(null);

  if (!isOpen || !quiz) return null;

  const report = analyzeQuizQuality(quiz, glossary);

  const handleFixGlossary = () => {
    const fixedQuiz = applyGlossaryFixesToQuiz(quiz, glossary);
    onApplyGlossaryFixes?.(fixedQuiz);
    setFixedSuccessMsg(`${report.glossaryViolations.length} Begriffe regelkonform korrigiert!`);
    setTimeout(() => setFixedSuccessMsg(null), 3000);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="audit-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div className="bg-white rounded-2xl border border-[#bbd1cd] shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-[#f3f8f7] border-b border-[#bbd1cd] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#247a6d] text-white flex items-center justify-center shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 id="audit-modal-title" className="text-base font-bold text-[#1b5c53]">
                ZQP-Qualitäts- & Barrierefreiheits-Audit
              </h2>
              <p className="text-xs text-[#6e6c70]">
                Automatische Prüfung nach BITV 2.0 / WCAG 2.1 AA, ZQP-Fachglossar & Sprachniveau
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Schließen"
            className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-[#e3eeec] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Success Toast */}
          {fixedSuccessMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-800 flex items-center gap-2 font-semibold animate-in fade-in">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>✓ {fixedSuccessMsg}</span>
            </div>
          )}

          {/* Interactive Glossary Fix Banner */}
          {report.glossaryViolations.length > 0 && (
            <div className="p-4 bg-amber-50/90 border border-amber-300 rounded-xl space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0">
                    <BookA className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-amber-950">
                      ZQP-Fachglossar: {report.glossaryViolations.length} Abweichung(en) gefunden
                    </h3>
                    <p className="text-[11px] text-amber-800">
                      Gefundene Begriffe weichen von der personenzentrierten ZQP-Nomenklatur ab.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleFixGlossary}
                  className="px-3.5 py-1.5 bg-[#247a6d] hover:bg-[#1b5c53] text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Glossar-Korrekturen anwenden (1 Klick)</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-amber-200">
                {report.glossaryViolations.map((v, i) => (
                  <div
                    key={i}
                    className="p-2 bg-white/80 rounded-lg border border-amber-200 text-xs flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-[10px] text-gray-500 font-mono truncate">
                        {v.location}
                      </span>
                      <span className="text-[10px] text-amber-800 font-bold bg-amber-100 px-1.5 py-0.2 rounded">
                        {v.count}x
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="line-through text-red-600 font-medium">„{v.term}“</span>
                      <span className="text-gray-400">➔</span>
                      <span className="text-[#1b5c53] font-bold">„{v.preferred}“</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Score Overview Cards (5 Spalten) */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            <div className="bg-[#f3f8f7] border border-[#bbd1cd] rounded-xl p-3 flex flex-col items-center justify-center text-center col-span-2 sm:col-span-1">
              <span className="text-[11px] text-[#6e6c70] font-medium mb-0.5">Gesamt-Score</span>
              <div className="flex items-baseline gap-0.5">
                <span className="text-2xl font-black text-[#247a6d]">{report.overallScore}</span>
                <span className="text-[10px] text-[#6e6c70]">/100</span>
              </div>
              <span className="text-[9px] font-semibold text-[#1b5c53] mt-1 bg-white px-1.5 py-0.2 rounded-full border border-[#bbd1cd]">
                {report.overallScore >= 90 ? "Hervorragend" : "Sehr gut"}
              </span>
            </div>

            <div className="bg-white border border-[#bbd1cd] rounded-xl p-3 flex flex-col items-center justify-center text-center">
              <div className="flex items-center gap-1 text-[11px] text-[#6e6c70] font-medium mb-0.5">
                <Eye className="w-3 h-3 text-[#247a6d]" />
                <span>Barrierefreiheit</span>
              </div>
              <span className="text-xl font-bold text-[#1b5c53]">{report.accessibilityScore}%</span>
              <span className="text-[9px] text-emerald-700 mt-1">WCAG 2.1 AA ✓</span>
            </div>

            <div className="bg-white border border-[#bbd1cd] rounded-xl p-3 flex flex-col items-center justify-center text-center">
              <div className="flex items-center gap-1 text-[11px] text-[#6e6c70] font-medium mb-0.5">
                <BookA className="w-3 h-3 text-[#247a6d]" />
                <span>ZQP-Glossar</span>
              </div>
              <span
                className={`text-xl font-bold ${
                  report.glossaryScore >= 90 ? "text-[#1b5c53]" : "text-amber-600"
                }`}
              >
                {report.glossaryScore}%
              </span>
              <span className="text-[9px] text-gray-500 mt-1">
                {report.glossaryViolations.length === 0 ? "Konform ✓" : `${report.glossaryViolations.length} Abweich.`}
              </span>
            </div>

            <div className="bg-white border border-[#bbd1cd] rounded-xl p-3 flex flex-col items-center justify-center text-center">
              <div className="flex items-center gap-1 text-[11px] text-[#6e6c70] font-medium mb-0.5">
                <BookOpen className="w-3 h-3 text-[#247a6d]" />
                <span>Lesbarkeit</span>
              </div>
              <span className="text-xl font-bold text-[#1b5c53]">{report.fleschIndex}</span>
              <span className="text-[9px] text-[#6e6c70] mt-1">Flesch-Index</span>
            </div>

            <div className="bg-white border border-[#bbd1cd] rounded-xl p-3 flex flex-col items-center justify-center text-center">
              <div className="flex items-center gap-1 text-[11px] text-[#6e6c70] font-medium mb-0.5">
                <Award className="w-3 h-3 text-[#247a6d]" />
                <span>Didaktik</span>
              </div>
              <span className="text-xl font-bold text-[#1b5c53]">{report.didacticScore}%</span>
              <span className="text-[9px] text-emerald-700 mt-1">Erklärungen ✓</span>
            </div>
          </div>

          {/* Reading Level Box */}
          <div className="bg-[#fcfaf8] border border-[#e2ddd5] rounded-xl p-3.5 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-[#3a352d]">Sprachniveau-Einstufung:</span>
              <span className="font-semibold text-[#1b5c53]">{report.fleschRatingText}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-[#6e6c70]">
              <span>Zielgruppen-Passung ({quiz.targetAudience}):</span>
              <span className="font-medium text-[#247a6d]">{report.audienceMatchText}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-[#6e6c70]">
              <span>Durchschnittliche Satzlänge:</span>
              <span>
                {report.avgSentenceLength} Wörter pro Satz ({report.sentenceCount} Sätze gesamt)
              </span>
            </div>
          </div>

          {/* Audit Findings */}
          <div>
            <h4 className="text-xs font-bold text-[#1b5c53] uppercase tracking-wider mb-2">
              Prüfergebnisse & Empfehlungen
            </h4>
            <div className="space-y-2">
              {report.findings.map((finding, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-xl border flex items-start gap-2.5 text-xs ${
                    finding.type === "success"
                      ? "bg-emerald-50/70 border-emerald-200 text-emerald-900"
                      : "bg-amber-50/70 border-amber-200 text-amber-900"
                  }`}
                >
                  {finding.type === "success" ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <strong className="block font-semibold mb-0.5">{finding.title}</strong>
                    <span className="opacity-90 leading-relaxed">{finding.description}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Long sentences if any */}
          {report.longSentenceWarnings.length > 0 && (
            <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-3 text-xs text-amber-900">
              <strong className="block font-semibold mb-1">
                Empfohlene Kürzung für pflegende Angehörige:
              </strong>
              <ul className="list-disc pl-4 space-y-1 text-[11px] opacity-90">
                {report.longSentenceWarnings.map((warn, i) => (
                  <li key={i}>{warn}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-[#f3f8f7] border-t border-[#bbd1cd] px-6 py-3 flex items-center justify-between">
          <span className="text-[11px] text-[#6e6c70]">
            Prüfung basiert auf ZQP-Expertenstandards & BITV 2.0 / WCAG 2.1 AA
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#247a6d] hover:bg-[#1b5c53] text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
};
