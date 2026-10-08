import React, { useState, useMemo } from "react";
import {
  X,
  FileSearch,
  CheckCircle2,
  AlertTriangle,
  BookmarkPlus,
  Search,
  Quote,
  ShieldCheck,
  Edit3,
} from "lucide-react";
import { QuizGenerationResult, QuizStation } from "../types";
import { findSourceCitationsForStation, SourceCitationMatch } from "../services/geminiService";

interface SourceInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  quiz: QuizGenerationResult;
  onUpdateStationQuote: (stationIndex: number, quote: string) => void;
  onUpdateReferenceText: (newRefText: string) => void;
}

export const SourceInspectorModal: React.FC<SourceInspectorModalProps> = ({
  isOpen,
  onClose,
  quiz,
  onUpdateStationQuote,
  onUpdateReferenceText,
}) => {
  const [selectedStationIdx, setSelectedStationIdx] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isEditingRefText, setIsEditingRefText] = useState<boolean>(false);
  const [customRefText, setCustomRefText] = useState<string>(quiz.referenceSourceText || "");

  const stations = quiz.stations || [];
  const currentStation: QuizStation | undefined = stations[selectedStationIdx];

  const sourceText = quiz.referenceSourceText || customRefText;

  // Run matching for all stations to show badges in list
  const stationMatches = useMemo(() => {
    return stations.map((st) => findSourceCitationsForStation(st, sourceText));
  }, [stations, sourceText]);

  const currentMatch: SourceCitationMatch | undefined = stationMatches[selectedStationIdx];

  if (!isOpen) return null;

  const handleSaveRefText = () => {
    onUpdateReferenceText(customRefText);
    setIsEditingRefText(false);
  };

  const handleAttachQuote = () => {
    if (!currentMatch?.bestQuote) return;
    onUpdateStationQuote(selectedStationIdx, currentMatch.bestQuote);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-3 md:p-6 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl border border-[#bbd1cd] max-w-5xl w-full h-[90vh] shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-[#f3f8f7] border-b border-[#bbd1cd] px-5 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#247a6d] text-white flex items-center justify-center shadow-2xs">
              <FileSearch className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-[#1b5c53]">
                  Quelltext-Abgleich & Zitat-Finder (Anti-Halluzination)
                </h2>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#e3eeec] text-[#1b5c53] font-semibold border border-[#bbd1cd]">
                  ZQP Redaktions-Tool
                </span>
              </div>
              <p className="text-[11px] text-[#6e6c70]">
                Gegenprüfung von Quiz-Aussagen mit dem hochgeladenen ZQP-Originaldokument
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

        {/* Main Split View */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 min-h-0 overflow-hidden divide-y md:divide-y-0 md:divide-x divide-[#bbd1cd]">
          {/* Left Column: Source Document (7 cols) */}
          <div className="md:col-span-7 flex flex-col min-h-0 bg-[#fbfdfc] p-3.5 overflow-hidden">
            <div className="flex items-center justify-between pb-2 border-b border-[#bbd1cd] shrink-0 gap-2">
              <span className="text-xs font-bold text-[#1b5c53] flex items-center gap-1.5">
                <Quote className="w-3.5 h-3.5 text-[#247a6d]" />
                <span>Originaltext / Fachbroschüre</span>
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsEditingRefText(!isEditingRefText)}
                  className="text-[11px] text-[#247a6d] hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>{isEditingRefText ? "Ansicht" : "Text anpassen"}</span>
                </button>
              </div>
            </div>

            {/* Search within document */}
            <div className="py-2 shrink-0">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Quelltext durchsuchen..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-[#bbd1cd] text-xs bg-white focus:ring-1 focus:ring-[#247a6d] outline-none"
                />
              </div>
            </div>

            {/* Document Content or Editor */}
            <div className="flex-1 overflow-y-auto rounded-lg border border-[#bbd1cd] bg-white p-3 text-xs leading-relaxed font-sans select-text">
              {isEditingRefText ? (
                <div className="h-full flex flex-col gap-2">
                  <textarea
                    value={customRefText}
                    onChange={(e) => setCustomRefText(e.target.value)}
                    placeholder="Fügen Sie hier den Text aus Ihrer ZQP-Broschüre oder dem Expertenstandard ein..."
                    className="flex-1 w-full p-2 border border-[#bbd1cd] rounded-lg text-xs font-mono resize-none outline-none focus:ring-1 focus:ring-[#247a6d]"
                  />
                  <button
                    type="button"
                    onClick={handleSaveRefText}
                    className="self-end px-3 py-1.5 rounded-lg bg-[#247a6d] text-white text-xs font-semibold hover:bg-[#1b5c53] cursor-pointer"
                  >
                    Quelltext speichern
                  </button>
                </div>
              ) : sourceText.trim().length > 0 ? (
                <div className="space-y-2 whitespace-pre-wrap text-[#444444]">
                  {sourceText.split(/\n\s*\n/).map((para, i) => {
                    const isMatched =
                      currentMatch?.bestQuote && para.includes(currentMatch.bestQuote.substring(0, 30));
                    const isSearchHit =
                      searchQuery.trim().length > 1 &&
                      para.toLowerCase().includes(searchQuery.toLowerCase());

                    return (
                      <p
                        key={i}
                        className={`p-1.5 rounded transition-colors ${
                          isMatched
                            ? "bg-emerald-50 border-l-4 border-[#247a6d] text-[#1b5c53] font-medium"
                            : isSearchHit
                            ? "bg-amber-50 border-l-4 border-amber-400"
                            : "hover:bg-gray-50"
                        }`}
                      >
                        {para}
                      </p>
                    );
                  })}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-400">
                  <FileSearch className="w-8 h-8 text-gray-300 mb-2" />
                  <p className="font-semibold text-[#1b5c53]">Noch kein Quelltext hinterlegt</p>
                  <p className="text-[11px] text-[#6e6c70] max-w-sm mt-1">
                    Beim Erstellen des Quiz wurde kein Referenztext übergeben. Klicken Sie oben auf
                    „Text anpassen“, um die ZQP-Broschüre einzufügen.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Stations & Citations (5 cols) */}
          <div className="md:col-span-5 flex flex-col min-h-0 bg-white p-3.5 overflow-hidden">
            <span className="text-xs font-bold text-[#1b5c53] pb-2 border-b border-[#bbd1cd] shrink-0">
              Quiz-Stationen zur Verifikation ({stations.length})
            </span>

            {/* Station selector list */}
            <div className="flex gap-1.5 overflow-x-auto py-2 shrink-0">
              {stations.map((st, idx) => {
                const match = stationMatches[idx];
                const isSelected = selectedStationIdx === idx;
                return (
                  <button
                    key={st.id || idx}
                    type="button"
                    onClick={() => setSelectedStationIdx(idx)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 shrink-0 border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-[#247a6d] text-white border-[#247a6d] shadow-2xs"
                        : "bg-[#f3f8f7] text-[#1b5c53] border-[#bbd1cd] hover:border-[#247a6d]"
                    }`}
                  >
                    <span>Station {idx + 1}</span>
                    {match?.isVerified ? (
                      <CheckCircle2
                        className={`w-3 h-3 ${isSelected ? "text-emerald-300" : "text-emerald-600"}`}
                      />
                    ) : (
                      <AlertTriangle
                        className={`w-3 h-3 ${isSelected ? "text-amber-300" : "text-amber-500"}`}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Selected Station Details & Verification Card */}
            {currentStation && currentMatch && (
              <div className="flex-1 overflow-y-auto space-y-3 pt-2">
                <div className="p-3 bg-[#f8faf9] rounded-xl border border-[#bbd1cd] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#247a6d]">
                      {currentStation.type}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        currentMatch.isVerified
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {currentMatch.score}% Übereinstimmung
                    </span>
                  </div>

                  <h3 className="text-xs font-bold text-[#1b5c53]">
                    {currentStation.title}
                  </h3>
                  <p className="text-xs text-[#444444] font-medium leading-snug">
                    {currentStation.promptOrInstruction}
                  </p>

                  <div className="pt-2 border-t border-[#bbd1cd]/60">
                    <span className="text-[10px] font-bold text-[#6e6c70] block mb-0.5">
                      ZQP-Hintergrundwissen / Rationale:
                    </span>
                    <p className="text-[11px] text-[#555555] italic">
                      {currentStation.zqpRationale}
                    </p>
                  </div>
                </div>

                {/* Match Evaluation Result */}
                <div
                  className={`p-3 rounded-xl border ${
                    currentMatch.isVerified
                      ? "bg-emerald-50/60 border-emerald-300 text-emerald-950"
                      : "bg-amber-50/60 border-amber-300 text-amber-950"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {currentMatch.isVerified ? (
                      <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                    )}
                    <div className="space-y-1">
                      <span className="text-xs font-bold block">
                        {currentMatch.isVerified
                          ? "Fachlich im Quelltext belegt"
                          : "Kein direkter Textnachweis"}
                      </span>
                      <p className="text-[11px] leading-relaxed">
                        {currentMatch.explanation}
                      </p>
                    </div>
                  </div>

                  {currentMatch.bestQuote && (
                    <div className="mt-2.5 pt-2 border-t border-black/10">
                      <span className="text-[10px] font-bold text-[#1b5c53] block mb-1">
                        Gefundene Zitatstelle:
                      </span>
                      <blockquote className="text-[11px] italic bg-white/80 p-2 rounded border border-[#bbd1cd] leading-relaxed">
                        „{currentMatch.bestQuote}“
                      </blockquote>
                      <button
                        type="button"
                        onClick={handleAttachQuote}
                        className="mt-2 w-full py-1.5 px-3 rounded-lg bg-[#247a6d] hover:bg-[#1b5c53] text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                      >
                        <BookmarkPlus className="w-3.5 h-3.5" />
                        <span>Zitat an diese Station anheften</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Attached Quote if already saved */}
                {currentStation.sourceQuote && (
                  <div className="p-2.5 bg-[#f3f8f7] rounded-xl border border-[#247a6d]/40">
                    <span className="text-[10px] font-bold text-[#1b5c53] flex items-center gap-1 mb-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>Aktuell angeheftetes Quelltext-Zitat:</span>
                    </span>
                    <p className="text-[11px] text-[#444444] italic">
                      „{currentStation.sourceQuote}“
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-[#f3f8f7] border-t border-[#bbd1cd] px-5 py-2.5 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-[#6e6c70]">
            Tipp: Stationen mit nachgewiesenen Zitaten sichern die fachliche Qualität von zqp.de ab.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[#247a6d] text-white hover:bg-[#1b5c53] text-xs font-semibold cursor-pointer"
          >
            Fertig
          </button>
        </div>
      </div>
    </div>
  );
};
