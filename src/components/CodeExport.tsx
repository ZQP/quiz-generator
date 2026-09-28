import React, { useState } from "react";
import { Copy, Check, Download, AlertCircle, Code, Palette, Terminal } from "lucide-react";
import { QuizGenerationResult } from "../types";

interface CodeExportProps {
  quiz: QuizGenerationResult;
}

export const CodeExport: React.FC<CodeExportProps> = ({ quiz }) => {
  const [activeTab, setActiveTab] = useState<"html" | "css" | "js">("html");
  const [copiedTab, setCopiedTab] = useState<string | null>(null);

  const getCode = () => {
    switch (activeTab) {
      case "html":
        return quiz.generatedHtml || "<!-- Kein HTML generiert -->";
      case "css":
        return quiz.generatedCss || "/* Keine zusätzlichen CSS-Regeln erforderlich (alles über Tailwind abgedeckt) */";
      case "js":
        return quiz.generatedJs || "// Keine zusätzliche JavaScript-Logik erforderlich";
    }
  };

  const handleCopy = () => {
    const code = getCode();
    navigator.clipboard.writeText(code).then(() => {
      setCopiedTab(activeTab);
      setTimeout(() => setCopiedTab(null), 2000);
    });
  };

  const handleDownloadZip = () => {
    // Generate text bundle download
    const bundleText = `=== ZQP QUIZ EXPORT: ${quiz.title} ===
Target Audience: ${quiz.targetAudience}
Tailwind Required: ${quiz.needsTailwind ? "YES" : "NO"}
FontAwesome Required: ${quiz.needsFontAwesome ? "YES" : "NO"}

================ [1. HTML] ================
${quiz.generatedHtml}

================ [2. CSS] ================
${quiz.generatedCss}

================ [3. JAVASCRIPT] ================
${quiz.generatedJs}
`;

    const blob = new Blob([bundleText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `zqp-quiz-${quiz.title.toLowerCase().replace(/[^a-z0-9]/g, "-")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full gap-4">
      {/* CMS Requirements Status Bar */}
      <div className="bg-[#f3f8f7] border-2 border-[#bbd1cd] rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#1b5c53] mb-0.5">
            CMS-Aktivierung auf zqp.de
          </h4>
          <p className="text-xs text-[#444444]">
            Prüfen Sie vor dem Einfügen, welche Bibliotheken auf der Zielseite aktiviert sein müssen:
          </p>
        </div>

        <div className="flex items-center gap-2">
          {quiz.needsTailwind ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
              <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
              Tailwind CSS: JA
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700 border border-gray-300">
              Tailwind CSS: NEIN
            </span>
          )}

          {quiz.needsFontAwesome ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
              <span className="w-2 h-2 rounded-full bg-amber-600"></span>
              Font Awesome: JA
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700 border border-gray-300">
              Font Awesome: NEIN
            </span>
          )}
        </div>
      </div>

      {/* Code Editor Container */}
      <div className="flex-1 flex flex-col border border-[#bbd1cd] rounded-xl overflow-hidden shadow-sm bg-slate-900">
        {/* Sub-tabs header */}
        <div className="bg-slate-800 border-b border-slate-700 px-3 pt-2 flex items-center justify-between">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab("html")}
              className={`flex items-center gap-1.5 px-3 py-1.5 font-mono text-xs font-semibold rounded-t transition-colors ${
                activeTab === "html"
                  ? "bg-slate-900 text-[#3d998c] border-t border-x border-slate-700"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              <span>HTML (Gerüst)</span>
            </button>

            <button
              onClick={() => setActiveTab("css")}
              className={`flex items-center gap-1.5 px-3 py-1.5 font-mono text-xs font-semibold rounded-t transition-colors ${
                activeTab === "css"
                  ? "bg-slate-900 text-[#3d998c] border-t border-x border-slate-700"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Palette className="w-3.5 h-3.5" />
              <span>CSS (Stile & ZQP)</span>
            </button>

            <button
              onClick={() => setActiveTab("js")}
              className={`flex items-center gap-1.5 px-3 py-1.5 font-mono text-xs font-semibold rounded-t transition-colors ${
                activeTab === "js"
                  ? "bg-slate-900 text-[#3d998c] border-t border-x border-slate-700"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>JavaScript (Interaktion)</span>
            </button>
          </div>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-3 py-1 bg-[#247a6d] hover:bg-[#1b5c53] text-white text-xs font-semibold rounded shadow-sm transition-colors"
          >
            {copiedTab === activeTab ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Kopiert!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Segment kopieren</span>
              </>
            )}
          </button>
        </div>

        {/* Code View */}
        <pre className="p-4 font-mono text-xs text-slate-100 overflow-x-auto flex-1 leading-relaxed selection:bg-[#247a6d]">
          <code>{getCode()}</code>
        </pre>
      </div>

      {/* Footer Info & Download */}
      <div className="flex items-center justify-between pt-1">
        <span className="text-xs text-[#6e6c70] flex items-center gap-1">
          <AlertCircle className="w-3.5 h-3.5 text-[#247a6d]" />
          In WordPress als <strong>„Benutzerdefiniertes HTML“</strong>-Block einfügen.
        </span>

        <button
          onClick={handleDownloadZip}
          className="text-xs text-[#1b5c53] font-semibold hover:underline flex items-center gap-1"
        >
          <Download className="w-3.5 h-3.5 text-[#247a6d]" />
          <span>Gesamtes Quiz-Paket exportieren</span>
        </button>
      </div>
    </div>
  );
};
