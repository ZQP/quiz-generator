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

  const promptSystem = `Du bist ein erfahrener Bildungs- und Barrierefreiheits-Entwickler für die deutsche Stiftung ZQP (Zentrum für Qualität in der Pflege - zqp.de).
Deine Aufgabe ist es, ein hochwertiges, interaktives, barrierearmes HTML5-Quiz für zqp.de zu erstellen.
Wichtige Richtlinien:
1. ZQP CI-Farbpalette: Primär ZQP-Petrol (#247a6d, Hover #1b5c53), sanfte Hintergründe (#f3f8f7, #e3eeec), Text (#444444), Warnung/Fehler (#722b28), Erfolg (#10b981).
2. Schriftart: Inter, sans-serif.
3. Barrierefreiheit (BITV 2.0 / WCAG 2.1 AA): Eindeutige Tastaturfokussierung (:focus-visible), Screenreader-Begründungen (aria-live), Farbkontraste mindestens 4.5:1.
4. Abwechslungsreiche Stationen (Gamification): Nutze nach Möglichkeit folgende Typen:
   - "matching": Zuordnungs-Puzzle (Gefahren ↔ Lösungen)
   - "ordering": Ablauf-Reihenfolge (z. B. richtige Schritte eines Transfers)
   - "comparison": A/B-Situationsvergleich (Zwei Situationen gegenüberstellen)
   - "single_choice": Klassischer Wissenscheck mit ZQP-Erklärungsbox
5. Ausgabe MUSS valides JSON im folgenden Schema sein:
{
  "title": "string",
  "targetAudience": "${targetAudience}",
  "summary": "string (1-2 Sätze fachlicher ZQP-Kontext)",
  "needsTailwind": true,
  "needsFontAwesome": false,
  "stations": [
    {
      "id": "s1",
      "type": "matching" | "ordering" | "comparison" | "single_choice",
      "title": "Kurzer Stationstitel",
      "promptOrInstruction": "Anweisung für den Nutzer",
      "zqpRationale": "Ausführliche ZQP-Erklärung nach der Lösung",
      "matchingPairs": [ { "id": "1", "threatOrTerm": "...", "solutionOrDef": "..." } ],
      "orderingSteps": [ { "id": "1", "text": "...", "correctIndex": 0 } ],
      "comparisonScenarios": [ { "id": "A", "title": "...", "badge": "...", "description": "...", "isCorrect": true, "explanation": "..." } ],
      "options": [ { "text": "...", "isCorrect": true, "explanation": "..." } ]
    }
  ],
  "generatedHtml": "Sauberes, semantisches HTML-Fragment ohne <html> oder <body> tags, fertig zum Einfügen in WordPress",
  "generatedCss": "Ergänzende CSS-Regeln für Animationen und Barrierefreiheit",
  "generatedJs": "Reines Vanilla-JS für die Interaktionslogik, modular gekapselt"
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

// Built-in authentic ZQP demo quiz generator (used when offline or testing without key)
function generateLocalDemoQuiz(
  topic: string,
  _count: number,
  audience: TargetAudience
): QuizGenerationResult {
  return {
    title: topic.trim() ? topic : "Sturzprävention im Alltag: Interaktive ZQP-Lernreise",
    targetAudience: audience,
    summary: "Interaktives Lernmodul mit Zuordnungs-Puzzle, Ablauf-Sortierung und Situationsvergleich nach aktuellem ZQP-Wissensstand.",
    needsTailwind: true,
    needsFontAwesome: false,
    stations: [
      {
        id: "st-1",
        type: "matching",
        title: "Station 1: Zuordnungs-Puzzle",
        promptOrInstruction: "Verbinden Sie die Sturzgefahr mit der passenden Schutzmaßnahme:",
        zqpRationale: "Antirutschmatten und feste Haltegriffe reduzieren Badezimmerunfälle um über 70%.",
        matchingPairs: [
          { id: "1", threatOrTerm: "Nasse Fliesen in der Dusche", solutionOrDef: "Haltegriffe & gummierte Antirutschmatte" },
          { id: "2", threatOrTerm: "Dunkler Flur in der Nacht", solutionOrDef: "Bewegungsgesteuertes Orientierungslicht" },
          { id: "3", threatOrTerm: "Rutschige Wollsocken auf Parkett", solutionOrDef: "Geschlossene Hausschuhe mit Profilsohle" },
        ],
      },
      {
        id: "st-2",
        type: "ordering",
        title: "Station 2: Ablauf-Reihenfolge",
        promptOrInstruction: "Bringen Sie die Schritte für ein sicheres Aufstehen aus dem Sessel in die richtige Reihenfolge:",
        zqpRationale: "Erst vorrutschen, dann Standfläche sichern, dann mit Vorneigung aufstehen.",
        orderingSteps: [
          { id: "o1", text: "Mit dem Gesäß an die vordere Stuhlkante vorrutschen", correctIndex: 0 },
          { id: "o2", text: "Füße schulterbreit fest aufstellen, Fersen leicht nach hinten", correctIndex: 1 },
          { id: "o3", text: "Oberkörper mit Vorneigung über die Beine aufrichten", correctIndex: 2 },
        ],
      },
      {
        id: "st-3",
        type: "comparison",
        title: "Station 3: Situations-Vergleich",
        promptOrInstruction: "Welches Wohnraumszenario entspricht den Kriterien für ein sturzsicheres Zuhause?",
        zqpRationale: "Freie Laufwege und fixierte Kabel sind essenziell, um Stürze im Alter zu vermeiden.",
        comparisonScenarios: [
          {
            id: "A",
            title: "Szenario A: Lose Teppiche & Kabel",
            badge: "Hohes Risiko",
            description: "Ein langer Flur mit mehreren kleinen Vorlegern und einem lose über den Boden verlaufenden Telefonkabel.",
            isCorrect: false,
            explanation: "Lose Teppichkanten und querliegende Kabel zählen zu den häufigsten Stolperfallen.",
          },
          {
            id: "B",
            title: "Szenario B: Freie Wege & Nachtlicht",
            badge: "Sturzpräventiv",
            description: "Freie Laufwege ohne lose Läufer, fixierte Kabel und eine schattenarme Sockelbeleuchtung zum Bad.",
            isCorrect: true,
            explanation: "Szenario B erfüllt alle ZQP-Kriterien für Barrierearmut und Sturzprophylaxe.",
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
    <!-- Barrierefreie Stationen -->
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
