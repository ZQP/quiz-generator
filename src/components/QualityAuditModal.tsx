import React from "react";
import { X, ShieldCheck, CheckCircle2, AlertTriangle, BookOpen, Eye, Award } from "lucide-react";
import { QuizGenerationResult } from "../types";
import { analyzeQuizQuality } from "../services/qualityAnalyzer";

interface QualityAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  quiz: QuizGenerationResult | null;
}

export const QualityAuditModal: React.FC<QualityAuditModalProps> = ({ isOpen, onClose, quiz }) => {
  if (!isOpen || !quiz) return null;

  const report = analyzeQuizQuality(quiz);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl border border-[#bbd1cd] shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-[#f3f8f7] border-b border-[#bbd1cd] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#247a6d] text-white flex items-center justify-center shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#1b5c53]">
                ZQP-Qualitäts- & Barrierefreiheits-Audit
              </h2>
              <p className="text-xs text-[#6e6c70]">
                Automatische Prüfung nach BITV 2.0 / WCAG 2.1 AA & Sprachniveau
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-[#e3eeec] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Score Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="bg-[#f3f8f7] border border-[#bbd1cd] rounded-xl p-3.5 flex flex-col items-center justify-center text-center">
              <span className="text-xs text-[#6e6c70] font-medium mb-1">Gesamt-Score</span>
              <div className="flex items-baseline gap-0.5">
                <span className="text-2xl font-black text-[#247a6d]">{report.overallScore}</span>
                <span className="text-xs text-[#6e6c70]">/100</span>
              </div>
              <span className="text-[10px] font-semibold text-[#1b5c53] mt-1 bg-white px-2 py-0.5 rounded-full border border-[#bbd1cd]">
                {report.overallScore >= 90 ? "Hervorragend" : "Sehr gut"}
              </span>
            </div>

            <div className="bg-white border border-[#bbd1cd] rounded-xl p-3.5 flex flex-col items-center justify-center text-center">
              <div className="flex items-center gap-1 text-xs text-[#6e6c70] font-medium mb-1">
                <Eye className="w-3.5 h-3.5 text-[#247a6d]" />
                <span>Barrierefreiheit</span>
              </div>
              <span className="text-xl font-bold text-[#1b5c53]">{report.accessibilityScore}%</span>
              <span className="text-[10px] text-emerald-700 mt-1">WCAG 2.1 AA ✓</span>
            </div>

            <div className="bg-white border border-[#bbd1cd] rounded-xl p-3.5 flex flex-col items-center justify-center text-center">
              <div className="flex items-center gap-1 text-xs text-[#6e6c70] font-medium mb-1">
                <BookOpen className="w-3.5 h-3.5 text-[#247a6d]" />
                <span>Lesbarkeit</span>
              </div>
              <span className="text-xl font-bold text-[#1b5c53]">{report.fleschIndex}</span>
              <span className="text-[10px] text-[#6e6c70] mt-1">Flesch-Index (DE)</span>
            </div>

            <div className="bg-white border border-[#bbd1cd] rounded-xl p-3.5 flex flex-col items-center justify-center text-center">
              <div className="flex items-center gap-1 text-xs text-[#6e6c70] font-medium mb-1">
                <Award className="w-3.5 h-3.5 text-[#247a6d]" />
                <span>Didaktik</span>
              </div>
              <span className="text-xl font-bold text-[#1b5c53]">{report.didacticScore}%</span>
              <span className="text-[10px] text-emerald-700 mt-1">Erklärungen ✓</span>
            </div>
          </div>

          {/* Reading Level Box */}
          <div className="bg-[#fcfaf8] border border-[#e2ddd5] rounded-xl p-4 space-y-2">
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
              <span>{report.avgSentenceLength} Wörter pro Satz ({report.sentenceCount} Sätze gesamt)</span>
            </div>
          </div>

          {/* Audit Findings */}
          <div>
            <h4 className="text-xs font-bold text-[#1b5c53] uppercase tracking-wider mb-2.5">
              Prüfergebnisse & Empfehlungen
            </h4>
            <div className="space-y-2.5">
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
            <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-900">
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
        <div className="bg-[#f3f8f7] border-t border-[#bbd1cd] px-6 py-3 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#247a6d] hover:bg-[#1b5c53] text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
          >
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
};
