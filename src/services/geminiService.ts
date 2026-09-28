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
4. RÜCKGABESCHEMA (reines, valides JSON):
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
<div id="zqp-game-root" class="max-w-2xl mx-auto bg-white border border-[#bbd1cd] rounded-2xl shadow-sm overflow-hidden font-sans">
  <header class="bg-[#247a6d] text-white p-5">
    <div class="flex justify-between text-xs text-[#bbd1cd] font-bold uppercase tracking-wider">
      <span>ZQP Wissenstest</span>
      <span id="zqp-game-progress">Station 1 von 3</span>
    </div>
    <h2 class="text-xl font-bold mt-1">Sturzprävention im Alltag</h2>
  </header>
  <div id="zqp-game-stage" class="p-6">
    <!-- Barrierefreie Stationen mit Soforterklärung und Lösung anzeigen -->
  </div>
</div>`,
    generatedCss: `/* ZQP Design-Stile */
#zqp-game-root :focus-visible {
  outline: 2px solid #247a6d !important;
  outline-offset: 2px !important;
}
.puzzle-piece:hover {
  transform: translateY(-2px);
  border-color: #247a6d;
}`,
    generatedJs: `/* ZQP Quiz Interaktion */
(function() {
  console.log("ZQP Quiz initialisiert");
})();`,
  };
}
