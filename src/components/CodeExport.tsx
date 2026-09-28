import React, { useState } from "react";
import { Copy, Check, Download, AlertCircle, Code, Palette, Terminal, Sliders, FileCode } from "lucide-react";
import { QuizGenerationResult } from "../types";

interface CodeExportProps {
  quiz: QuizGenerationResult;
}

const DEFAULT_TAILWIND_CONFIG = `/**
 * ZQP Corporate Design - Tailwind CSS Konfiguration
 * 
 * 1. FÜR TAILWIND PLAY CDN IM BROWSER:
 *    Fügen Sie diesen Block in ein <script>-Tag direkt nach dem CDN-Script ein:
 *    <script src="https://cdn.tailwindcss.com"></script>
 *    <script>
 */
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
      },
      boxShadow: {
        paper: "0 2px 4px -1px rgba(50, 42, 30, 0.04), 1.5px 1.5px 0 #ede8df",
        "paper-hover": "0 3px 6px -1px rgba(50, 42, 30, 0.06), 2px 2px 0 rgba(36, 122, 109, 0.18)",
      }
    }
  }
};
/*
 * </script>
 * 
 * 2. FÜR EINE BUILD-PIPELINE (tailwind.config.js):
 *    export default {
 *      theme: {
 *        extend: {
 *          colors: { ... }
 *        }
 *      }
 *    };
 */`;

export const CodeExport: React.FC<CodeExportProps> = ({ quiz }) => {
  const [activeTab, setActiveTab] = useState<"html" | "css" | "js" | "tailwind">("html");
  const [includeTailwindInHtml, setIncludeTailwindInHtml] = useState<boolean>(true);
  const [copiedTab, setCopiedTab] = useState<string | null>(null);

  const getTailwindConfigCode = () => {
    return quiz.tailwindConfig || DEFAULT_TAILWIND_CONFIG;
  };

  const getCode = () => {
    switch (activeTab) {
      case "html": {
        const rawHtml = quiz.generatedHtml || "<!-- Kein HTML generiert -->";
        if (!includeTailwindInHtml) return rawHtml;

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
<!-- 2. ZQP QUIZ-CONTAINER                                             -->
<!-- ================================================================= -->
${rawHtml}`;
      }
      case "css":
        return quiz.generatedCss || "/* Keine zusätzlichen CSS-Regeln erforderlich (alles über Tailwind abgedeckt) */";
      case "js":
        return quiz.generatedJs || "// Keine zusätzliche JavaScript-Logik erforderlich";
      case "tailwind":
        return getTailwindConfigCode();
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
    // Generate complete text bundle download
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

================ [4. TAILWIND CONFIGURATION] ================
${getTailwindConfigCode()}
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
    const fullHtml = `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${quiz.title} - ZQP Quiz</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <!-- Tailwind CSS Play CDN -->
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
  <style>
    body {
      background-color: #f7faf9;
      margin: 0;
      padding: 1.5rem 1rem;
      font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      color: #444444;
    }
    ${quiz.generatedCss}
    /* Papierschnitt-Stile */
    .zqp-papercut-card {
      position: relative;
      background-color: #fdfbf7;
      background-image: 
        radial-gradient(ellipse at 50% 20%, rgba(255, 255, 255, 0.85) 0%, rgba(248, 244, 237, 0.6) 100%),
        url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.032'/%3E%3C/svg%3E");
      border: 1px solid #e2ddd5;
      border-radius: 0.75rem;
      box-shadow: 
        inset 0 1px 0 rgba(255, 255, 255, 0.95),
        inset 1px 0 0 rgba(255, 255, 255, 0.6),
        1.5px 1.5px 0 #ede8df,
        0 2px 4px -1px rgba(50, 42, 30, 0.04);
      user-select: none;
    }
    .zqp-papercut-selected {
      background-color: #f2f8f6 !important;
      border-color: #247a6d !important;
      box-shadow: 
        inset 0 1px 0 rgba(255, 255, 255, 0.95),
        inset 1px 0 0 rgba(255, 255, 255, 0.7),
        2px 2px 0 #1b5c53,
        0 2px 6px rgba(36, 122, 109, 0.12) !important;
    }
    .zqp-papercut-matched {
      border-color: #a3beba !important;
      box-shadow: 
        inset 0 1px 0 rgba(255, 255, 255, 0.9),
        1px 1px 0 #dbe6e4,
        0 1px 3px rgba(50, 42, 30, 0.03) !important;
    }
  </style>
</head>
<body>
  ${quiz.generatedHtml}
  <script>
    ${quiz.generatedJs}
  </script>
</body>
</html>`;

    const blob = new Blob([fullHtml], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `zqp-quiz-${quiz.title.toLowerCase().replace(/[^a-z0-9]/g, "-")}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full gap-4">
      {/* CMS Requirements Status Bar */}
      <div className="bg-[#f3f8f7] border-2 border-[#bbd1cd] rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#1b5c53] mb-0.5">
            CMS-Aktivierung & Styling auf zqp.de
          </h4>
          <p className="text-xs text-[#444444]">
            Damit Farben und Papierschnitt exakt wie in der Vorschau aussehen, binden Sie die Tailwind-Konfiguration ein:
          </p>
        </div>

        <div className="flex items-center gap-2">
          {quiz.needsTailwind ? (
            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                Tailwind CSS: JA
              </span>
              <button
                onClick={() => setActiveTab("tailwind")}
                className="text-xs font-mono font-bold text-[#1b5c53] hover:text-[#247a6d] underline px-1 py-0.5"
                title="Zur Tailwind-Konfiguration wechseln"
              >
                tailwind.config = {'{}'}
              </button>
            </div>
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
      <div className="flex-1 flex flex-col border border-[#bbd1cd] rounded-xl overflow-hidden shadow-sm bg-slate-900 min-h-[380px]">
        {/* Sub-tabs header */}
        <div className="bg-slate-800 border-b border-slate-700 px-3 pt-2 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-1">
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

            <button
              onClick={() => setActiveTab("tailwind")}
              className={`flex items-center gap-1.5 px-3 py-1.5 font-mono text-xs font-semibold rounded-t transition-colors ${
                activeTab === "tailwind"
                  ? "bg-slate-900 text-[#3d998c] border-t border-x border-slate-700"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Tailwind Config (JS)</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            {activeTab === "html" && (
              <label className="flex items-center gap-1.5 text-[11px] text-slate-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={includeTailwindInHtml}
                  onChange={(e) => setIncludeTailwindInHtml(e.target.checked)}
                  className="rounded border-slate-600 text-[#247a6d] focus:ring-[#247a6d] w-3.5 h-3.5"
                />
                <span>Inkl. Tailwind CDN & Config im Header</span>
              </label>
            )}

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
        </div>

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
