import { AppSettings, QuizGenerationResult, TargetAudience, StationType } from "../types";

const SETTINGS_STORAGE_KEY = "zqp_quiz_generator_settings";

export const defaultSettings: AppSettings = {
  geminiApiKey: "",
  selectedModel: "gemini-2.5-flash",
  availableModels: [
    "gemini-2.5-flash",
    "gemini-2.5-pro",
    "gemini-2.0-flash",
    "gemini-1.5-pro",
    "gemini-1.5-flash"
  ],
  autoUpdate: true,
};

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (raw) {
      return { ...defaultSettings, ...JSON.parse(raw) };
    }
  } catch (e) {
    console.error("Failed to load settings:", e);
  }
  return defaultSettings;
}

export function saveSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error("Failed to save settings:", e);
  }
}

export async function fetchAvailableModels(apiKey: string): Promise<string[]> {
  if (!apiKey) {
    throw new Error("Bitte geben Sie zuerst einen Gemini API-Schlüssel ein.");
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
  const response = await fetch(url);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData?.error?.message || `API-Fehler (${response.status})`);
  }

  const data = await response.json();
  const models = (data.models || [])
    .filter((m: { name?: string; supportedGenerationMethods?: string[] }) =>
      m.supportedGenerationMethods?.includes("generateContent")
    )
    .map((m: { name: string }) => m.name.replace(/^models\//, ""))
    .filter((name: string) => name.toLowerCase().includes("gemini"));

  return models.length > 0 ? models : defaultSettings.availableModels;
}

export interface GenerateQuizParams {
  apiKey: string;
  model: string;
  topicPrompt: string;
  referenceText?: string;
  questionCount: number;
  targetAudience: TargetAudience;
  mechanics: StationType[];
}

export async function generateQuizWithGemini(
  params: GenerateQuizParams
): Promise<QuizGenerationResult> {
  const { apiKey, model, topicPrompt, referenceText, questionCount, targetAudience, mechanics } = params;

  // Fallback demo generation if no API key is set yet
  if (!apiKey || apiKey.trim() === "") {
    return generateLocalDemoQuiz(topicPrompt, questionCount, targetAudience);
  }

  const promptSystem = `Du bist ein preisgekrönter UI/UX-Designer und Fachredakteur für die Stiftung ZQP (Zentrum für Qualität in der Pflege - zqp.de).
Deine Aufgabe ist es, ein visuell ansprechendes ("schickes", modernes), interaktives und barrierearmes HTML5-Lernspiel für zqp.de zu erstellen.

WICHTIGE REDAKTIONELLE & DESIGN-VORGABEN:
1. ZQP Corporate Design (modern, elegant):
   - Primär ZQP-Petrol (#247a6d, Hover #1b5c53, Dark #00473d).
   - Hintergründe: Heller, freundlicher Look (#ffffff, sanftes Sand/Mint #f3f8f7, Akzent #e3eeec, dezente Ränder #bbd1cd).
   - Textfarbe: #444444 (hoher Kontrast, WCAG AA / AAA).
   - Formensprache: Elegante, großzügige Rundungen (rounded-2xl), sanfte Schatten (shadow-sm bis shadow-md), klare visuelle Hierarchien.
2. DIDAKTISCHE QUALITÄT ("Warum richtig / Warum falsch"):
   - Erkläre bei JEDER Antwortoption ausführlich und verständlich, WARUM sie richtig oder falsch ist!
     * Beispiel bei falscher Antwort: "Nicht optimal: Dicke Wollsocken ohne Gummierung bieten auf glattem Parkett keinerlei Haftung. Der Fuß rutscht weg, was das Sturzrisiko verdreifacht."
     * Beispiel bei richtiger Antwort: "Richtig: Feste Schuhe mit Profilsohle und Fersenkappe stabilisieren das Sprunggelenk und verhindern ein Umknicken."
   - Jede Station muss ein Feld 'solutionExplanation' enthalten, das den Gesamtzusammenhang und die ZQP-Lösung prägnant auf den Punkt bringt, falls der Nutzer auf "Lösung anzeigen" klickt.
3. BARRIEREFREIHEIT (BITV 2.0 / WCAG 2.1 AA):
   - Vollständige Tastaturbedienbarkeit (:focus-visible mit 2px ZQP-Petrol Ring).
   - Screenreader-Unterstützung mit aria-live="polite".
   - Mindest-Touch-Größe für Buttons und Klickkarten.
4. STABILES LAYOUT & KEINE SCROLLBALKEN (KEIN HÖHENSPRINGEN / CLS = 0 / MOBIL-PASSGENAU):
   - Der Quiz-Container '#zqp-game-root' MUSS zwingend OHNE Scrollbalken auskommen (overflow: hidden, feste Höhe ca. 560-580px, max-h: 85vh).
   - Das Quiz darf beim Umschalten zwischen Stationen oder Anzeigen von Lösungen NIEMALS die Höhe verändern.
   - Didaktische Erklärungen ("Warum richtig / falsch" + "ZQP-Praxiswissen") erscheinen bei Klick auf "Prüfen" oder "Lösung anzeigen" als eleganter Bottom-Drawer (Slide-up Overlay vom unteren Rand), sodass keine Scrollbalken entstehen und das Quiz 100% stabil bleibt.
5. ZQP-FUSSZEILE (OBLIGATORISCH):
   - Jedes Quiz MUSS am alleruntersten Rand eine dezente Fußzeile besitzen:
     "Stiftung Zentrum für Qualität in der Pflege • [Aktuelles Kalenderjahr]" (z. B. "Stiftung Zentrum für Qualität in der Pflege • ${new Date().getFullYear()}").
6. RÜCKGABESCHEMA (reines, valides JSON):
{
  "title": "string",
  "targetAudience": "${targetAudience}",
  "summary": "string (Praxistipp für die Auswertung)",
  "needsTailwind": true,
  "needsFontAwesome": false,
  "stations": [
    {
      "id": "s1",
      "type": "matching" | "ordering" | "comparison" | "single_choice",
      "title": "Stationstitel",
      "promptOrInstruction": "Anweisung",
      "zqpRationale": "ZQP-Hintergrundwissen zur Station",
      "solutionExplanation": "Vollständige Lösungserklärung für Nutzer, die auf 'Lösung anzeigen' klicken",
      "matchingPairs": [
        { "id": "1", "threatOrTerm": "...", "solutionOrDef": "...", "explanation": "Warum dieses Paar zusammengehört" }
      ],
      "orderingSteps": [
        { "id": "1", "text": "...", "correctIndex": 0, "reason": "Warum dieser Schritt an dieser Stelle steht" }
      ],
      "comparisonScenarios": [
        { "id": "A", "title": "...", "badge": "...", "description": "...", "isCorrect": true, "explanation": "Detaillierte Analyse, warum A sicher oder gefährlich ist" }
      ],
      "options": [
        { "text": "...", "isCorrect": true, "explanation": "Erklärung warum Option richtig oder falsch ist" }
      ]
    }
  ],
  "generatedHtml": "Semantisches HTML für WordPress (Gutenberg)",
  "generatedCss": "Ergänzende ZQP Animationen und Barrierefreiheits-Stile",
  "generatedJs": "Reines Vanilla JS für Interaktion, Tastaturnavigation und Lösung-Anzeigen-Logik"
}`;

  const userContent = `Thema & Lernziel: ${topicPrompt}
Zielgruppe: ${targetAudience}
Anzahl Stationen: ${questionCount}
Gewünschte Mechaniken: ${mechanics.join(", ")}
${referenceText ? `ZQP-Referenzinhalte / Wissensbasis:\n${referenceText}` : ""}`;

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const payload = {
    contents: [
      {
        role: "user",
        parts: [{ text: `${promptSystem}\n\n${userContent}` }],
      },
    ],
    generationConfig: {
      temperature: 0.4,
      responseMimeType: "application/json",
    },
  };

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody?.error?.message || `Gemini API Fehler (${response.status})`);
  }

  const resultData = await response.json();
  const textOutput = resultData?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!textOutput) {
    throw new Error("Keine Antwort von Gemini erhalten.");
  }

  try {
    const parsed: QuizGenerationResult = JSON.parse(textOutput);
    return parsed;
  } catch (err) {
    console.error("Failed to parse Gemini JSON:", err, textOutput);
    throw new Error("Antwort von Gemini konnte nicht als valides Quiz-JSON interpretiert werden.");
  }
}

export interface RefineQuizParams {
  apiKey: string;
  model: string;
  existingQuiz: QuizGenerationResult;
  refinementPrompt: string;
}

export async function refineQuizWithGemini(
  params: RefineQuizParams
): Promise<QuizGenerationResult> {
  const { apiKey, model, existingQuiz, refinementPrompt } = params;

  // Offline demo adjustment simulation
  if (!apiKey || apiKey.trim() === "") {
    const updated = JSON.parse(JSON.stringify(existingQuiz)) as QuizGenerationResult;
    updated.summary = `[Angepasst per KI]: ${refinementPrompt}. ${updated.summary}`;
    const pLower = refinementPrompt.toLowerCase();

    if (pLower.includes("einfach") || pLower.includes("senior")) {
      updated.targetAudience = "senioren";
      updated.title = `${updated.title} (In einfacher Sprache)`;
      if (updated.stations[0]) {
        updated.stations[0].promptOrInstruction = "Verbinden Sie die Gefahren mit der passenden Lösung (in einfacher Sprache):";
      }
    } else if (pLower.includes("fachkraft") || pLower.includes("pflegefach")) {
      updated.targetAudience = "fachkraefte";
      updated.title = `${updated.title} (Für Pflegefachkräfte)`;
    } else if (pLower.includes("kürz") || pLower.includes("knapp")) {
      updated.title = `${updated.title} (Kompaktfassung)`;
      updated.stations.forEach((s) => {
        s.zqpRationale = s.zqpRationale.split(".")[0] + ".";
      });
    } else {
      updated.title = `${updated.title} (Aktualisiert)`;
    }
    return updated;
  }

  const promptSystem = `Du bist ein erfahrener Bildungsredakteur der Stiftung ZQP (zqp.de).
Der Nutzer hat bereits ein HTML5-Quiz erstellt und möchte nun gezielte ANPASSUNGEN daran vornehmen, OHNE dass das gesamte Quiz neu erstellt wird.

WICHTIGE ANWEISUNGEN:
1. Nimm das bestehende Quiz als Basis und führe die gewünschte Änderung des Nutzers präzise und feinfühlig durch.
2. Behalte alle unveränderten Stationen, Texte und didaktischen Erklärungen exakt bei.
3. Achte weiterhin streng auf ZQP Corporate Design (#247a6d, #1b5c53, #f3f8f7) und Barrierefreiheit (BITV 2.0 / WCAG 2.1 AA).
4. Sorge dafür, dass bei allen Antwortoptionen weiterhin die 'Warum richtig / Warum falsch' Begründungen vorhanden sind.
5. Die Ausgabe MUSS zwingend valides JSON im bekannten QuizGenerationResult-Schema sein.`;

  const userContent = `Bestehendes Quiz (JSON):
${JSON.stringify(existingQuiz, null, 2)}

Gewünschte Anpassung des Nutzers:
${refinementPrompt}`;

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const payload = {
    contents: [
      {
        role: "user",
        parts: [{ text: `${promptSystem}\n\n${userContent}` }],
      },
    ],
    generationConfig: {
      temperature: 0.3,
      responseMimeType: "application/json",
    },
  };

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody?.error?.message || `Gemini API Fehler (${response.status})`);
  }

  const resultData = await response.json();
  const textOutput = resultData?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!textOutput) {
    throw new Error("Keine Antwort von Gemini erhalten.");
  }

  try {
    const parsed: QuizGenerationResult = JSON.parse(textOutput);
    return parsed;
  } catch (err) {
    console.error("Failed to parse Gemini JSON:", err, textOutput);
    throw new Error("Antwort von Gemini konnte nicht als valides Quiz-JSON interpretiert werden.");
  }
}

// Built-in authentic ZQP demo quiz generator (used when offline or testing without key)
function generateLocalDemoQuiz(
  topic: string,
  _count: number,
  audience: TargetAudience
): QuizGenerationResult {
  return {
    title: topic.trim() ? topic : "Sturzprävention im Alltag: Interaktive ZQP-Lernreise",
    targetAudience: audience,
    summary: "Rund 80 % der Stürze im häuslichen Umfeld lassen sich durch einfache Wohnraumanpassungen und passendes Schuhwerk vermeiden. Informieren Sie sich in unserem ZQP-Ratgeber 'Sturzprävention' auf zqp.de.",
    needsTailwind: true,
    needsFontAwesome: false,
    stations: [
      {
        id: "st-1",
        type: "matching",
        title: "Station 1: Zuordnungs-Puzzle",
        promptOrInstruction: "Verbinden Sie jede typische Gefahrenstelle mit der passenden ZQP-Schutzmaßnahme:",
        zqpRationale: "Antirutschmatten, Haltegriffe und feste Schuhe verringern die Sturzgefahr im Badezimmer um über 70 %.",
        solutionExplanation: "Die ideale Absicherung: Nasse Fliesen brauchen Antirutschmatten und feste Haltegriffe. Bei nächtlichem Harndrang schützt eine bewegungsgesteuerte Orientierungsbeleuchtung vor Desorientierung. Auf glatten Böden geben geschlossene Hausschuhe mit Fersenhalt festen Stand.",
        matchingPairs: [
          {
            id: "1",
            threatOrTerm: "Nasse Fliesen in Dusche & Bad",
            solutionOrDef: "Haltegriffe & gummierte Antirutschmatte",
            explanation: "Wasser auf glatten Keramikfliesen hebt die Reibung fast vollständig auf. Feste Haltegriffe bieten mechanischen Halt beim Ein- und Aussteigen."
          },
          {
            id: "2",
            threatOrTerm: "Dunkler Flur bei nächtlichem Aufstehen",
            solutionOrDef: "Bewegungsgesteuertes Orientierungslicht",
            explanation: "Nach dem Aufwachen ist der Blutdruck oft niedrig und die Augen gewöhnen sich nur langsam an die Dunkelheit. Blendfreies Sockellicht weist den Weg sicher zum WC."
          },
          {
            id: "3",
            threatOrTerm: "Rutschige Wollsocken oder Schlappen",
            solutionOrDef: "Geschlossene Hausschuhe mit Profilsohle",
            explanation: "Lose Schlappen ('Schlupfschuhe') rutschen beim Gehen leicht von der Ferse ab und führen zum Umknicken. Feste Fersenkappen geben verlässliche Stabilität."
          },
        ],
      },
      {
        id: "st-2",
        type: "ordering",
        title: "Station 2: Ablauf-Reihenfolge beim Aufstehen",
        promptOrInstruction: "Bringen Sie die 3 biomechanischen Schritte für ein sicheres Aufstehen aus dem Sessel in die richtige Reihenfolge:",
        zqpRationale: "Erst vorrutschen, dann die Standfläche unter dem Körperschwerpunkt sichern, dann mit Vorneigung aufrichten.",
        solutionExplanation: "Die richtige Reihenfolge: 1. Zuerst mit dem Gesäß an die vordere Kante vorrutschen (verkürzt den Hebelarm). 2. Füße schulterbreit fest aufstellen mit den Fersen leicht nach hinten (stabilisiert die Standfläche). 3. Erst jetzt den Oberkörper mit Schwung nach vorne neigen und über die Beine aufrichten.",
        orderingSteps: [
          {
            id: "o1",
            text: "Mit dem Gesäß an die vordere Stuhlkante vorrutschen",
            correctIndex: 0,
            reason: "Schritt 1: Verkürzt den Hebelarm zum Körperschwerpunkt, sodass deutlich weniger Kraftaufwand nötig ist."
          },
          {
            id: "o2",
            text: "Füße schulterbreit fest aufstellen, Fersen leicht nach hinten",
            correctIndex: 1,
            reason: "Schritt 2: Schafft eine stabile Unterstützungsfläche direkt unter den Knien, bevor das Körpergewicht verlagert wird."
          },
          {
            id: "o3",
            text: "Oberkörper mit Vorneigung über die Beine aufrichten",
            correctIndex: 2,
            reason: "Schritt 3: Verlagert den Schwerpunkt dynamisch über die Füße, wodurch die Oberschenkelmuskulatur optimal arbeiten kann."
          },
        ],
      },
      {
        id: "st-3",
        type: "comparison",
        title: "Station 3: A/B-Situationsvergleich im Wohnbereich",
        promptOrInstruction: "Vergleichen Sie beide Wohnraumsituationen: Welche Variante entspricht den Kriterien für ein sturzsicheres Zuhause?",
        zqpRationale: "Freie Laufwege und fixierte Kabel sind essenziell, um Stürze älterer Menschen im Alltag zu verhindern.",
        solutionExplanation: "Szenario B ist die sturzsichere Variante: Lose Teppichkanten und querliegende Kabel (aus Szenario A) sind für über 45 % aller häuslichen Stolperstürze verantwortlich. Feste Kabelkanäle und schattenfreie Beleuchtung beseitigen diese Gefahren nachhaltig.",
        comparisonScenarios: [
          {
            id: "A",
            title: "Szenario A: Lose Teppiche & freie Kabel",
            badge: "Hohes Risiko ⚠️",
            description: "Ein gemütlicher Flur mit mehreren kleinen Orientteppichen auf Parkett und einem quer über den Laufweg gespannten Ladekabel.",
            isCorrect: false,
            explanation: "Warum dies gefährlich ist: Lose Teppichläufer ohne gummierte Unterseite rutschen bei jedem Schritt weg. Kanten rollen sich auf und werden zu Stolperfallen. Das querliegende Kabel fängt die Fußspitze ein.",
          },
          {
            id: "B",
            title: "Szenario B: Freie Wege & fixierte Kabel",
            badge: "Sturzpräventiv ✓",
            description: "Freie Laufwege ohne lose Vorleger, Kabel sind sauber an der Fußleiste befestigt und nachts leuchtet eine schattenfreie Sockelleuchte.",
            isCorrect: true,
            explanation: "Warum dies optimal ist: Durch den Verzicht auf lose Läufer bleibt der Bodenkontakt plan. Fixierte Kabel schalten Stolperfallen aus und die Sockelbeleuchtung nimmt Sehunsicherheiten bei Dämmerung.",
          },
        ],
      },
    ],
    generatedHtml: `<!-- ZQP Interaktives Lern-Quiz (zqp.de) -->
<div id="zqp-game-root" class="zqp-quiz-container">
  <header id="zqp-game-header">
    <div class="zqp-header-top">
      <span class="zqp-badge">🧩 ZQP Wissenstest</span>
      <span id="zqp-station-counter">Station 1 von 3</span>
    </div>
    <h2 id="zqp-game-title">Sturzprävention im Alltag</h2>
    <div class="zqp-progress-bar">
      <div id="zqp-progress-fill" style="width: 33.3%;"></div>
    </div>
  </header>

  <main id="zqp-game-stage" class="zqp-stage">
    <div id="zqp-station-content">
      <!-- Station-Inhalt wird dynamisch gerendert -->
    </div>
    <div id="zqp-feedback-container" style="display: none;"></div>
  </main>

  <footer id="zqp-game-footer">
    <div id="zqp-footer-left">
      <button id="zqp-btn-reveal" type="button" class="zqp-btn-secondary">
        💡 Lösung anzeigen
      </button>
    </div>
    <div id="zqp-footer-right">
      <button id="zqp-btn-action" type="button" class="zqp-btn-primary">
        Nächste Station ➔
      </button>
    </div>
  </footer>
  <div class="zqp-copyright-footer">
    Stiftung Zentrum für Qualität in der Pflege • ${new Date().getFullYear()}
  </div>
</div>`,
    generatedCss: `/* ZQP Quiz Embed Styles: Feste Höhe, Keine Layout-Verschiebungen & Keine Scrollbalken */
.zqp-quiz-container {
  width: 100%;
  max-width: 672px;
  height: 570px;
  max-height: 85vh;
  margin: 1.5rem auto;
  background-color: #ffffff;
  border: 1px solid #bbd1cd;
  border-radius: 1rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  color: #444444;
}

@media (max-width: 640px) {
  .zqp-quiz-container {
    max-width: 100%;
    height: 570px;
    max-height: 88vh;
    border-radius: 0.75rem;
  }
}

#zqp-game-header {
  flex-shrink: 0;
  background: linear-gradient(to right, #247a6d, #1b5c53);
  color: #ffffff;
  padding: 1rem 1.25rem;
}

.zqp-header-top {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  color: #bbd1cd;
  font-weight: 600;
  text-transform: uppercase;
  margin-bottom: 0.25rem;
}

#zqp-game-title {
  font-size: 1.125rem;
  font-weight: 700;
  margin: 0;
  color: #ffffff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.zqp-progress-bar {
  width: 100%;
  height: 6px;
  background: #00473d;
  border-radius: 9999px;
  margin-top: 0.625rem;
  overflow: hidden;
}

#zqp-progress-fill {
  height: 100%;
  background: #34d399;
  border-radius: 9999px;
  transition: width 0.4s ease;
}

.zqp-stage {
  flex: 1 1 0%;
  min-height: 0;
  overflow: hidden;
  padding: 1.25rem;
}

.zqp-copyright-footer {
  flex-shrink: 0;
  background-color: #f3f8f7;
  border-top: 1px solid rgba(187, 209, 205, 0.6);
  padding: 0.35rem 1rem;
  text-align: center;
  font-size: 0.6875rem;
  color: #6e6c70;
  font-weight: 500;
  letter-spacing: 0.025em;
}

#zqp-game-footer {
  flex-shrink: 0;
  border-top: 1px solid #bbd1cd;
  background-color: #ffffff;
  padding: 0.75rem 1.25rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
}

.zqp-btn-primary {
  background-color: #247a6d;
  color: #ffffff;
  border: none;
  border-radius: 0.5rem;
  padding: 0.5rem 1rem;
  font-size: 0.8125rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.zqp-btn-primary:hover {
  background-color: #1b5c53;
}

.zqp-btn-secondary {
  background-color: #f3f8f7;
  color: #1b5c53;
  border: 1px solid #bbd1cd;
  border-radius: 0.5rem;
  padding: 0.45rem 0.85rem;
  font-size: 0.8125rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.zqp-btn-secondary:hover {
  background-color: #e3eeec;
  color: #247a6d;
}

.puzzle-piece {
  border: 2px solid #bbd1cd;
  border-radius: 0.75rem;
  padding: 0.75rem;
  margin-bottom: 0.5rem;
  cursor: pointer;
  background: #ffffff;
  transition: all 0.2s;
}

.puzzle-piece:hover {
  border-color: #247a6d;
  background: #f3f8f7;
}`,
    generatedJs: `/* ZQP Quiz Interaktion (Vanilla JS) */
(function() {
  var root = document.getElementById("zqp-game-root");
  if (!root) return;

  var currentStation = 0;
  var totalStations = 3;

  var btnReveal = document.getElementById("zqp-btn-reveal");
  var btnAction = document.getElementById("zqp-btn-action");
  var counter = document.getElementById("zqp-station-counter");
  var progressFill = document.getElementById("zqp-progress-fill");
  var stage = document.getElementById("zqp-game-stage");
  var content = document.getElementById("zqp-station-content");
  var feedback = document.getElementById("zqp-feedback-container");

  function renderStation(idx) {
    if (stage) stage.scrollTop = 0;
    if (feedback) feedback.style.display = "none";
    if (counter) counter.textContent = "Station " + (idx + 1) + " von " + totalStations;
    if (progressFill) progressFill.style.width = (((idx + 1) / totalStations) * 100) + "%";

    if (idx === 0) {
      content.innerHTML = '<h3 style="color:#1b5c53; font-weight:700; margin-bottom:0.75rem;">Station 1: Zuordnungs-Puzzle</h3>' +
        '<p style="font-size:0.875rem; margin-bottom:1rem;">Verbinden Sie jede typische Gefahrenstelle mit der passenden Schutzmaßnahme:</p>' +
        '<div class="puzzle-piece" onclick="window.zqpSelectMatch(1)">⚠️ Nasse Fliesen in Dusche & Bad ➔ Feste Haltegriffe & Antirutschmatte</div>' +
        '<div class="puzzle-piece" onclick="window.zqpSelectMatch(2)">⚠️ Dunkler Flur bei Nacht ➔ Orientierungsbeleuchtung</div>' +
        '<div class="puzzle-piece" onclick="window.zqpSelectMatch(3)">⚠️ Rutschige Wollsocken ➔ Geschlossene Hausschuhe</div>';
      btnAction.textContent = "Nächste Station ➔";
    } else if (idx === 1) {
      content.innerHTML = '<h3 style="color:#1b5c53; font-weight:700; margin-bottom:0.75rem;">Station 2: Ablauf-Reihenfolge beim Aufstehen</h3>' +
        '<p style="font-size:0.875rem; margin-bottom:1rem;">Richtige biomechanische Reihenfolge für sicheres Aufstehen:</p>' +
        '<div class="puzzle-piece">1. An die vordere Stuhlkante vorrutschen</div>' +
        '<div class="puzzle-piece">2. Füße schulterbreit fest aufstellen</div>' +
        '<div class="puzzle-piece">3. Mit Vorneigung aufrichten</div>';
      btnAction.textContent = "Nächste Station ➔";
    } else if (idx === 2) {
      content.innerHTML = '<h3 style="color:#1b5c53; font-weight:700; margin-bottom:0.75rem;">Station 3: A/B-Situationsvergleich</h3>' +
        '<p style="font-size:0.875rem; margin-bottom:1rem;">Wählen Sie das sturzsichere Szenario:</p>' +
        '<div class="puzzle-piece" style="border-color:#247a6d; background:#f3f8f7;">' +
        '<strong>Szenario B (Sturzpräventiv ✓):</strong> Freie Wege, fixierte Kabel, Sockellicht.' +
        '</div>';
      btnAction.textContent = "Zur Gesamtauswertung ➔";
    }
  }

  window.zqpSelectMatch = function(id) {
    showExplanation("Hervorragend verzahnt!", "Diese Maßnahme neutralisiert die Gefahrenquelle nachweislich und schützt nachhaltig.");
  };

  if (btnReveal) {
    btnReveal.addEventListener("click", function() {
      showExplanation("Lösung aufgedeckt & Puzzleteile verzahnt", "Fachlich fundiert nach den Empfehlungen der Stiftung ZQP (zqp.de).");
    });
  }

  if (btnAction) {
    btnAction.addEventListener("click", function() {
      if (currentStation < totalStations - 1) {
        currentStation++;
        renderStation(currentStation);
      } else {
        content.innerHTML = '<div style="text-align:center; padding:1.5rem;">' +
          '<h3 style="color:#1b5c53; font-size:1.25rem; font-weight:700;">Glückwunsch! Alle Stationen gemeistert</h3>' +
          '<p style="font-size:0.875rem; margin-top:0.5rem;">Sie haben alle Stationen erfolgreich absolviert. Mehr Infos auf zqp.de.</p>' +
          '</div>';
        if (feedback) feedback.style.display = "none";
        if (btnReveal) btnReveal.style.display = "none";
        btnAction.textContent = "Quiz neu starten";
        btnAction.onclick = function() { location.reload(); };
      }
    });
  }

  function showExplanation(title, text) {
    if (!feedback) return;
    feedback.innerHTML = '<div style="margin-top:1rem; padding:0.875rem; background:#ecfdf5; border:1px solid #10b981; border-radius:0.5rem; font-size:0.8125rem;">' +
      '<strong style="color:#065f46; display:block; margin-bottom:0.25rem;">✓ ' + title + '</strong>' +
      '<p style="margin:0; color:#1e293b;">' + text + '</p>' +
      '</div>';
    feedback.style.display = "block";
    if (stage) stage.scrollTo({ top: stage.scrollHeight, behavior: "smooth" });
  }

  renderStation(0);
})();`,
  };
}
