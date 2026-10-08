import React, { useState } from "react";
import { Sparkles, FileText, Upload, ChevronDown, ChevronRight, CheckSquare, Layers, Globe, Download } from "lucide-react";
import { TargetAudience, StationType } from "../types";
import { parseDocumentFile, ParsedDocumentResult } from "../services/documentParser";
import { fetchWebContentFromUrl } from "../services/webScraperService";

interface PromptInputProps {
  onGenerate: (data: {
    topicPrompt: string;
    referenceText: string;
    questionCount: number;
    targetAudience: TargetAudience;
    mechanics: StationType[];
  }) => void;
  isLoading: boolean;
  loadingStepText: string;
}

interface ZqpTemplate {
  title: string;
  badge: string;
  topic: string;
  audience: TargetAudience;
  count: number;
  mechanics: StationType[];
}

const ZQP_TEMPLATES: ZqpTemplate[] = [
  {
    title: "Sturzprävention in der Häuslichkeit",
    badge: "Sturzschutz",
    topic: "Sturzprävention im Alltag: Stolperfallen im Wohnbereich, sicheres Schuhwerk und Bewegungssicherheit",
    audience: "angehoerige",
    count: 4,
    mechanics: ["matching", "ordering", "myth_fact", "bucket_sort", "comparison"],
  },
  {
    title: "Demenz: Verstehender Umgang",
    badge: "Demenz",
    topic: "Demenz im Alltag: Empathische Kommunikation und verstehendes Handeln bei herausforderndem Verhalten",
    audience: "angehoerige",
    count: 4,
    mechanics: ["dilemma", "comparison", "myth_fact", "single_choice"],
  },
  {
    title: "Gewaltprävention & Überlastung",
    badge: "Gewaltprävention",
    topic: "Gewaltprävention & Überlastung: Warnsignale erkennen, eigene Grenzen wahrnehmen und rechtzeitig Entlastung organisieren",
    audience: "angehoerige",
    count: 3,
    mechanics: ["dilemma", "checklist", "single_choice"],
  },
  {
    title: "Medikationssicherheit",
    badge: "Medikation",
    topic: "Medikationssicherheit in der häuslichen Pflege: Richten, Einnahmehilfen und Wechselwirkungen vermeiden",
    audience: "angehoerige",
    count: 4,
    mechanics: ["checklist", "ordering", "myth_fact", "bucket_sort"],
  },
  {
    title: "Selbstfürsorge & Entlastung",
    badge: "Selbstfürsorge",
    topic: "Entlastung & Selbstfürsorge: Physische und psychische Gesundheit für pflegende Angehörige stärken",
    audience: "angehoerige",
    count: 3,
    mechanics: ["dilemma", "myth_fact", "bucket_sort", "checklist"],
  },
];

export const PromptInput: React.FC<PromptInputProps> = ({
  onGenerate,
  isLoading,
  loadingStepText,
}) => {
  const [topicPrompt, setTopicPrompt] = useState<string>(
    "Erstelle ein abwechslungsreiches Lern-Quiz zur Sturzprävention für pflegende Angehörige. Mit Zuordnungs-Puzzle für Gefahrenstellen, einer Ablauf-Sortierung für das Aufstehen und einem A/B-Situationsvergleich."
  );
  const [referenceText, setReferenceText] = useState<string>("");
  const [isRefOpen, setIsRefOpen] = useState<boolean>(false);
  const [isMechanicsOpen, setIsMechanicsOpen] = useState<boolean>(false);
  const [isTemplatesOpen, setIsTemplatesOpen] = useState<boolean>(false);
  const [questionCount, setQuestionCount] = useState<number>(3);
  const [targetAudience, setTargetAudience] = useState<TargetAudience>("angehoerige");
  const [templateLoadedMsg, setTemplateLoadedMsg] = useState<string | null>(null);

  const applyTemplate = (tpl: ZqpTemplate) => {
    setTopicPrompt(tpl.topic);
    setTargetAudience(tpl.audience);
    setQuestionCount(tpl.count);
    setMechanics(tpl.mechanics);
    setTemplateLoadedMsg(tpl.badge);
    setTimeout(() => setTemplateLoadedMsg(null), 2500);
  };

  const [mechanics, setMechanics] = useState<StationType[]>([
    "matching",
    "ordering",
    "comparison",
    "myth_fact",
    "bucket_sort",
    "dilemma",
    "checklist",
    "fill_in_the_blank",
    "single_choice",
  ]);

  const ALL_MECHANICS: StationType[] = [
    "matching",
    "ordering",
    "comparison",
    "myth_fact",
    "bucket_sort",
    "dilemma",
    "checklist",
    "fill_in_the_blank",
    "single_choice",
  ];

  const toggleMechanic = (type: StationType) => {
    setMechanics((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const selectAllMechanics = (all: boolean) => {
    if (all) {
      setMechanics(ALL_MECHANICS);
    } else {
      setMechanics(["single_choice"]);
    }
  };

  const [isParsingDoc, setIsParsingDoc] = useState<boolean>(false);
  const [parsedDocInfo, setParsedDocInfo] = useState<ParsedDocumentResult | null>(null);

  const handleProcessFile = async (file: File) => {
    setIsParsingDoc(true);
    try {
      const res = await parseDocumentFile(file);
      setParsedDocInfo(res);
      setReferenceText(res.text);
      setIsRefOpen(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      alert(`Fehler beim Einlesen der Datei: ${msg}`);
    } finally {
      setIsParsingDoc(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleProcessFile(file);
  };

  const [webUrl, setWebUrl] = useState<string>("");
  const [isLoadingUrl, setIsLoadingUrl] = useState<boolean>(false);
  const [urlErrorMsg, setUrlErrorMsg] = useState<string | null>(null);

  const handleFetchUrl = async () => {
    if (!webUrl.trim()) return;
    setIsLoadingUrl(true);
    setUrlErrorMsg(null);
    try {
      const scraped = await fetchWebContentFromUrl(webUrl);
      setParsedDocInfo({
        fileName: scraped.title,
        text: scraped.text,
        fileSize: new Blob([scraped.text]).size,
        fileType: "web",
      });
      setReferenceText(scraped.text);
      setIsRefOpen(true);
      setWebUrl("");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setUrlErrorMsg(msg);
    } finally {
      setIsLoadingUrl(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topicPrompt.trim()) return;
    onGenerate({
      topicPrompt,
      referenceText,
      questionCount,
      targetAudience,
      mechanics: mechanics.length > 0 ? mechanics : ["single_choice"],
    });
  };

  return (
    <section className="flex flex-col gap-4">
      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-[#bbd1cd] p-5 shadow-sm flex flex-col gap-4">
        {/* Main Topic Prompt */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="topic-prompt" className="text-sm font-semibold text-[#1b5c53] flex items-center gap-1.5">
              <span>Quiz-Thema & Lernziel</span>
              <span className="text-xs font-normal text-rose-700">*</span>
            </label>
            <span className="text-xs text-[#6e6c70]">KI-Prompt</span>
          </div>
          <textarea
            id="topic-prompt"
            rows={3}
            value={topicPrompt}
            onChange={(e) => setTopicPrompt(e.target.value)}
            disabled={isLoading}
            className="w-full rounded-lg border border-[#bbd1cd] p-3 text-sm focus:ring-2 focus:ring-[#247a6d] outline-none transition-all placeholder:text-gray-400"
            placeholder="Beschreiben Sie das Thema, z. B.: 'Quiz zu Sturzprävention für Angehörige mit Zuordnung und Reihenfolge...'"
          />

          {/* ZQP Quick-Start Templates (Einklappbar, standardmäßig zugeklappt) */}
          <div className="mt-2.5 pt-2 border-t border-[#e3eeec]">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setIsTemplatesOpen(!isTemplatesOpen)}
                className="text-xs font-semibold text-[#1b5c53] hover:text-[#247a6d] flex items-center gap-1.5 transition-colors cursor-pointer py-1 group"
                title="Themen-Inspirationen ein- oder ausblenden"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#247a6d]" />
                <span>Themen-Inspirationen & ZQP-Vorlagen ({ZQP_TEMPLATES.length})</span>
                {isTemplatesOpen ? (
                  <ChevronDown className="w-3.5 h-3.5 text-[#6e6c70] group-hover:text-[#247a6d]" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-[#6e6c70] group-hover:text-[#247a6d]" />
                )}
              </button>
              {templateLoadedMsg && (
                <span className="text-[11px] font-semibold text-emerald-700 animate-in fade-in">
                  ✓ Vorlage „{templateLoadedMsg}“ geladen!
                </span>
              )}
            </div>

            {isTemplatesOpen && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 pt-1 animate-in fade-in duration-150">
                {ZQP_TEMPLATES.map((tpl, idx) => (
                  <button
                    key={tpl.badge}
                    type="button"
                    onClick={() => applyTemplate(tpl)}
                    className={`text-left p-2.5 rounded-lg bg-[#f3f8f7] hover:bg-[#e3eeec] border border-[#bbd1cd] hover:border-[#247a6d] transition-all flex flex-col justify-between gap-1 group cursor-pointer shadow-2xs ${
                      idx === 4 ? "sm:col-span-2" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold text-[#1b5c53] bg-white px-2 py-0.5 rounded border border-[#bbd1cd] whitespace-nowrap">
                        {tpl.badge}
                      </span>
                      <span className="text-[10px] text-[#6e6c70] font-semibold whitespace-nowrap shrink-0">
                        {tpl.count} Stationen
                      </span>
                    </div>
                    <span className="text-xs font-semibold text-[#3a352d] leading-snug group-hover:text-[#1b5c53] line-clamp-1">
                      {tpl.title}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Gamification / Mechanics Selection (Standardmäßig eingeklappt) */}
        <div className="border border-[#bbd1cd] rounded-lg overflow-hidden">
          <button
            type="button"
            onClick={() => setIsMechanicsOpen(!isMechanicsOpen)}
            className="w-full bg-[#f3f8f7] px-4 py-2.5 text-left text-xs font-semibold text-[#1b5c53] flex items-center justify-between hover:bg-[#e3eeec] transition-colors"
          >
            <span className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#247a6d]" />
              <span>Erlaubte Spielformate & Quizoptionen</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white border border-[#bbd1cd] text-[#247a6d] font-bold">
                {mechanics.length === ALL_MECHANICS.length
                  ? "Pool: Alle 9 Formate erlaubt"
                  : `Pool: ${mechanics.length} von ${ALL_MECHANICS.length} erlaubt`}
              </span>
            </span>
            {isMechanicsOpen ? (
              <ChevronDown className="w-4 h-4 text-[#247a6d]" />
            ) : (
              <ChevronRight className="w-4 h-4 text-[#247a6d]" />
            )}
          </button>

          {isMechanicsOpen && (
            <div className="p-3 bg-white flex flex-col gap-2.5">
              <div className="flex items-center justify-between pb-1 border-b border-[#bbd1cd]/40">
                <span className="text-[11px] text-[#6e6c70]">
                  Formate für den KI-Pool (die KI wählt daraus passend zu den Stationen):
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => selectAllMechanics(true)}
                    className="text-[11px] text-[#247a6d] hover:underline font-semibold"
                  >
                    ✨ Alle an
                  </button>
                  <span className="text-gray-300">•</span>
                  <button
                    type="button"
                    onClick={() => selectAllMechanics(false)}
                    className="text-[11px] text-[#6e6c70] hover:underline font-medium"
                  >
                    Nur Single-Choice
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <label className="flex items-center gap-2 p-2 rounded-lg bg-white border border-[#e3eeec] hover:border-[#247a6d] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={mechanics.includes("matching")}
                    onChange={() => toggleMechanic("matching")}
                    className="w-3.5 h-3.5 text-[#247a6d] rounded focus:ring-[#247a6d]"
                  />
                  <div>
                    <span className="font-semibold block text-[#1b5c53]">🧩 Zuordnungs-Puzzle</span>
                    <span className="text-[10px] text-[#6e6c70]">Gefahr ↔ Schutzmaßnahme</span>
                  </div>
                </label>

                <label className="flex items-center gap-2 p-2 rounded-lg bg-white border border-[#e3eeec] hover:border-[#247a6d] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={mechanics.includes("ordering")}
                    onChange={() => toggleMechanic("ordering")}
                    className="w-3.5 h-3.5 text-[#247a6d] rounded focus:ring-[#247a6d]"
                  />
                  <div>
                    <span className="font-semibold block text-[#1b5c53]">🔢 Ablauf / Reihenfolge</span>
                    <span className="text-[10px] text-[#6e6c70]">Schritte per Drag umsortieren</span>
                  </div>
                </label>

                <label className="flex items-center gap-2 p-2 rounded-lg bg-white border border-[#e3eeec] hover:border-[#247a6d] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={mechanics.includes("myth_fact")}
                    onChange={() => toggleMechanic("myth_fact")}
                    className="w-3.5 h-3.5 text-[#247a6d] rounded focus:ring-[#247a6d]"
                  />
                  <div>
                    <span className="font-semibold block text-[#1b5c53]">❌/💡 Mythos vs. Fakt</span>
                    <span className="text-[10px] text-[#6e6c70]">Alltagsirrtümer entlarven</span>
                  </div>
                </label>

                <label className="flex items-center gap-2 p-2 rounded-lg bg-white border border-[#e3eeec] hover:border-[#247a6d] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={mechanics.includes("bucket_sort")}
                    onChange={() => toggleMechanic("bucket_sort")}
                    className="w-3.5 h-3.5 text-[#247a6d] rounded focus:ring-[#247a6d]"
                  />
                  <div>
                    <span className="font-semibold block text-[#1b5c53]">📥 Dos & Don'ts</span>
                    <span className="text-[10px] text-[#6e6c70]">2-Spalten Sortier-Ablage</span>
                  </div>
                </label>

                <label className="flex items-center gap-2 p-2 rounded-lg bg-white border border-[#e3eeec] hover:border-[#247a6d] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={mechanics.includes("comparison")}
                    onChange={() => toggleMechanic("comparison")}
                    className="w-3.5 h-3.5 text-[#247a6d] rounded focus:ring-[#247a6d]"
                  />
                  <div>
                    <span className="font-semibold block text-[#1b5c53]">⚖️ Situationsvergleich</span>
                    <span className="text-[10px] text-[#6e6c70]">Szenario A vs. B vergleichen</span>
                  </div>
                </label>

                <label className="flex items-center gap-2 p-2 rounded-lg bg-white border border-[#e3eeec] hover:border-[#247a6d] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={mechanics.includes("dilemma")}
                    onChange={() => toggleMechanic("dilemma")}
                    className="w-3.5 h-3.5 text-[#247a6d] rounded focus:ring-[#247a6d]"
                  />
                  <div>
                    <span className="font-semibold block text-[#1b5c53]">🎭 Praxis-Dilemma</span>
                    <span className="text-[10px] text-[#6e6c70]">Fallbeispiel & Entscheidung</span>
                  </div>
                </label>

                <label className="flex items-center gap-2 p-2 rounded-lg bg-white border border-[#e3eeec] hover:border-[#247a6d] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={mechanics.includes("checklist")}
                    onChange={() => toggleMechanic("checklist")}
                    className="w-3.5 h-3.5 text-[#247a6d] rounded focus:ring-[#247a6d]"
                  />
                  <div>
                    <span className="font-semibold block text-[#1b5c53]">📋 Checkliste</span>
                    <span className="text-[10px] text-[#6e6c70]">Lochkarten-Auswahl</span>
                  </div>
                </label>

                <label className="flex items-center gap-2 p-2 rounded-lg bg-white border border-[#e3eeec] hover:border-[#247a6d] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={mechanics.includes("fill_in_the_blank")}
                    onChange={() => toggleMechanic("fill_in_the_blank")}
                    className="w-3.5 h-3.5 text-[#247a6d] rounded focus:ring-[#247a6d]"
                  />
                  <div>
                    <span className="font-semibold block text-[#1b5c53]">✍️ Wort-Lückentext</span>
                    <span className="text-[10px] text-[#6e6c70]">Wortbausteine einsetzen</span>
                  </div>
                </label>

                <label className="flex items-center gap-2 p-2 rounded-lg bg-white border border-[#e3eeec] hover:border-[#247a6d] cursor-pointer col-span-2">
                  <input
                    type="checkbox"
                    checked={mechanics.includes("single_choice")}
                    onChange={() => toggleMechanic("single_choice")}
                    className="w-3.5 h-3.5 text-[#247a6d] rounded focus:ring-[#247a6d]"
                  />
                  <div>
                    <span className="font-semibold block text-[#1b5c53]">💡 Wissenscheck</span>
                    <span className="text-[10px] text-[#6e6c70]">Klassische Single-Choice</span>
                  </div>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Reference Material Accordion */}
        <div className="border border-[#bbd1cd] rounded-lg overflow-hidden">
          <button
            type="button"
            onClick={() => setIsRefOpen(!isRefOpen)}
            className="w-full bg-[#f3f8f7] px-4 py-2.5 text-left text-xs font-semibold text-[#1b5c53] flex items-center justify-between hover:bg-[#e3eeec] transition-colors"
          >
            <span className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#247a6d]" />
              ZQP-Referenzinhalte & Broschüren (Wissensbasis)
            </span>
            {isRefOpen ? (
              <ChevronDown className="w-4 h-4 text-[#247a6d]" />
            ) : (
              <ChevronRight className="w-4 h-4 text-[#247a6d]" />
            )}
          </button>

          {isRefOpen && (
            <div className="p-3 bg-white flex flex-col gap-2.5">
              {/* Document Dropzone */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const file = e.dataTransfer.files?.[0];
                  if (file) handleProcessFile(file);
                }}
                className="border-2 border-dashed border-[#bbd1cd] hover:border-[#247a6d] rounded-lg p-3 text-center bg-[#fcfaf8] transition-colors flex flex-col items-center justify-center gap-1.5"
              >
                <div className="flex items-center gap-2">
                  <Upload className="w-4 h-4 text-[#247a6d]" />
                  <span className="text-xs font-semibold text-[#1b5c53]">
                    PDF-Broschüre, Word-Dokument (.docx) oder Textdatei ablegen
                  </span>
                </div>
                <p className="text-[10px] text-[#6e6c70]">
                  Unterstützt PDF (z. B. ZQP-Ratgeber), Word (.docx), Markdown (.md) und Text (.txt)
                </p>

                <label className="cursor-pointer px-3 py-1 bg-white border border-[#bbd1cd] hover:border-[#247a6d] rounded text-xs font-medium text-[#1b5c53] shadow-xs transition-colors">
                  <span>Datei durchsuchen</span>
                  <input
                    type="file"
                    accept=".pdf,.docx,.txt,.md,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={handleFileInputChange}
                    className="hidden"
                  />
                </label>
              </div>

              {/* URL Web-Link Import */}
              <div className="flex flex-col gap-1.5 p-2.5 rounded-lg bg-[#f8faf9] border border-[#bbd1cd]">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[#1b5c53]">
                  <Globe className="w-3.5 h-3.5 text-[#247a6d]" />
                  <span>Oder Inhalte direkt per Web-Adresse (URL) importieren</span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={webUrl}
                    onChange={(e) => setWebUrl(e.target.value)}
                    placeholder="https://www.zqp.de/beratung-sturz-praevention/ ..."
                    disabled={isLoadingUrl}
                    className="flex-1 rounded border border-[#bbd1cd] px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-[#247a6d] outline-none bg-white placeholder:text-gray-400"
                  />
                  <button
                    type="button"
                    onClick={handleFetchUrl}
                    disabled={isLoadingUrl || !webUrl.trim()}
                    className="px-3 py-1.5 bg-[#247a6d] hover:bg-[#1b5c53] disabled:opacity-50 text-white rounded text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                  >
                    {isLoadingUrl ? (
                      <>
                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Lade...</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-3.5 h-3.5" />
                        <span>Webseite abrufen</span>
                      </>
                    )}
                  </button>
                </div>
                {urlErrorMsg && (
                  <p className="text-[11px] text-rose-600 font-medium">
                    {urlErrorMsg}
                  </p>
                )}
                <span className="text-[10px] text-[#6e6c70]">
                  Lädt den Webtext ohne Navigation, Menüs und Kopfzeilen direkt in das Textfeld.
                </span>
              </div>

              {isParsingDoc && (
                <div className="p-2 rounded bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center gap-2 animate-pulse">
                  <Sparkles className="w-4 h-4 text-amber-600 animate-spin" />
                  <span>Dokument wird analysiert und Text extrahiert...</span>
                </div>
              )}

              {parsedDocInfo && !isParsingDoc && (
                <div className="p-2 rounded bg-[#edf7f4] border border-[#247a6d] text-xs text-[#1b5c53] flex items-center justify-between">
                  <div className="flex items-center gap-2 truncate">
                    <FileText className="w-4 h-4 text-[#247a6d] shrink-0" />
                    <span className="font-semibold truncate">
                      {parsedDocInfo.fileName}
                    </span>
                    {parsedDocInfo.pageCount && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-white border border-[#bbd1cd] font-mono shrink-0">
                        {parsedDocInfo.pageCount} Seiten
                      </span>
                    )}
                    <span className="text-[10px] text-[#6e6c70] shrink-0">
                      ({Math.round(parsedDocInfo.text.length / 5)} Wörter)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setParsedDocInfo(null);
                      setReferenceText("");
                    }}
                    className="text-xs text-rose-700 hover:underline font-semibold ml-2 shrink-0"
                  >
                    Entfernen
                  </button>
                </div>
              )}

              <textarea
                rows={4}
                value={referenceText}
                onChange={(e) => setReferenceText(e.target.value)}
                placeholder="Fügen Sie hier ZQP-Ratgeberinhalte oder Faktenblätter ein, die als Basis für die Fragen und Erklärungen dienen sollen..."
                className="w-full rounded border border-[#bbd1cd] p-2 text-xs focus:ring-1 focus:ring-[#247a6d] outline-none"
              />

              <div className="flex items-center justify-between text-xs pt-0.5">
                <span className="text-[10px] text-[#6e6c70]">
                  {referenceText.trim()
                    ? `${referenceText.trim().split(/\s+/).length} Wörter geladen`
                    : "Kein Text hinterlegt"}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setParsedDocInfo(null);
                    setReferenceText(
                      "ZQP-Themenreport 'Sicherheit in der häuslichen Pflege': Rund 80% aller Stürze bei Pflegebedürftigen ereignen sich im Wohnbereich. Die häufigsten Ursachen sind fehlende Haltegriffe in Nassbereichen, schlechte Beleuchtung und ungeeignetes Schuhwerk ohne Fersenhalt."
                    );
                  }}
                  className="text-[#1b5c53] hover:underline text-[11px]"
                >
                  ZQP-Mustertext laden
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Target Audience & Station Count Slider */}
        <div className="space-y-3 pt-1">
          <div>
            <label htmlFor="audience" className="block text-xs font-semibold text-[#1b5c53] mb-1">
              Zielgruppe
            </label>
            <select
              id="audience"
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value as TargetAudience)}
              disabled={isLoading}
              className="w-full rounded-lg border border-[#bbd1cd] p-2 text-xs bg-white focus:ring-2 focus:ring-[#247a6d] outline-none"
            >
              <option value="angehoerige">Pflegende Angehörige</option>
              <option value="fachkraefte">Pflegefachpersonen</option>
              <option value="senioren">Senior:innen / Einfache Sprache</option>
              <option value="allgemein">Allgemeinbevölkerung</option>
            </select>
          </div>

          {/* Schieberegler für Anzahl der Lernstationen (1 bis 10) */}
          <div className="bg-[#f3f8f7] border border-[#bbd1cd] rounded-xl p-3">
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="station-slider" className="text-xs font-semibold text-[#1b5c53]">
                Anzahl der Lernstationen
              </label>
              <span className="font-bold text-xs bg-[#247a6d] text-white px-2.5 py-0.5 rounded-full shadow-xs">
                {questionCount} {questionCount === 1 ? "Station" : "Stationen"}
              </span>
            </div>

            <input
              id="station-slider"
              type="range"
              min={1}
              max={10}
              step={1}
              value={questionCount}
              onChange={(e) => setQuestionCount(Number(e.target.value))}
              disabled={isLoading}
              className="w-full h-2 bg-[#bbd1cd]/60 rounded-lg appearance-none cursor-pointer accent-[#247a6d] focus:outline-none focus:ring-2 focus:ring-[#247a6d]"
            />

            <div className="flex justify-between text-[10px] text-[#6e6c70] font-medium px-0.5 mt-1 select-none">
              <span>1</span>
              <span>2</span>
              <span>3</span>
              <span>4</span>
              <span>5</span>
              <span>6</span>
              <span>7</span>
              <span>8</span>
              <span>9</span>
              <span>10</span>
            </div>

            <p className="text-[11px] text-[#6e6c70] mt-2 pt-2 border-t border-[#bbd1cd]/50">
              💡 <strong>Quiz-Länge:</strong> Es entstehen genau <strong>{questionCount} {questionCount === 1 ? "Station" : "Stationen"}</strong>. Die KI wählt dafür die didaktisch am besten passenden Formate aus Ihrem Pool ({mechanics.length} erlaubt).
            </p>
          </div>
        </div>

        {/* Generate Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isLoading || !topicPrompt.trim()}
            className="w-full bg-[#247a6d] hover:bg-[#1b5c53] active:bg-[#00473d] text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all focus:ring-4 focus:ring-[#bbd1cd] focus:outline-none disabled:opacity-60"
          >
            <Sparkles className="w-5 h-5" />
            <span>{isLoading ? "Erstelle Quiz..." : "Interaktives Quiz mit Gemini generieren"}</span>
          </button>

          {isLoading && (
            <div className="mt-2.5 p-2.5 bg-[#f3f8f7] border border-[#bbd1cd] rounded-lg text-xs text-[#1b5c53] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 border-2 border-[#247a6d] border-t-transparent rounded-full animate-spin"></div>
                <span>{loadingStepText}</span>
              </div>
              <span className="text-[#6e6c70] text-[11px]">ca. 2-4 Sek.</span>
            </div>
          )}
        </div>
      </form>

      {/* Accessibility Note */}
      <div className="bg-[#f3f8f7] border border-[#bbd1cd] rounded-xl p-3.5 text-xs text-[#444444]">
        <div className="flex items-center gap-1.5 font-bold text-[#1b5c53] mb-1">
          <CheckSquare className="w-4 h-4 text-[#247a6d]" />
          Barrierearme Gamification (WCAG 2.1 AA / BITV)
        </div>
        <p className="leading-relaxed">
          Alle generierten Puzzles, Abläufe und Vergleiche sind zweifach bedienbar: sowohl per
          Maus/Touch als auch lückenlos per Tastatur (<kbd className="px-1 bg-white border rounded">Tab</kbd>, <kbd className="px-1 bg-white border rounded">Leertaste</kbd>, Pfeiltasten) mit Screenreader-Unterstützung.
        </p>
      </div>
    </section>
  );
};
