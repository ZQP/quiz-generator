import React, { useState } from "react";
import { Sparkles, FileText, Upload, ChevronDown, ChevronRight, CheckSquare, Layers } from "lucide-react";
import { TargetAudience, StationType } from "../types";

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
  const [questionCount, setQuestionCount] = useState<number>(3);
  const [targetAudience, setTargetAudience] = useState<TargetAudience>("angehoerige");

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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setReferenceText(text);
      setIsRefOpen(true);
    };
    reader.readAsText(file);
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

          {/* Quick Examples */}
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-[#6e6c70]">Vorlagen:</span>
            <button
              type="button"
              onClick={() =>
                setTopicPrompt(
                  "Erstelle ein 3-Stationen-Quiz zur Sturzprophylaxe im häuslichen Umfeld. Mit Zuordnungs-Puzzle, Ablauf-Sortierung und A/B-Situationsvergleich. Für Angehörige."
                )
              }
              className="text-xs bg-[#f3f8f7] hover:bg-[#e3eeec] text-[#1b5c53] px-2 py-0.5 rounded border border-[#bbd1cd]"
            >
              Sturzprophylaxe (Mix)
            </button>
            <button
              type="button"
              onClick={() =>
                setTopicPrompt(
                  "Quiz 'Demenz verstehen': 1 Zuordnungsaufgabe (Verhalten ↔ Bedürfnis), 1 Wahr/Falsch-Vergleich, 1 Reihenfolge bei der Deeskalation. Einfühlsame Sprache."
                )
              }
              className="text-xs bg-[#f3f8f7] hover:bg-[#e3eeec] text-[#1b5c53] px-2 py-0.5 rounded border border-[#bbd1cd]"
            >
              Demenz-Verstehen
            </button>
            <button
              type="button"
              onClick={() =>
                setTopicPrompt(
                  "Rettungskette & Notfallmanagement im Pflegeheim: Reihenfolge der Sofortmaßnahmen, Zuordnung von Notfallnummern und Symptomvergleich für Fachkräfte."
                )
              }
              className="text-xs bg-[#f3f8f7] hover:bg-[#e3eeec] text-[#1b5c53] px-2 py-0.5 rounded border border-[#bbd1cd]"
            >
              Notfall-Kette
            </button>
          </div>
        </div>

        {/* Gamification / Mechanics Selection */}
        <div className="border border-[#bbd1cd] rounded-xl p-3.5 bg-[#fcfaf8]">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold text-[#1b5c53] flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-[#247a6d]" />
              Interaktive Spielformate (Abwechslung)
            </label>
            <button
              type="button"
              onClick={() => selectAllMechanics(true)}
              className="text-[11px] text-[#247a6d] hover:underline font-medium"
            >
              ✨ Bunter Mix (Alle an)
            </button>
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
                <span className="text-[10px] text-[#6e6c70]">Drag & Drop (Gefahr ↔ Schutz)</span>
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
              <textarea
                rows={3}
                value={referenceText}
                onChange={(e) => setReferenceText(e.target.value)}
                placeholder="Fügen Sie hier ZQP-Ratgeberinhalte oder Faktenblätter ein, die als Basis für die Fragen und Erklärungen dienen sollen..."
                className="w-full rounded border border-[#bbd1cd] p-2 text-xs focus:ring-1 focus:ring-[#247a6d] outline-none"
              />
              <div className="flex items-center justify-between text-xs">
                <label className="cursor-pointer text-[#247a6d] hover:underline flex items-center gap-1 font-medium">
                  <Upload className="w-3.5 h-3.5" />
                  Textdatei (.txt, .md) hochladen
                  <input
                    type="file"
                    accept=".txt,.md"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
                <button
                  type="button"
                  onClick={() =>
                    setReferenceText(
                      "ZQP-Themenreport 'Sicherheit in der häuslichen Pflege': Rund 80% aller Stürze bei Pflegebedürftigen ereignen sich im Wohnbereich. Die häufigsten Ursachen sind fehlende Haltegriffe in Nassbereichen, schlechte Beleuchtung und ungeeignetes Schuhwerk ohne Fersenhalt."
                    )
                  }
                  className="text-[#1b5c53] hover:underline"
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
