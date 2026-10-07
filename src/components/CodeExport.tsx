import React, { useState, useMemo } from "react";
import { Copy, Check, Download, AlertCircle, Code, Palette, Terminal, Sliders, FileCode, Printer } from "lucide-react";
import { QuizGenerationResult } from "../types";
import { compileQuizToBundle } from "../services/exportCompiler";

interface CodeExportProps {
  quiz: QuizGenerationResult;
  onTogglePrintSummary?: (enabled: boolean) => void;
}

export const CodeExport: React.FC<CodeExportProps> = ({ quiz, onTogglePrintSummary }) => {
  const [activeTab, setActiveTab] = useState<"html" | "css" | "js" | "tailwind">("html");
  const [includeTailwindInHtml, setIncludeTailwindInHtml] = useState<boolean>(true);
  const [copiedTab, setCopiedTab] = useState<string | null>(null);

  // Compile pixel-perfect production bundle matching QuizPreview 1:1
  const bundle = useMemo(() => compileQuizToBundle(quiz), [quiz]);

  const getCode = () => {
    switch (activeTab) {
      case "html": {
        if (!includeTailwindInHtml) return bundle.html;

        return `<!-- ================================================================= -->
<!-- 1. TAILWIND PLAY CDN & ZQP THEME CONFIGURATION                    -->
<!-- (Vor dem Quiz im Head oder direkt im Gutenberg HTML-Block einfügen) -->
<!-- ================================================================= -->
<script src="https://cdn.tailwindcss.com"></script>
<script>
tailwind.config = {
  theme: {
    extend: {
      colors: {
        zqp: {
          petrol: "#247a6d",
          "petrol-dark": "#1b5c53",
          "petrol-deep": "#00473d",
          "bg-soft": "#f3f8f7",
          "bg-accent": "#e3eeec",
          border: "#bbd1cd",
          text: "#444444",
          alert: "#722b28",
        }
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
      }
    }
  }
};
</script>

<!-- ================================================================= -->
<!-- 2. ZQP QUIZ-CONTAINER (1:1 VORSCHAU-TREU)                          -->
<!-- ================================================================= -->
${bundle.html}`;
      }
      case "css":
        return bundle.css;
      case "js":
        return bundle.js;
      case "tailwind":
        return bundle.tailwindConfig;
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
    const bundleText = `=== ZQP QUIZ EXPORT: ${quiz.title} ===
Target Audience: ${quiz.targetAudience}
Tailwind Required: ${quiz.needsTailwind ? "YES" : "NO"}
FontAwesome Required: ${quiz.needsFontAwesome ? "YES" : "NO"}

================ [1. HTML] ================
${bundle.html}

================ [2. CSS] ================
${bundle.css}

================ [3. JAVASCRIPT] ================
${bundle.js}

================ [4. TAILWIND CONFIGURATION] ================
${bundle.tailwindConfig}
`;

    const blob = new Blob([bundleText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `zqp-quiz-${quiz.title.toLowerCase().replace(/[^a-z0-9]/g, "-")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadStandaloneHtml = () => {
    const blob = new Blob([bundle.fullStandaloneHtml], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `zqp-quiz-${quiz.title.toLowerCase().replace(/[^a-z0-9]/g, "-")}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full gap-3">
      {/* Compact Export Controls & CMS Requirements Bar */}
      <div className="bg-white border border-[#bbd1cd] rounded-xl px-3.5 py-2 flex flex-wrap items-center justify-between gap-3 shadow-2xs shrink-0">
        {/* Left: Print / PDF Toggle */}
        <label className="flex items-center gap-2 cursor-pointer select-none group">
          <div className="w-6 h-6 rounded-md bg-[#f3f8f7] group-hover:bg-[#e3eeec] border border-[#bbd1cd] text-[#247a6d] flex items-center justify-center shrink-0 transition-colors">
            <Printer className="w-3 h-3" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#1b5c53]">
              Druck- & PDF-Button auf zqp.de:
            </span>
            <input
              type="checkbox"
              checked={quiz.enablePrintSummary ?? false}
              onChange={(e) => onTogglePrintSummary?.(e.target.checked)}
              className="rounded border-slate-400 text-[#247a6d] focus:ring-[#247a6d] w-3.5 h-3.5 cursor-pointer"
            />
            <span className="text-[11px] text-[#6e6c70]">
              {quiz.enablePrintSummary ? "Aktiviert (DIN-A4-Merkzettel)" : "Deaktiviert"}
            </span>
          </div>
        </label>

        {/* Right: CMS Asset Status */}
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-[#e3eeec] text-[#1b5c53] border border-[#bbd1cd] whitespace-nowrap shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-[#247a6d]" />
            Tailwind CSS: Erforderlich
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-[#f3f8f7] text-[#6e6c70] border border-[#bbd1cd] whitespace-nowrap shrink-0">
            Font Awesome: Nein
          </span>
        </div>
      </div>

      {/* Code Editor Container */}
      <div className="flex-1 flex flex-col border border-[#bbd1cd] rounded-xl overflow-hidden shadow-sm bg-slate-900 min-h-[380px]">
        {/* Single-row Tab Header */}
        <div className="bg-slate-800 border-b border-slate-700 px-3 pt-2 flex items-center justify-between gap-2 flex-nowrap">
          <div className="flex items-center gap-1 flex-nowrap overflow-x-auto">
            <button
              onClick={() => setActiveTab("html")}
              className={`flex items-center gap-1.5 px-3 py-1.5 font-mono text-xs font-semibold rounded-t transition-colors whitespace-nowrap shrink-0 ${
                activeTab === "html"
                  ? "bg-slate-900 text-[#3d998c] border-t border-x border-slate-700"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              <span>HTML</span>
            </button>

            <button
              onClick={() => setActiveTab("css")}
              className={`flex items-center gap-1.5 px-3 py-1.5 font-mono text-xs font-semibold rounded-t transition-colors whitespace-nowrap shrink-0 ${
                activeTab === "css"
                  ? "bg-slate-900 text-[#3d998c] border-t border-x border-slate-700"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Palette className="w-3.5 h-3.5" />
              <span>CSS</span>
            </button>

            <button
              onClick={() => setActiveTab("js")}
              className={`flex items-center gap-1.5 px-3 py-1.5 font-mono text-xs font-semibold rounded-t transition-colors whitespace-nowrap shrink-0 ${
                activeTab === "js"
                  ? "bg-slate-900 text-[#3d998c] border-t border-x border-slate-700"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>JavaScript</span>
            </button>

            <button
              onClick={() => setActiveTab("tailwind")}
              className={`flex items-center gap-1.5 px-3 py-1.5 font-mono text-xs font-semibold rounded-t transition-colors whitespace-nowrap shrink-0 ${
                activeTab === "tailwind"
                  ? "bg-slate-900 text-[#3d998c] border-t border-x border-slate-700"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Tailwind Config</span>
            </button>
          </div>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-3 py-1 bg-[#247a6d] hover:bg-[#1b5c53] text-white text-xs font-semibold rounded shadow-sm transition-colors whitespace-nowrap shrink-0"
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

        {/* Dedicated HTML Sub-Toolbar for Options */}
        {activeTab === "html" && (
          <div className="bg-slate-950/70 border-b border-slate-800 px-3.5 py-1.5 flex items-center justify-between text-xs text-slate-300">
            <span className="text-[11px] text-slate-400">WordPress Gutenberg / Custom-HTML-Block</span>
            <label className="flex items-center gap-1.5 text-[11px] text-slate-300 hover:text-white cursor-pointer select-none">
              <input
                type="checkbox"
                checked={includeTailwindInHtml}
                onChange={(e) => setIncludeTailwindInHtml(e.target.checked)}
                className="rounded border-slate-600 text-[#247a6d] focus:ring-[#247a6d] w-3.5 h-3.5"
              />
              <span>Inkl. Tailwind CDN & Config im Header</span>
            </label>
          </div>
        )}

        {/* Code View */}
        <pre className="p-4 font-mono text-xs text-slate-100 overflow-x-auto flex-1 leading-relaxed selection:bg-[#247a6d]">
          <code>{getCode()}</code>
        </pre>
      </div>

      {/* Footer Info & Download */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1">
        <span className="text-xs text-[#6e6c70] flex items-center gap-1">
          <AlertCircle className="w-3.5 h-3.5 text-[#247a6d] flex-shrink-0" />
          <span>In WordPress als <strong>„Benutzerdefiniertes HTML“</strong>-Block einfügen.</span>
        </span>

        <div className="flex items-center gap-3">
          <button
            onClick={handleDownloadStandaloneHtml}
            className="text-xs text-[#1b5c53] font-semibold hover:underline flex items-center gap-1.5 bg-[#f3f8f7] border border-[#bbd1cd] px-2.5 py-1 rounded-lg hover:border-[#247a6d] transition-colors"
            title="Generiert eine komplett eigenständige HTML-Datei zum direkten Öffnen im Browser"
          >
            <FileCode className="w-3.5 h-3.5 text-[#247a6d]" />
            <span>Fertige HTML-Datei (.html)</span>
          </button>

          <button
            onClick={handleDownloadZip}
            className="text-xs text-[#1b5c53] font-semibold hover:underline flex items-center gap-1"
          >
            <Download className="w-3.5 h-3.5 text-[#247a6d]" />
            <span>Gesamtes Text-Paket (.txt)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
