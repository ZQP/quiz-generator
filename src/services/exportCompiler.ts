import { QuizGenerationResult } from "../types";

export interface CompiledBundle {
  html: string;
  css: string;
  js: string;
  tailwindConfig: string;
  fullStandaloneHtml: string;
}

export function compileQuizToBundle(quiz: QuizGenerationResult): CompiledBundle {
  const currentYear = new Date().getFullYear();
  const targetCount = quiz.stations?.length || 1;
  const stationsJson = JSON.stringify(quiz.stations || []);

  const tailwindConfig = `/**
 * ZQP Corporate Design - Tailwind CSS Konfiguration
 * 
 * Für Tailwind Play CDN im HTML-Header:
 * <script src="https://cdn.tailwindcss.com"></script>
 * <script>
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
/* </script> */`;

  const css = `/* ==========================================================================
   ZQP INTERAKTIVES QUIZ & LERNSPIEL - STILREGELN (zqp.de)
   Vollständig isoliert unter #zqp-game-root (kompatibel mit WordPress / Gutenberg)
   ========================================================================== */

#zqp-game-root,
#zqp-game-root *,
#zqp-game-root *::before,
#zqp-game-root *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  -webkit-font-smoothing: antialiased;
}

#zqp-game-root {
  width: 100%;
  max-width: 672px;
  height: 570px;
  max-height: 85vh;
  margin: 1.5rem auto;
  background-color: #fbf9f5;
  border: 1px solid #d8d2c7;
  border-radius: 1rem;
  box-shadow: 0 4px 12px -2px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
  color: #444444;
}

@media (max-width: 640px) {
  #zqp-game-root {
    max-width: 100%;
    height: 570px;
    max-height: 88vh;
    border-radius: 0.75rem;
    margin: 0.5rem auto;
  }
}

/* 1. HEADER (PETROL-VERLAUF) */
#zqp-game-root .zqp-header {
  flex-shrink: 0;
  background: linear-gradient(135deg, #247a6d 0%, #1b5c53 100%) !important;
  color: #ffffff;
  padding: 0.875rem 1.25rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.06);
}

#zqp-game-root .zqp-header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.6875rem;
  color: #bbd1cd;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.25rem;
}

#zqp-game-root .zqp-badge-praxistest {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  color: #6ee7b7;
}

#zqp-game-root .zqp-header-title {
  font-size: 1.125rem;
  font-weight: 700;
  margin: 0;
  color: #ffffff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.25;
}

#zqp-game-root .zqp-progress-bar {
  width: 100%;
  height: 6px;
  background: #00473d;
  border-radius: 9999px;
  margin-top: 0.625rem;
  overflow: hidden;
}

#zqp-game-root .zqp-progress-fill {
  height: 100%;
  background: #34d399;
  border-radius: 9999px;
  transition: width 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

/* 2. BÜHNE / STAGE */
#zqp-game-root .zqp-stage {
  flex: 1 1 0%;
  min-height: 0;
  overflow-y: auto;
  padding: 0.875rem 1rem;
  position: relative;
  display: flex;
  flex-direction: column;
}

#zqp-game-root .zqp-stage::-webkit-scrollbar {
  width: 6px;
}
#zqp-game-root .zqp-stage::-webkit-scrollbar-track {
  background: #f3f8f7;
}
#zqp-game-root .zqp-stage::-webkit-scrollbar-thumb {
  background: #bbd1cd;
  border-radius: 4px;
}

#zqp-game-root .zqp-prompt-instruction {
  font-size: 0.8125rem;
  font-weight: 700;
  color: #1b5c53;
  line-height: 1.35;
  margin-bottom: 0.625rem;
}

#zqp-game-root .zqp-hint-banner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.6875rem;
  color: #6e6c70;
  background: #f2ede4;
  border: 1px solid #e2ddd5;
  padding: 0.25rem 0.625rem;
  border-radius: 0.5rem;
  margin-bottom: 0.5rem;
}

#zqp-game-root .zqp-hint-counter {
  font-weight: 700;
  color: #1b5c53;
}

/* 3. PAPERCUT-KARTEN (AUTHENTISCHER PAPIERSCHNITT) */
#zqp-game-root .zqp-papercut-card {
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
  padding: 0.5rem 0.625rem;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease, background-color 0.15s ease;
  user-select: none;
  -webkit-user-select: none;
  touch-action: none;
}

#zqp-game-root .zqp-papercut-card:hover:not(.locked) {
  transform: translateY(-1px);
  border-color: #247a6d;
  box-shadow: 
    inset 0 1px 0 rgba(255, 255, 255, 0.95),
    inset 1px 0 0 rgba(255, 255, 255, 0.7),
    2px 2px 0 rgba(36, 122, 109, 0.18),
    0 3px 6px -1px rgba(50, 42, 30, 0.06);
}

#zqp-game-root .zqp-papercut-selected {
  background-color: #f2f8f6 !important;
  border-color: #247a6d !important;
  box-shadow: 
    inset 0 1px 0 rgba(255, 255, 255, 0.95),
    inset 1px 0 0 rgba(255, 255, 255, 0.7),
    2px 2px 0 #1b5c53,
    0 2px 6px rgba(36, 122, 109, 0.12) !important;
  transform: translateY(-1px);
}

#zqp-game-root .zqp-papercut-matched {
  border-color: #a3beba !important;
  box-shadow: 
    inset 0 1px 0 rgba(255, 255, 255, 0.9),
    1px 1px 0 #dbe6e4,
    0 1px 3px rgba(50, 42, 30, 0.03) !important;
  cursor: default !important;
}

#zqp-game-root .zqp-papercut-tag {
  display: inline-flex;
  align-items: center;
  font-size: 0.5625rem;
  font-weight: 700;
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
  border: 1px solid rgba(60, 50, 40, 0.12);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.8), 0 1px 2px rgba(50, 42, 30, 0.03);
}

/* 4. FOOTER & BUTTONS */
#zqp-game-root .zqp-footer {
  flex-shrink: 0;
  border-top: 1px solid #bbd1cd;
  background-color: #ffffff;
  padding: 0.625rem 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
}

#zqp-game-root .zqp-btn-primary {
  background-color: #247a6d;
  color: #ffffff;
  border: none;
  border-radius: 0.5rem;
  padding: 0.45rem 0.875rem;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  transition: background 0.15s, opacity 0.15s;
}

#zqp-game-root .zqp-btn-primary:hover:not(:disabled) {
  background-color: #1b5c53;
}

#zqp-game-root .zqp-btn-primary:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

#zqp-game-root .zqp-btn-secondary {
  background-color: #f3f8f7;
  color: #1b5c53;
  border: 1px solid #bbd1cd;
  border-radius: 0.5rem;
  padding: 0.4rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  transition: all 0.15s;
}

#zqp-game-root .zqp-btn-secondary:hover {
  background-color: #e3eeec;
  border-color: #247a6d;
}

#zqp-game-root .zqp-copyright-footer {
  flex-shrink: 0;
  background-color: #f3f8f7;
  border-top: 1px solid rgba(187, 209, 205, 0.6);
  padding: 0.3rem 1rem;
  text-align: center;
  font-size: 0.6875rem;
  color: #6e6c70;
  font-weight: 500;
  letter-spacing: 0.02em;
}

/* 5. SLIDE-UP DRAWER */
#zqp-game-root .zqp-drawer {
  position: absolute;
  inset-inline: 0;
  bottom: 0;
  max-height: 82%;
  background: #fdfcf9;
  border-top: 2px solid #247a6d;
  box-shadow: 0 -10px 25px -5px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  transform: translateY(100%);
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  z-index: 20;
}

#zqp-game-root .zqp-drawer.open {
  transform: translateY(0);
}

#zqp-game-root .zqp-drawer-correct {
  border-top-color: #10b981;
}

#zqp-game-root .zqp-drawer-revealed {
  border-top-color: #f59e0b;
}

#zqp-game-root .zqp-drawer-incorrect {
  border-top-color: #ef4444;
}

#zqp-game-root .zqp-drawer-header {
  padding: 0.5rem 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f2ede4;
  border-bottom: 1px solid #bbd1cd;
}

#zqp-game-root .zqp-drawer-title {
  font-size: 0.75rem;
  font-weight: 700;
  color: #1b5c53;
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

#zqp-game-root .zqp-btn-close-drawer {
  background: transparent;
  border: none;
  font-size: 0.6875rem;
  font-weight: 700;
  color: #6e6c70;
  cursor: pointer;
  padding: 0.2rem 0.4rem;
  border-radius: 0.25rem;
}

#zqp-game-root .zqp-btn-close-drawer:hover {
  background: #e3eeec;
  color: #1b5c53;
}

#zqp-game-root .zqp-drawer-body {
  padding: 0.75rem 1rem;
  font-size: 0.75rem;
  line-height: 1.45;
  color: #334155;
  overflow-y: auto;
  flex: 1;
}

#zqp-game-root .zqp-drawer-card {
  padding: 0.625rem;
  border-radius: 0.5rem;
  margin-bottom: 0.5rem;
}

#zqp-game-root .zqp-drawer-card-explanation {
  background: #faf8f5;
  border: 1px solid #e2ddd5;
}

#zqp-game-root .zqp-drawer-card-zqp {
  background: #edf7f4;
  border: 1px solid #bbd1cd;
}

#zqp-game-root .zqp-drawer-actions {
  padding: 0.5rem 1rem;
  display: flex;
  justify-content: flex-end;
  border-top: 1px solid #bbd1cd;
  background: #ffffff;
}

/* 6. FLOATING GHOST ELEMENT FOR POINTER DRAG */
.zqp-floating-ghost {
  position: fixed;
  pointer-events: none;
  z-index: 999999;
  box-shadow: 0 12px 28px -4px rgba(0,0,0,0.22);
  border-radius: 0.75rem;
  border: 2px solid #247a6d;
  background: rgba(255,255,255,0.96);
  padding: 0.45rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 700;
  color: #1b5c53;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  transform: translate(-50%, -50%) rotate(2deg) scale(1.05);
  white-space: nowrap;
  max-width: 240px;
  overflow: hidden;
  text-overflow: ellipsis;
  user-select: none;
}
`;

  const html = `<!-- ZQP Interaktives Lern-Quiz (zqp.de) -->
<div id="zqp-game-root">
  <header class="zqp-header">
    <div class="zqp-header-top">
      <span class="zqp-badge-praxistest">🧩 ZQP INTERAKTIVER PRAXISTEST</span>
      <span id="zqp-station-counter">Station 1 von ${targetCount}</span>
    </div>
    <h2 id="zqp-game-title" class="zqp-header-title">${quiz.title}</h2>
    <div class="zqp-progress-bar">
      <div id="zqp-progress-fill" class="zqp-progress-fill" style="width: ${(1 / targetCount) * 100}%;"></div>
    </div>
  </header>

  <main id="zqp-game-stage" class="zqp-stage">
    <div id="zqp-station-content">
      <!-- Station-Inhalt wird dynamisch gerendert -->
    </div>
  </main>

  <footer class="zqp-footer">
    <div>
      <button id="zqp-btn-reveal" type="button" class="zqp-btn-secondary">
        💡 Lösung anzeigen
      </button>
    </div>
    <div id="zqp-footer-actions">
      <button id="zqp-btn-action" type="button" class="zqp-btn-primary" disabled>
        ${targetCount === 1 ? "Zur Gesamtauswertung ➔" : "Nächste Station ➔"}
      </button>
    </div>
  </footer>

  <div class="zqp-copyright-footer">
    Stiftung Zentrum für Qualität in der Pflege • ${currentYear}
  </div>

  <!-- Slide-Up Feedback Drawer -->
  <div id="zqp-drawer" class="zqp-drawer">
    <div class="zqp-drawer-header">
      <div id="zqp-drawer-title" class="zqp-drawer-title">✓ Auswertung</div>
      <button id="zqp-btn-close-drawer" type="button" class="zqp-btn-close-drawer">
        Ansicht ansehen ✕
      </button>
    </div>
    <div id="zqp-drawer-body" class="zqp-drawer-body"></div>
    <div class="zqp-drawer-actions">
      <button id="zqp-btn-drawer-next" type="button" class="zqp-btn-primary">
        ${targetCount === 1 ? "Zur Gesamtauswertung ➔" : "Nächste Station ➔"}
      </button>
    </div>
  </div>
</div>`;

  const js = `/* ==========================================================================
   ZQP Quiz Engine - Vanilla JavaScript (Reines DOM, Pointer Drag & Drop)
   ========================================================================== */
(function() {
  var root = document.getElementById("zqp-game-root");
  if (!root) return;

  var stationsData = ${stationsJson};
  var totalStations = stationsData.length;
  var currentStation = 0;
  var stationResults = {}; // idx -> "solved" | "unsolved"
  var canAdvance = false;

  // Station specific state
  var selectedThreat = null;
  var matchedIds = [];
  var orderedSteps = [];
  var bucketAssignments = {};
  var filledBlanks = {};
  var checkedItemIds = [];
  var selectedChoiceIdx = null;
  var selectedDilemmaId = null;

  // Drag state
  var pointerDrag = null;
  var hoverTarget = null;
  var dragGhost = null;

  var pairColorThemes = [
    { border: "#14b8a6", bg: "#f0fdfa", badgeBg: "#247a6d", label: "Paar #1" },
    { border: "#10b981", bg: "#ecfdf5", badgeBg: "#059669", label: "Paar #2" },
    { border: "#0891b2", bg: "#ecfeff", badgeBg: "#0e7490", label: "Paar #3" },
    { border: "#6366f1", bg: "#eef2ff", badgeBg: "#4338ca", label: "Paar #4" },
    { border: "#f59e0b", bg: "#fffbeb", badgeBg: "#b45309", label: "Paar #5" }
  ];

  var btnReveal = document.getElementById("zqp-btn-reveal");
  var btnAction = document.getElementById("zqp-btn-action");
  var counter = document.getElementById("zqp-station-counter");
  var progressFill = document.getElementById("zqp-progress-fill");
  var content = document.getElementById("zqp-station-content");
  var drawer = document.getElementById("zqp-drawer");
  var drawerTitle = document.getElementById("zqp-drawer-title");
  var drawerBody = document.getElementById("zqp-drawer-body");
  var btnCloseDrawer = document.getElementById("zqp-btn-close-drawer");
  var btnDrawerNext = document.getElementById("zqp-btn-drawer-next");

  function closeDrawer() {
    if (drawer) drawer.classList.remove("open");
  }

  function openDrawer(type, title, explanation, zqpInfo) {
    if (!drawer) return;
    drawer.className = "zqp-drawer open " + 
      (type === "correct" ? "zqp-drawer-correct" : type === "revealed" ? "zqp-drawer-revealed" : "zqp-drawer-incorrect");
    if (drawerTitle) {
      drawerTitle.innerHTML = (type === "correct" ? "✓ " : type === "revealed" ? "💡 " : "⚠️ ") + title;
    }
    if (drawerBody) {
      drawerBody.innerHTML = 
        '<div class="zqp-drawer-card zqp-drawer-card-explanation">' +
          '<strong style="color:#1b5c53; display:block; margin-bottom:0.25rem;">Warum richtig / Warum falsch:</strong>' +
          '<p style="margin:0;">' + (explanation || "") + '</p>' +
        '</div>' +
        (zqpInfo ? (
          '<div class="zqp-drawer-card zqp-drawer-card-zqp">' +
            '<strong style="color:#1b5c53; display:block; margin-bottom:0.25rem;">ZQP-Praxiswissen:</strong>' +
            '<p style="margin:0; color:#1b5c53;">' + zqpInfo + '</p>' +
          '</div>'
        ) : '');
    }
  }

  function markStationCompleted(mode, explanation, zqpInfo) {
    canAdvance = true;
    stationResults[currentStation] = mode;
    if (btnAction) {
      btnAction.disabled = false;
      btnAction.textContent = (currentStation === totalStations - 1) ? "Zur Gesamtauswertung ➔" : "Nächste Station ➔";
    }
    if (btnDrawerNext) {
      btnDrawerNext.textContent = (currentStation === totalStations - 1) ? "Zur Gesamtauswertung ➔" : "Nächste Station ➔";
    }
    if (btnReveal) btnReveal.textContent = "💡 Erklärung anzeigen";
    openDrawer(mode === "solved" ? "correct" : "revealed", mode === "solved" ? "Richtig gelöst!" : "Lösung aufgedeckt", explanation, zqpInfo);
  }

  function renderStation(idx) {
    closeDrawer();
    canAdvance = false;
    selectedThreat = null;
    matchedIds = [];
    selectedChoiceIdx = null;
    selectedDilemmaId = null;
    checkedItemIds = [];
    bucketAssignments = {};
    filledBlanks = {};

    var st = stationsData[idx];
    if (!st) return;

    if (btnAction) {
      btnAction.disabled = true;
      btnAction.textContent = (idx === totalStations - 1) ? "Zur Gesamtauswertung ➔" : "Nächste Station ➔";
    }
    if (btnReveal) {
      btnReveal.textContent = "💡 Lösung anzeigen";
    }
    if (counter) counter.textContent = "Station " + (idx + 1) + " von " + totalStations;
    if (progressFill) progressFill.style.width = (((idx + 1) / totalStations) * 100) + "%";

    if (st.type === "matching" && st.matchingPairs) {
      renderMatching(st);
    } else if (st.type === "ordering" && st.orderingSteps) {
      orderedSteps = st.orderingSteps.slice().sort(function(a, b) {
        return (a.correctIndex % 2) - (b.correctIndex % 2);
      });
      renderOrdering(st);
    } else if (st.type === "comparison" && st.comparisonScenarios) {
      renderComparison(st);
    } else if (st.type === "single_choice" && st.options) {
      renderSingleChoice(st);
    } else if (st.type === "dilemma" && st.dilemmaReactions) {
      renderDilemma(st);
    } else if (st.type === "myth_fact") {
      renderMythFact(st);
    } else if (st.type === "bucket_sort" && st.bucketSortItems) {
      renderBucketSort(st);
    } else if (st.type === "checklist" && st.checklistItems) {
      renderChecklist(st);
    } else if (st.type === "fill_in_the_blank" && st.fillInBlanks) {
      renderFillInBlank(st);
    } else {
      renderGeneric(st);
    }
  }

  // 1. MATCHING RENDERER
  function renderMatching(st) {
    var pairs = st.matchingPairs || [];
    var html = '<h3 class="zqp-prompt-instruction">' + st.promptOrInstruction + '</h3>' +
      '<div class="zqp-hint-banner">' +
        '<span>Kärtchen per Drag & Drop oder Klick verknüpfen:</span>' +
        '<span class="zqp-hint-counter" id="zqp-match-counter">' + matchedIds.length + ' von ' + pairs.length + ' verzahnt</span>' +
      '</div>' +
      '<div style="display:grid; grid-template-columns:1fr 1fr; gap:0.5rem;">' +
        '<div>' +
          '<div class="zqp-papercut-tag" style="background:#fef8eb; border-color:#fcd34d; color:#78350f; margin-bottom:0.35rem;">⚠️ GEFAHRENQUELLE</div>' +
          '<div style="display:flex; flex-direction:column; gap:0.4rem;" id="zqp-threats-col">';

    pairs.forEach(function(pair, pIdx) {
      var isMatched = matchedIds.indexOf(pair.id) !== -1;
      var isSelected = selectedThreat && selectedThreat.id === pair.id;
      var theme = pairColorThemes[pIdx % pairColorThemes.length];
      var cardStyle = isMatched 
        ? 'background:' + theme.bg + '; border-color:' + theme.border + ';' 
        : (isSelected ? 'background:#f2f8f6; border-color:#247a6d;' : '');

      html += '<div class="zqp-papercut-card ' + (isMatched ? 'zqp-papercut-matched locked' : (isSelected ? 'zqp-papercut-selected' : '')) + '" ' +
        'style="' + cardStyle + '" data-threat-id="' + pair.id + '" onpointerdown="window.zqpStartDrag(event, \'matching\', \'' + pair.id + '\', \'' + pair.threatOrTerm.replace(/'/g, "\\'") + '\')">' +
          '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.25rem;">' +
            '<span class="zqp-papercut-tag" style="background:#fef4e8; color:#451a03; border-color:#fed7aa;">Teil A-' + (pIdx + 1) + '</span>' +
            (isMatched ? '<span class="zqp-papercut-tag" style="background:' + theme.badgeBg + '; color:#fff;">✓ ' + theme.label + '</span>' : '<span style="font-size:0.5625rem; color:#8e8578; font-family:monospace;">Ziehen 🖐️</span>') +
          '</div>' +
          '<div style="font-size:0.75rem; font-weight:600; color:#3a352d; line-height:1.25;">' + pair.threatOrTerm + '</div>' +
        '</div>';
    });

    html += '</div></div><div>' +
      '<div class="zqp-papercut-tag" style="background:#edf7f4; border-color:#6ee7b7; color:#064e3b; margin-bottom:0.35rem;">🛡️ SCHUTZMASSNAHME</div>' +
      '<div style="display:flex; flex-direction:column; gap:0.4rem;" id="zqp-solutions-col">';

    // Deterministic shuffle for solutions
    var solPairs = pairs.slice().reverse();
    solPairs.forEach(function(pair, sIdx) {
      var isMatched = matchedIds.indexOf(pair.id) !== -1;
      var pOrigIdx = pairs.findIndex(function(p) { return p.id === pair.id; });
      var theme = pairColorThemes[pOrigIdx % pairColorThemes.length];
      var cardStyle = isMatched ? 'background:' + theme.bg + '; border-color:' + theme.border + ';' : '';

      html += '<div class="zqp-papercut-card ' + (isMatched ? 'zqp-papercut-matched locked' : '') + '" ' +
        'style="' + cardStyle + '" data-drop-solution-id="' + pair.id + '" onclick="window.zqpClickSolution(\'' + pair.id + '\')">' +
          '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.25rem;">' +
            '<span class="zqp-papercut-tag" style="background:#ecfdf5; color:#064e3b; border-color:#a7f3d0;">Teil B-' + (sIdx + 1) + '</span>' +
            '<span style="font-size:0.5625rem; color:#6e6c70;">Gegenstück</span>' +
          '</div>' +
          '<div style="font-size:0.75rem; font-weight:600; color:#3a352d; line-height:1.25;">' + pair.solutionOrDef + '</div>' +
        '</div>';
    });

    html += '</div></div></div>';
    content.innerHTML = html;
  }

  window.zqpClickSolution = function(solId) {
    if (canAdvance) return;
    if (selectedThreat) {
      checkMatch(selectedThreat.id, solId);
    }
  };

  function checkMatch(thId, solId) {
    var st = stationsData[currentStation];
    if (thId === solId) {
      if (matchedIds.indexOf(solId) === -1) {
        matchedIds.push(solId);
      }
      selectedThreat = null;
      renderMatching(st);
      if (matchedIds.length === st.matchingPairs.length) {
        markStationCompleted("solved", st.solutionExplanation || "Alle Gefahren erfolgreich abgesichert!", st.zqpRationale);
      }
    } else {
      selectedThreat = null;
      renderMatching(st);
      openDrawer("incorrect", "Nicht optimal", "Diese Schutzmaßnahme passt zu einer anderen Gefahrenstelle. Versuchen Sie eine andere Kombination.", st.zqpRationale);
    }
  }

  // 2. ORDERING RENDERER
  function renderOrdering(st) {
    var html = '<h3 class="zqp-prompt-instruction">' + st.promptOrInstruction + '</h3>' +
      '<div class="zqp-hint-banner"><span>Bringen Sie die Schritte in die richtige chronologische Reihenfolge:</span></div>' +
      '<div style="display:flex; flex-direction:column; gap:0.45rem;">';

    orderedSteps.forEach(function(step, idx) {
      html += '<div class="zqp-papercut-card" style="display:flex; align-items:center; gap:0.625rem;" data-drop-step-idx="' + idx + '" onpointerdown="window.zqpStartDrag(event, \'ordering\', \'' + idx + '\', \'' + step.text.replace(/'/g, "\\'") + '\')">' +
        '<span style="width:1.5rem; height:1.5rem; border-radius:9999px; background:#247a6d; color:#fff; font-weight:700; font-size:0.6875rem; display:flex; align-items:center; justify-content:center; shrink-0;">' + (idx + 1) + '</span>' +
        '<div style="flex:1; font-size:0.75rem; font-weight:600; color:#3a352d;">' + step.text + '</div>' +
        '<span style="font-size:0.875rem; color:#9ca3af; cursor:grab;">☰</span>' +
      '</div>';
    });

    html += '</div>';
    content.innerHTML = html;
  }

  // 3. COMPARISON RENDERER
  function renderComparison(st) {
    var html = '<h3 class="zqp-prompt-instruction">' + st.promptOrInstruction + '</h3>' +
      '<div style="display:grid; grid-template-columns:1fr 1fr; gap:0.625rem;">';

    st.comparisonScenarios.forEach(function(sc, idx) {
      html += '<div class="zqp-papercut-card" onclick="window.zqpSelectComparison(' + idx + ')">' +
        '<span class="zqp-papercut-tag" style="background:#f1f5f9; margin-bottom:0.35rem;">' + (sc.badge || ('Szenario ' + sc.id)) + '</span>' +
        '<h4 style="font-size:0.8125rem; font-weight:700; color:#1b5c53; margin-bottom:0.25rem;">' + sc.title + '</h4>' +
        '<p style="font-size:0.6875rem; color:#555; line-height:1.35;">' + sc.description + '</p>' +
      '</div>';
    });

    html += '</div>';
    content.innerHTML = html;
  }

  window.zqpSelectComparison = function(cIdx) {
    var st = stationsData[currentStation];
    var sc = st.comparisonScenarios[cIdx];
    if (sc.isCorrect) {
      markStationCompleted("solved", sc.explanation, st.zqpRationale);
    } else {
      openDrawer("incorrect", "Erhöhtes Sturzrisiko", sc.explanation, st.zqpRationale);
    }
  };

  // 4. SINGLE CHOICE RENDERER
  function renderSingleChoice(st) {
    var html = '<h3 class="zqp-prompt-instruction">' + st.promptOrInstruction + '</h3>' +
      '<div style="display:flex; flex-direction:column; gap:0.45rem;">';

    st.options.forEach(function(opt, idx) {
      var letters = ["A", "B", "C", "D"];
      var isSel = selectedChoiceIdx === idx;
      html += '<div class="zqp-papercut-card ' + (isSel ? 'zqp-papercut-selected' : '') + '" onclick="window.zqpSelectOption(' + idx + ')">' +
        '<div style="display:flex; align-items:center; gap:0.5rem;">' +
          '<span style="width:1.35rem; height:1.35rem; border-radius:9999px; border:1px solid ' + (isSel ? '#247a6d' : '#bbd1cd') + '; background:' + (isSel ? '#247a6d' : '#ffffff') + '; color:' + (isSel ? '#ffffff' : '#6e6c70') + '; font-weight:700; font-size:0.6875rem; display:flex; align-items:center; justify-content:center;">' + letters[idx] + '</span>' +
          '<span style="font-size:0.75rem; font-weight:600; color:#3a352d; flex:1;">' + opt.text + '</span>' +
        '</div>' +
      '</div>';
    });

    html += '</div>' +
      '<div style="margin-top:0.75rem; display:flex; justify-content:flex-end;">' +
        '<button type="button" class="zqp-btn-primary" onclick="window.zqpCheckOption()">' +
          'Antwort prüfen' +
        '</button>' +
      '</div>';
    content.innerHTML = html;
  }

  window.zqpSelectOption = function(idx) {
    if (canAdvance) return;
    selectedChoiceIdx = idx;
    var st = stationsData[currentStation];
    renderSingleChoice(st);
  };

  window.zqpCheckOption = function() {
    if (selectedChoiceIdx === null) return;
    var st = stationsData[currentStation];
    var opt = st.options[selectedChoiceIdx];
    if (opt.isCorrect) {
      markStationCompleted("solved", opt.explanation, st.zqpRationale);
    } else {
      openDrawer("incorrect", "Nicht ganz richtig", opt.explanation, st.zqpRationale);
    }
  };

  // 4b. DILEMMA RENDERER
  function renderDilemma(st) {
    var html = '<h3 class="zqp-prompt-instruction">' + st.promptOrInstruction + '</h3>' +
      '<div class="zqp-hint-banner"><span>Wählen Sie die pädagogisch und pflegerisch optimalste Reaktion:</span></div>' +
      '<div style="display:flex; flex-direction:column; gap:0.45rem;">';

    (st.dilemmaReactions || []).forEach(function(reaction) {
      var isSel = selectedDilemmaId === reaction.id;
      html += '<div class="zqp-papercut-card ' + (isSel ? 'zqp-papercut-selected' : '') + (canAdvance ? ' locked' : '') + '" onclick="window.zqpSelectDilemma(\'' + reaction.id + '\')">' +
        '<div style="display:flex; align-items:flex-start; gap:0.5rem;">' +
          '<span style="width:1.25rem; height:1.25rem; border-radius:9999px; border:2px solid #247a6d; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:0.625rem; color:#1b5c53; flex-shrink:0; margin-top:0.1rem;">' + (isSel ? '✓' : '') + '</span>' +
          '<span style="font-size:0.75rem; font-weight:600; color:#3a352d; line-height:1.4; flex:1;">' + reaction.text + '</span>' +
        '</div>' +
      '</div>';
    });

    html += '</div>';
    content.innerHTML = html;
  }

  window.zqpSelectDilemma = function(id) {
    if (canAdvance) return;
    selectedDilemmaId = id;
    var st = stationsData[currentStation];
    renderDilemma(st);
    var reaction = (st.dilemmaReactions || []).find(function(r) { return r.id === id; });
    if (!reaction) return;

    if (reaction.isOptimal) {
      markStationCompleted("solved", reaction.consequence + " • " + reaction.zqpAdvice, st.zqpRationale || st.solutionExplanation);
    } else {
      openDrawer("incorrect", "Problematische Reaktion für den Pflegealltag", reaction.consequence + " • " + reaction.zqpAdvice, st.solutionExplanation || "Versuchen Sie, die Selbstbestimmung der Person mit dezenten Hilfen zu wahren.");
    }
  };

  // 5. MYTH VS FACT RENDERER
  function renderMythFact(st) {
    var item = (st.mythFactItems && st.mythFactItems[0]) || { statement: st.promptOrInstruction, isFact: false, explanation: st.solutionExplanation };
    var html = '<h3 class="zqp-prompt-instruction">' + st.promptOrInstruction + '</h3>' +
      '<div class="zqp-papercut-card" style="padding:1rem; text-align:center; font-size:0.875rem; font-weight:700; color:#1b5c53; margin-bottom:1rem;" onpointerdown="window.zqpStartDrag(event, \'myth_fact\', \'statement\', \'Aussage\')">' +
        '„' + item.statement + '“' +
      '</div>' +
      '<div style="display:grid; grid-template-columns:1fr 1fr; gap:0.75rem;">' +
        '<div class="zqp-papercut-card" data-drop-myth-target="myth" onclick="window.zqpSelectMyth(false)" style="text-align:center; padding:0.75rem; background:#fff7ed; border-color:#fdba74;">' +
          '<div style="font-size:1.25rem;">❌</div>' +
          '<div style="font-weight:700; color:#9a3412; font-size:0.8125rem;">MYTHOS</div>' +
        '</div>' +
        '<div class="zqp-papercut-card" data-drop-myth-target="fact" onclick="window.zqpSelectMyth(true)" style="text-align:center; padding:0.75rem; background:#ecfdf5; border-color:#86efac;">' +
          '<div style="font-size:1.25rem;">✅</div>' +
          '<div style="font-weight:700; color:#166534; font-size:0.8125rem;">FAKT</div>' +
        '</div>' +
      '</div>';
    content.innerHTML = html;
  }

  window.zqpSelectMyth = function(userThinksFact) {
    var st = stationsData[currentStation];
    var item = (st.mythFactItems && st.mythFactItems[0]) || { isFact: false, explanation: st.solutionExplanation };
    if (userThinksFact === item.isFact) {
      markStationCompleted("solved", item.explanation, st.zqpRationale);
    } else {
      openDrawer("incorrect", "Irrtum", item.explanation, st.zqpRationale);
    }
  };

  // 6. BUCKET SORT RENDERER
  function renderBucketSort(st) {
    var items = st.bucketSortItems || [];
    var html = '<h3 class="zqp-prompt-instruction">' + st.promptOrInstruction + '</h3>' +
      '<div style="display:grid; grid-template-columns:1fr 1fr; gap:0.5rem; margin-bottom:0.75rem;">' +
        '<div class="zqp-papercut-card" data-drop-bucket="do" style="background:#f0fdf4; border-color:#86efac; min-height:80px; padding:0.5rem;">' +
          '<div class="zqp-papercut-tag" style="background:#dcfce7; color:#166534;">🟢 EMPFOHLEN (DO)</div>' +
          '<div id="zqp-bucket-do-items" style="display:flex; flex-direction:column; gap:0.25rem; margin-top:0.35rem;"></div>' +
        '</div>' +
        '<div class="zqp-papercut-card" data-drop-bucket="dont" style="background:#fef2f2; border-color:#fca5a5; min-height:80px; padding:0.5rem;">' +
          '<div class="zqp-papercut-tag" style="background:#fee2e2; color:#991b1b;">🔴 VERMEIDEN (DON\'T)</div>' +
          '<div id="zqp-bucket-dont-items" style="display:flex; flex-direction:column; gap:0.25rem; margin-top:0.35rem;"></div>' +
        '</div>' +
      '</div>' +
      '<div style="display:flex; flex-direction:column; gap:0.35rem;">';

    items.forEach(function(it) {
      var assigned = bucketAssignments[it.id];
      if (!assigned) {
        html += '<div class="zqp-papercut-card" onpointerdown="window.zqpStartDrag(event, \'bucket_sort\', \'' + it.id + '\', \'' + it.text.replace(/'/g, "\\'") + '\')">' +
          '<div style="font-size:0.75rem; font-weight:600; color:#3a352d;">' + it.text + '</div>' +
        '</div>';
      }
    });

    html += '</div>';
    content.innerHTML = html;
  }

  // 7. CHECKLIST RENDERER
  function renderChecklist(st) {
    var items = st.checklistItems || [];
    var html = '<h3 class="zqp-prompt-instruction">' + st.promptOrInstruction + '</h3>' +
      '<div style="display:flex; flex-direction:column; gap:0.45rem;">';

    items.forEach(function(item) {
      var checked = checkedItemIds.indexOf(item.id) !== -1;
      html += '<div class="zqp-papercut-card ' + (checked ? 'zqp-papercut-selected' : '') + '" onclick="window.zqpToggleCheck(\'' + item.id + '\')">' +
        '<div style="display:flex; align-items:center; gap:0.5rem;">' +
          '<span style="width:1.25rem; height:1.25rem; border-radius:0.25rem; border:1.5px solid ' + (checked ? '#247a6d' : '#bbd1cd') + '; background:' + (checked ? '#247a6d' : '#ffffff') + '; color:#fff; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:0.6875rem;">' + (checked ? '✓' : '') + '</span>' +
          '<span style="font-size:0.75rem; font-weight:600; color:#3a352d; flex:1;">' + item.text + '</span>' +
        '</div>' +
      '</div>';
    });

    html += '</div>' +
      '<div style="margin-top:0.75rem; display:flex; justify-content:flex-end;">' +
        '<button type="button" class="zqp-btn-primary" onclick="window.zqpCheckChecklist()">' +
          'Auswahl prüfen' +
        '</button>' +
      '</div>';
    content.innerHTML = html;
  }

  window.zqpToggleCheck = function(id) {
    if (canAdvance) return;
    var idx = checkedItemIds.indexOf(id);
    if (idx === -1) checkedItemIds.push(id);
    else checkedItemIds.splice(idx, 1);
    var st = stationsData[currentStation];
    renderChecklist(st);
  };

  window.zqpCheckChecklist = function() {
    var st = stationsData[currentStation];
    var allCorrect = (st.checklistItems || []).every(function(it) {
      var isChecked = checkedItemIds.indexOf(it.id) !== -1;
      return it.isCorrect === isChecked;
    });
    if (allCorrect) {
      markStationCompleted("solved", st.solutionExplanation || "Alle zutreffenden Punkte korrekt identifiziert!", st.zqpRationale);
    } else {
      openDrawer("incorrect", "Noch nicht vollständig", "Einige ausgewählte Maßnahmen sind nicht optimal oder wichtige Punkte fehlen noch.", st.zqpRationale);
    }
  };

  // 8. FILL IN THE BLANKS RENDERER
  function renderFillInBlank(st) {
    var html = '<h3 class="zqp-prompt-instruction">' + st.promptOrInstruction + '</h3>' +
      '<div class="zqp-papercut-card" style="padding:0.75rem; margin-bottom:0.75rem; font-size:0.8125rem; line-height:1.6;">' +
        st.fillInSentence.replace(/\\[BLANK_(\\d+)\\]/g, function(match, id) {
          var bKey = "BLANK_" + id;
          var val = filledBlanks[bKey] || "___";
          return '<span data-drop-blank-id="' + bKey + '" style="font-weight:700; color:#247a6d; border-bottom:2px dashed #247a6d; padding:0 0.35rem; margin:0 0.2rem;">' + val + '</span>';
        }) +
      '</div>' +
      '<div class="zqp-hint-banner"><span>Wortbausteine:</span></div>' +
      '<div style="display:flex; flex-wrap:wrap; gap:0.35rem;">';

    (st.fillInBlanks || []).forEach(function(b) {
      (b.options || []).forEach(function(opt) {
        html += '<div class="zqp-papercut-card" onpointerdown="window.zqpStartDrag(event, \'fill_in_the_blank\', \'' + opt + '\', \'' + opt + '\')">' +
          '<span style="font-size:0.75rem; font-weight:700; color:#1b5c53;">' + opt + '</span>' +
        '</div>';
      });
    });

    html += '</div>';
    content.innerHTML = html;
  }

  function renderGeneric(st) {
    content.innerHTML = '<h3 class="zqp-prompt-instruction">' + st.promptOrInstruction + '</h3>' +
      '<div class="zqp-papercut-card" style="padding:1rem; text-align:center;">' +
        '<p style="font-size:0.8125rem; color:#6e6c70; margin-bottom:0.5rem;">Klicken Sie auf Lösung anzeigen, um diese Station zu begutachten.</p>' +
      '</div>';
  }

  // 9. END SUMMARY SCREEN
  function renderEndSummary() {
    closeDrawer();
    if (counter) counter.textContent = "Abgeschlossen";
    if (progressFill) progressFill.style.width = "100%";
    if (btnReveal) btnReveal.style.display = "none";
    if (btnAction) btnAction.style.display = "none";

    var solvedCount = 0;
    for (var i = 0; i < totalStations; i++) {
      if (stationResults[i] === "solved") solvedCount++;
    }

    var html = '<div style="text-align:center; padding:1rem 0.5rem;">' +
      '<div style="font-size:2.5rem; margin-bottom:0.35rem;">🏆</div>' +
      '<h3 style="font-size:1.125rem; font-weight:700; color:#1b5c53; margin-bottom:0.25rem;">' +
        (solvedCount === totalStations ? "Hervorragend! Alle Stationen gemeistert!" : solvedCount + " von " + totalStations + " Aufgaben erfolgreich gelöst") +
      '</h3>' +
      '<p style="font-size:0.75rem; color:#6e6c70; margin-bottom:1rem;">' +
        '${quiz.summary || "Erfolgreich abgeschlossen."}' +
      '</p>' +
      '<div style="display:flex; flex-direction:column; gap:0.35rem; max-width:400px; margin:0 auto 1.25rem auto; text-align:left;">';

    stationsData.forEach(function(st, idx) {
      var wasSolved = stationResults[idx] === "solved";
      html += '<div style="display:flex; justify-content:space-between; align-items:center; background:#ffffff; border:1px solid #e2ddd5; border-radius:0.5rem; padding:0.35rem 0.625rem; font-size:0.6875rem;">' +
        '<span style="font-weight:600; color:#3a352d; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:240px;">' + (st.title || ('Station ' + (idx + 1))) + '</span>' +
        (wasSolved ? '<span class="zqp-papercut-tag" style="background:#ecfdf5; color:#064e3b; border-color:#a7f3d0;">✓ Gelöst</span>' : '<span class="zqp-papercut-tag" style="background:#fffbeb; color:#92400e; border-color:#fde68a;">💡 Aufgedeckt</span>') +
      '</div>';
    });

    html += '</div>' +
      '<button type="button" class="zqp-btn-primary" onclick="window.zqpRestartQuiz()">' +
        '🔄 Quiz erneut starten' +
      '</button>' +
    '</div>';

    content.innerHTML = html;
  }

  window.zqpRestartQuiz = function() {
    currentStation = 0;
    stationResults = {};
    if (btnReveal) btnReveal.style.display = "";
    if (btnAction) btnAction.style.display = "";
    renderStation(0);
  };

  // POINTER DRAG & DROP ENGINE
  window.zqpStartDrag = function(e, type, id, label) {
    if (e.button !== 0 || canAdvance) return;

    var startX = e.clientX;
    var startY = e.clientY;
    var isDragging = false;

    if (!dragGhost) {
      dragGhost = document.createElement("div");
      dragGhost.className = "zqp-floating-ghost";
      dragGhost.style.display = "none";
      document.body.appendChild(dragGhost);
    }

    function onPointerMove(moveEvt) {
      var dx = moveEvt.clientX - startX;
      var dy = moveEvt.clientY - startY;
      if (!isDragging && Math.hypot(dx, dy) > 4) {
        isDragging = true;
        dragGhost.style.display = "flex";
        dragGhost.innerHTML = '<span>🖐️</span><span style="overflow:hidden; text-overflow:ellipsis;">' + label + '</span>';
      }

      if (isDragging) {
        moveEvt.preventDefault();
        dragGhost.style.left = moveEvt.clientX + "px";
        dragGhost.style.top = moveEvt.clientY + "px";

        var targetEl = document.elementFromPoint(moveEvt.clientX, moveEvt.clientY);
        if (type === "matching") {
          var dropEl = targetEl ? targetEl.closest("[data-drop-solution-id]") : null;
          hoverTarget = dropEl ? dropEl.getAttribute("data-drop-solution-id") : null;
        } else if (type === "myth_fact") {
          var dropEl = targetEl ? targetEl.closest("[data-drop-myth-target]") : null;
          hoverTarget = dropEl ? dropEl.getAttribute("data-drop-myth-target") : null;
        }
      }
    }

    function onPointerUp(upEvt) {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);

      if (dragGhost) {
        dragGhost.style.display = "none";
      }

      if (isDragging) {
        if (type === "matching" && hoverTarget) {
          checkMatch(id, hoverTarget);
        } else if (type === "myth_fact" && hoverTarget) {
          window.zqpSelectMyth(hoverTarget === "fact");
        }
      } else {
        // Simple click fallback
        if (type === "matching") {
          var st = stationsData[currentStation];
          var threat = (st.matchingPairs || []).find(function(p) { return p.id === id; });
          if (threat) {
            selectedThreat = threat;
            renderMatching(st);
          }
        }
      }
      hoverTarget = null;
    }

    window.addEventListener("pointermove", onPointerMove, { passive: false });
    window.addEventListener("pointerup", onPointerUp);
  };

  // BUTTON HANDLERS
  if (btnReveal) {
    btnReveal.onclick = function() {
      var st = stationsData[currentStation];
      if (!st) return;
      if (st.type === "dilemma" && st.dilemmaReactions) {
        var opt = st.dilemmaReactions.find(function(r) { return r.isOptimal; });
        if (opt) selectedDilemmaId = opt.id;
        renderDilemma(st);
      } else if (st.type === "single_choice" && st.options) {
        var cIdx = st.options.findIndex(function(o) { return o.isCorrect; });
        if (cIdx !== -1) selectedChoiceIdx = cIdx;
        renderSingleChoice(st);
      } else if (st.type === "checklist" && st.checklistItems) {
        checkedItemIds = st.checklistItems.filter(function(i) { return i.isCorrect; }).map(function(i) { return i.id; });
        renderChecklist(st);
      }
      markStationCompleted("unsolved", st.solutionExplanation || "Lösung für die Station", st.zqpRationale);
    };
  }

  if (btnAction) {
    btnAction.onclick = function() {
      if (!canAdvance) return;
      if (currentStation < totalStations - 1) {
        currentStation++;
        renderStation(currentStation);
      } else {
        renderEndSummary();
      }
    };
  }

  if (btnDrawerNext) {
    btnDrawerNext.onclick = function() {
      if (btnAction) btnAction.click();
    };
  }

  if (btnCloseDrawer) {
    btnCloseDrawer.onclick = closeDrawer;
  }

  // Initial render
  renderStation(0);
})();
`;

  const fullStandaloneHtml = `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${quiz.title} - ZQP Quiz</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <!-- Tailwind CSS Play CDN & Config (optional für erweiterte Layouts) -->
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    ${tailwindConfig.replace(/\/\*[\s\S]*?\*\//g, "").trim()}
  </script>
  <style>
    body {
      background-color: #f7faf9;
      margin: 0;
      padding: 1.5rem 1rem;
      font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      color: #444444;
    }
    ${css}
  </style>
</head>
<body>
  ${html}
  <script>
    ${js}
  </script>
</body>
</html>`;

  return {
    html,
    css,
    js,
    tailwindConfig,
    fullStandaloneHtml,
  };
}
