import { AppSettings, QuizGenerationResult, TargetAudience, StationType, QuizStation, GlossaryEntry } from "../types";
import { compileQuizToBundle } from "./exportCompiler";

const SETTINGS_STORAGE_KEY = "zqp_quiz_generator_settings";

export const defaultEditorialRules: string = `1. Personenzentrierte Sprache: Verwende stets empathische, wertschätzende und entlastende Formulierungen für Betroffene und pflegende Angehörige.
2. Keine isolierten Diagnosen: Niemals Heilsversprechen oder Diagnosen abgeben; bei Unsicherheiten stets an Hausarzt, Pflegestützpunkte oder das ZQP-Krisentelefon verweisen.
3. Ressourcen- statt Defizitorientierung: Hebe Fähigkeiten, Selbstbestimmung und Sicherheit hervor, anstatt Hilflosigkeit zu betonen.
4. Fundiertheit: Halte dich streng an die ZQP-Expertenstandards und Leitlinien (z.B. Sturzprävention, Gewaltprävention, Demenz).`;

export const defaultGlossary: GlossaryEntry[] = [
  { id: "g1", term: "Demenzkranke", preferred: "Menschen mit Demenz", explanation: "Person-zentrierte Sprache nach Tom Kitwood" },
  { id: "g2", term: "Pflegefälle", preferred: "Pflegebedürftige / Menschen mit Pflegebedarf", explanation: "Entstigmatisierende Nomenklatur" },
  { id: "g3", term: "Altenheim", preferred: "Pflegeeinrichtung / Seniorenresidenz", explanation: "Zeitgemäße Bezeichnung" },
  { id: "g4", term: "Windeln", preferred: "Inkontinenzmaterialien / Vorlagen", explanation: "Würdevolle Fachsprache" },
  { id: "g5", term: "Verwirrte", preferred: "Menschen mit kognitiven Einschränkungen", explanation: "Entlastende Formulierung" },
  { id: "g6", term: "Bettlägerige", preferred: "im Bett versorgte Personen", explanation: "Aktivierender Sprachgebrauch" },
];

export const defaultSettings: AppSettings = {
  geminiApiKey: "",
  selectedModel: "gemini-3.0-flash",
  availableModels: [
    "gemini-3.0-flash",
    "gemini-3.0-pro",
    "gemini-2.5-flash",
    "gemini-2.5-pro",
    "gemini-2.0-flash",
  ],
  autoUpdate: true,
  editorialRules: defaultEditorialRules,
  glossary: defaultGlossary,
};

export function buildEditorialPromptBlock(rules?: string, glossary?: GlossaryEntry[]): string {
  const activeRules = rules || defaultEditorialRules;
  const activeGlossary = glossary || defaultGlossary;

  const glossaryLines = activeGlossary
    .map((g) => `- Verwende '${g.preferred}' statt '${g.term}'${g.explanation ? ` (${g.explanation})` : ""}`)
    .join("\n");

  return `
REDAKTIONELLER LEITFADEN & ZQP-FACHGLOSSAR (STRENG EINHALTEN):
${activeRules}

GESCHÜTZTE ZQP-NOMENKLATUR:
${glossaryLines}
`;
}

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...defaultSettings,
        ...parsed,
        editorialRules: parsed.editorialRules || defaultEditorialRules,
        glossary: Array.isArray(parsed.glossary) && parsed.glossary.length > 0 ? parsed.glossary : defaultGlossary,
      };
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
  editorialRules?: string;
  glossary?: GlossaryEntry[];
}

export async function generateQuizWithGemini(
  params: GenerateQuizParams
): Promise<QuizGenerationResult> {
  const { apiKey, model, topicPrompt, referenceText, questionCount, targetAudience, mechanics, editorialRules, glossary } = params;

  // Fallback demo generation if no API key is set yet
  if (!apiKey || apiKey.trim() === "") {
    const demo = generateLocalDemoQuiz(topicPrompt, questionCount, targetAudience);
    demo.referenceSourceText = referenceText || "";
    demo.editorialStatus = "draft";
    return demo;
  }

  const editorialBlock = buildEditorialPromptBlock(editorialRules, glossary);

  const promptSystem = `Du bist ein preisgekrönter UI/UX-Designer und Fachredakteur für die Stiftung ZQP (Zentrum für Qualität in der Pflege - zqp.de).
Deine Aufgabe ist es, ein visuell ansprechendes ("schickes", modernes), interaktives und barrierearmes HTML5-Lernspiel für zqp.de zu erstellen.

${editorialBlock}

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
   - Der Drawer MUSS mit einem Button ("Ansicht ansehen ✕") schließbar sein, damit der Nutzer die Lösung/Karten auf der Bühne begutachten kann, und über "Erklärung anzeigen" wieder nach oben geschoben werden können.
   - STRIKTE WEITERSCHALTUNG: Der Nutzer darf erst zur nächsten Station gelangen, wenn ALLE Punkte der Station gelöst wurden ODER der Nutzer auf "Lösung anzeigen" klickt.
   - ERGEBNIS-TRACKING: Das Quiz erfasst, welche Aufgaben gelöst wurden und welche nicht (weil die Lösung aufgedeckt wurde). In der Abschlussauswertung wird dies sachlich dargestellt (z. B. "2 von 3 Aufgaben gelöst" und je Station "Gelöst" bzw. "Nicht gelöst").
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
      "type": "matching" | "ordering" | "comparison" | "single_choice" | "myth_fact" | "bucket_sort" | "dilemma" | "checklist" | "fill_in_the_blank",
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
      ],
      "mythFactItems": [
        { "id": "1", "statement": "Behauptung", "isFact": false, "explanation": "Erklärung warum Mythos oder Fakt" }
      ],
      "bucketSortItems": [
        { "id": "1", "text": "Maßnahme", "targetBucket": "do", "explanation": "Begründung" }
      ],
      "dilemmaReactions": [
        { "id": "1", "text": "Reaktion", "isOptimal": true, "consequence": "Konsequenz", "zqpAdvice": "Fachlicher Rat" }
      ],
      "checklistItems": [
        { "id": "1", "text": "Maßnahme", "isCorrect": true, "explanation": "Begründung" }
      ],
      "fillInSentence": "Satz mit [BLANK_1] und [BLANK_2]",
      "fillInBlanks": [
        { "id": "BLANK_1", "correctWord": "Wort", "options": ["Wort", "AnderesWort", "DrittesWort"] }
      ]
    }
  ],
  "generatedHtml": "Semantisches HTML für WordPress (Gutenberg)",
  "generatedCss": "Ergänzende ZQP Animationen und Barrierefreiheits-Stile",
  "generatedJs": "Reines Vanilla JS für Interaktion, Tastaturnavigation und Lösung-Anzeigen-Logik",
  "tailwindConfig": "tailwind.config = { theme: { extend: { colors: { zqp: { petrol: '#247a6d', 'petrol-dark': '#1b5c53', 'petrol-deep': '#00473d', 'bg-soft': '#f3f8f7', 'bg-accent': '#e3eeec', border: '#bbd1cd', text: '#444444', alert: '#722b28' } } } } };"
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
    const compiled = compileQuizToBundle(parsed);
    parsed.generatedHtml = compiled.html;
    parsed.generatedCss = compiled.css;
    parsed.generatedJs = compiled.js;
    parsed.tailwindConfig = compiled.tailwindConfig;
    parsed.referenceSourceText = referenceText || "";
    parsed.editorialStatus = "draft";
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
  editorialRules?: string;
  glossary?: GlossaryEntry[];
}

export async function refineQuizWithGemini(
  params: RefineQuizParams
): Promise<QuizGenerationResult> {
  const { apiKey, model, existingQuiz, refinementPrompt, editorialRules, glossary } = params;

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

  const editorialBlock = buildEditorialPromptBlock(editorialRules, glossary);

  const promptSystem = `Du bist ein erfahrener Bildungsredakteur der Stiftung ZQP (zqp.de).
Der Nutzer hat bereits ein HTML5-Quiz erstellt und möchte nun gezielte ANPASSUNGEN daran vornehmen, OHNE dass das gesamte Quiz neu erstellt wird.

${editorialBlock}

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
    const compiled = compileQuizToBundle(parsed);
    parsed.generatedHtml = compiled.html;
    parsed.generatedCss = compiled.css;
    parsed.generatedJs = compiled.js;
    parsed.tailwindConfig = compiled.tailwindConfig;
    parsed.referenceSourceText = existingQuiz.referenceSourceText || "";
    parsed.editorialStatus = existingQuiz.editorialStatus || "draft";
    parsed.editorialNotes = existingQuiz.editorialNotes || "";
    return parsed;
  } catch (err) {
    console.error("Failed to parse Gemini JSON:", err, textOutput);
    throw new Error("Antwort von Gemini konnte nicht als valides Quiz-JSON interpretiert werden.");
  }
}

// Built-in authentic ZQP demo quiz generator (used when offline or testing without key)
function generateLocalDemoQuiz(
  topic: string,
  count: number,
  audience: TargetAudience
): QuizGenerationResult {
  const allDemoStations: QuizStation[] = [
    {
      id: "st-1",
      type: "matching",
      title: "Station 1: Zuordnungs-Puzzle Sturzgefahren",
      promptOrInstruction: "Verbinden Sie jede typische Gefahrenstelle mit der passenden ZQP-Schutzmaßnahme:",
      zqpRationale: "Antirutschmatten, Haltegriffe und feste Schuhe verringern die Sturzgefahr im Badezimmer um über 70 %.",
      solutionExplanation: "Die ideale Absicherung: Nasse Fliesen brauchen Antirutschmatten und feste Haltegriffe. Bei nächtlichem Harndrang schützt eine Orientierungsbeleuchtung. Auf glatten Böden geben geschlossene Hausschuhe mit Fersenhalt festen Stand.",
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
      type: "myth_fact",
      title: "Station 3: Mythos vs. Fakt: Bettgitter",
      promptOrInstruction: "Entscheiden Sie: Handelt es sich bei der folgenden Aussage um einen Mythos oder eine belegte Tatsache?",
      zqpRationale: "Bettgitter vermitteln trügerische Sicherheit und erhöhen bei Kletterversuchen die Fallhöhe erheblich.",
      solutionExplanation: "Es handelt sich um einen gefährlichen Mythos! Bettgitter verhindern Stürze bei mobilen, desorientierten Personen nicht zuverlässig. Stattdessen versuchen Betroffene häufig darüberzuklettern und stürzen aus gefährlicher Höhe. Der ZQP-Standard empfiehlt Niedrigstbetten mit Boden-Abrollmatten.",
      mythFactItems: [
        {
          id: "mf-1",
          statement: "Bettgitter schützen ältere und demenziell erkrankte Menschen nachts zuverlässig vor schweren Stürzen.",
          isFact: false,
          explanation: "Mythos! Studien und ZQP-Erhebungen belegen: Bettgitter verhindern Stürze nicht, sondern steigern bei Kletterversuchen die Sturzhöhe und das Risiko schwerer Kopfverletzungen drastisch. Besser sind Niedrigstbetten und Sensormatten."
        }
      ]
    },
    {
      id: "st-4",
      type: "bucket_sort",
      title: "Station 4: Dos & Don'ts: Akute Unruhe bei Demenz",
      promptOrInstruction: "Sortieren Sie die Verhaltensweisen in die richtige Spalte (Empfohlen vs. Vermeiden):",
      zqpRationale: "Empathische Validation und Reizreduktion deeskalieren Verwirrtheitszustände wirksam.",
      solutionExplanation: "Empfohlen (Do): Ruhig auf Augenhöhe sprechen und warmes, schattenfreies Licht einschalten. Vermeiden (Don't): Widersprechen/Korrigieren und Einsperren erzeugen Panik und Gegenwehr.",
      bucketSortItems: [
        {
          id: "bs-1",
          text: "Ruhig auf Augenhöhe ansprechen und sanfte Handberührung anbieten",
          targetBucket: "do",
          explanation: "Do: Beruhigt das vegetative Nervensystem und signalisiert Sicherheit."
        },
        {
          id: "bs-2",
          text: "Laut widersprechen und die Person sachlich korrigieren",
          targetBucket: "dont",
          explanation: "Don't: Zerstört Vertrauen und verstärkt Verzweiflung und Unruhe."
        },
        {
          id: "bs-3",
          text: "Für blendfreie, warme Beleuchtung im Raum sorgen",
          targetBucket: "do",
          explanation: "Do: Beseitigt Schattenwürfe, die bei Demenz leicht als bedrohlich missdeutet werden."
        },
        {
          id: "bs-4",
          text: "Die Person zur Beruhigung im Sessel fixieren oder einschließen",
          targetBucket: "dont",
          explanation: "Don't: Freiheitsentziehende Maßnahme, führt zu massiver Panik und Gegenwehr."
        }
      ]
    },
    {
      id: "st-5",
      type: "comparison",
      title: "Station 5: A/B-Situationsvergleich im Wohnbereich",
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
          explanation: "Warum dies gefährlich ist: Lose Teppichläufer ohne gummierte Unterseite rutschen bei jedem Schritt weg. Kanten rollen sich auf und werden zu Stolperfallen. Das querliegende Kabel fängt die Fußspitze ein."
        },
        {
          id: "B",
          title: "Szenario B: Freie Wege & fixierte Kabel",
          badge: "Sturzpräventiv ✓",
          description: "Freie Laufwege ohne lose Vorleger, Kabel sind sauber an der Fußleiste befestigt und nachts leuchtet eine schattenfreie Sockelleuchte.",
          isCorrect: true,
          explanation: "Warum dies optimal ist: Durch den Verzicht auf lose Läufer bleibt der Bodenkontakt plan. Fixierte Kabel schalten Stolperfallen aus und die Sockelbeleuchtung nimmt Sehunsicherheiten bei Dämmerung."
        }
      ]
    },
    {
      id: "st-6",
      type: "dilemma",
      title: "Station 6: Praxis-Dilemma: Nächtlicher Toilettengang",
      promptOrInstruction: "Herr K. (83, beginnende Demenz) möchte nachts aufstehen, weigert sich aber, die helle Deckenlampe einzuschalten. Wie reagieren Sie am besten?",
      zqpRationale: "Autonomie und Sicherheit müssen in der häuslichen Pflege partnerschaftlich ausbalanciert werden.",
      solutionExplanation: "Reaktion 2 ist optimal: Ein blendfreies Orientierungslicht respektiert seinen Schlaf-Wach-Rhythmus, ohne Kompromisse bei der Trittsicherheit einzugehen.",
      dilemmaReactions: [
        {
          id: "dil-1",
          text: "Ihm das Aufstehen verbieten und auf sofortige Bettruhe pochen",
          isOptimal: false,
          consequence: "Herr K. fühlt sich bevormundet und versucht heimlich aufzustehen – akutes Sturzrisiko!",
          zqpAdvice: "Verbote führen bei Demenz fast immer zu heimlichen Aufstehversuchen im Dunkeln."
        },
        {
          id: "dil-2",
          text: "Blendfreies, bodennahes Sockellicht / Nachtlicht mit Bewegungsmelder einschalten",
          isOptimal: true,
          consequence: "Der Laufweg zum Bad wird blendfrei erleuchtet, ohne Herrn K.s Augen zu überreizen.",
          zqpAdvice: "Respektiert seine Autonomie und gewährleistet gleichzeitig sichere Trittsicht."
        },
        {
          id: "dil-3",
          text: "Das grelle Deckenlicht gegen seinen Protest einschalten",
          isOptimal: false,
          consequence: "Die plötzliche Blendung irritiert Herrn K. und führt zu Schwindelgefühlen.",
          zqpAdvice: "Grelle Deckenleuchten führen bei nächtlich erwachten Senioren zu starker Blendung und Desorientierung."
        }
      ]
    },
    {
      id: "st-7",
      type: "checklist",
      title: "Station 7: Interaktive Checkliste: Wohnraumanpassung",
      promptOrInstruction: "Wählen Sie genau die 3 Maßnahmen aus, die das häusliche Sturzrisiko nach ZQP-Leitlinien am stärksten senken:",
      zqpRationale: "Schwellenfreiheit, Griffsicherheit und blendfreie Sicht sind die drei Säulen barrierefreien Wohnens.",
      solutionExplanation: "Die 3 unverzichtbaren Kernmaßnahmen: 1. Beseitigung aller losen Teppiche/Läufer. 2. Montage fester Haltegriffe in Nassbereichen. 3. Blendfreie Nacht-Orientierungsbeleuchtung.",
      checklistItems: [
        {
          id: "chk-1",
          text: "Beseitigung aller losen Teppiche & Läufer ohne rutschhemmende Unterlage",
          isCorrect: true,
          explanation: "Richtig: Beseitigt Stolper- und Rutschkanten als Ursache Nr. 1 für Wohnungsstürze."
        },
        {
          id: "chk-2",
          text: "Montage stabiler, kontrastreicher Haltegriffe in Dusche und neben dem WC",
          isCorrect: true,
          explanation: "Richtig: Bietet zuverlässigen mechanischen Halt bei nassem oder ermüdetem Stand."
        },
        {
          id: "chk-3",
          text: "Installation blendfreier Bewegungsmelder für die Nachtstrecke ins Bad",
          isCorrect: true,
          explanation: "Richtig: Erleichtert die Hell-Dunkel-Adaption älterer Augen und markiert den Gehweg."
        },
        {
          id: "chk-4",
          text: "Komplette Vermeidung von Bewegung zur angeblichen Schonung der Gelenke",
          isCorrect: false,
          explanation: "Falsch: Bewegungsmangel beschleunigt Muskelabbau und verschlechtert das Gleichgewicht drastisch."
        },
        {
          id: "chk-5",
          text: "Kauf von offenen Schlappen für möglichst schnelles Hineinschlüpfen",
          isCorrect: false,
          explanation: "Falsch: Offene Fersen führen zu Instabilität und Ausrutschern."
        }
      ]
    },
    {
      id: "st-8",
      type: "fill_in_the_blank",
      title: "Station 8: Wort-Lückentext: ZQP-Notfall-Leitsatz",
      promptOrInstruction: "Setzen Sie die passenden Wortbausteine in die Lücken des ZQP-Leitsatzes ein:",
      zqpRationale: "Strukturierte Notfallkompetenz verhindert Folgeverletzungen nach einem Sturzereignis.",
      solutionExplanation: "Der ZQP-Leitsatz lautet: 'Nach einem Sturz ist zuerst RUHE zu bewahren und keinesfalls ein überstürztes AUFRICHTEN zu erzwingen.'",
      fillInSentence: "Nach einem Sturz ist zuerst [BLANK_1] zu bewahren und keinesfalls ein überstürztes [BLANK_2] zu erzwingen.",
      fillInBlanks: [
        {
          id: "BLANK_1",
          correctWord: "Ruhe",
          options: ["Ruhe", "Panik", "Hektik"]
        },
        {
          id: "BLANK_2",
          correctWord: "Aufrichten",
          options: ["Aufrichten", "Schlafen", "Wärmen"]
        }
      ]
    },
    {
      id: "st-9",
      type: "single_choice",
      title: "Station 9: Wissenscheck: Sturzsicheres Schuhwerk",
      promptOrInstruction: "Welche Schuhmerkmale bieten älteren und pflegebedürftigen Menschen in der Wohnung nachweislich den sichersten Halt?",
      zqpRationale: "Schuhe mit stabiler Fersenkappe und Profilsohle verringern die Sturzgefahr im Haushalt signifikant.",
      solutionExplanation: "Geschlossene Hausschuhe mit fester Fersenkappe und rutschfester Profilsohle stützen das Sprunggelenk optimal.",
      options: [
        {
          text: "Geschlossene Hausschuhe mit Fersenhalt und rutschfester Profilsohle",
          isCorrect: true,
          explanation: "Richtig: Eine feste Fersenkappe verhindert ein Wegrutschen oder Umknicken des Fußes bei Richtungswechseln."
        },
        {
          text: "Bequeme Schlappen ohne Fersenriemen zum schnellen Hineinschlüpfen",
          isCorrect: false,
          explanation: "Falsch: Offene Schlappen rutschen beim Gehen leicht vom Fuß ab und zwingen zu einem unsicheren Schlurfschritt."
        },
        {
          text: "Dicke Wollsocken ohne Gummierung für maximalen Komfort",
          isCorrect: false,
          explanation: "Falsch: Glatte Wollsocken bieten auf Holz- oder Fliesenböden keinerlei Bodenhaftung – akute Rutschgefahr!"
        }
      ]
    },
    {
      id: "st-10",
      type: "ordering",
      title: "Station 10: Notfallkette nach einem häuslichen Sturz",
      promptOrInstruction: "Welche Reihenfolge ist unmittelbar nach einem Sturz einer pflegebedürftigen Person einzuhalten?",
      zqpRationale: "Überstürztes Aufrichten nach einem Sturz kann Frakturen und Kreislaufkollapse verschlimmern.",
      solutionExplanation: "Die richtige Notfallfolge: 1. Ruhe bewahren und Schmerzen/Atmung prüfen. 2. Notruf oder Hausnotrufknopf betätigen, wenn kein schmerzfreies Aufstehen möglich ist. 3. Person warmhalten und betreuen.",
      orderingSteps: [
        {
          id: "notfall-1",
          text: "Ruhe bewahren, nach Schmerzen fragen und Ansprechbarkeit prüfen",
          correctIndex: 0,
          reason: "Schritt 1: Verschaffen Sie sich erst einen Überblick, um Schock oder Brüche nicht durch voreilige Bewegung zu verschlimmern."
        },
        {
          id: "notfall-2",
          text: "Hausnotruf oder 112 auslösen, falls eigenständiges Aufstehen unmöglich ist",
          correctIndex: 1,
          reason: "Schritt 2: Professionelle Hilfe herbeirufen, bevor ungeeignete Hebeversuche unternommen werden."
        },
        {
          id: "notfall-3",
          text: "Person mit einer Decke wärmen und bis zum Eintreffen der Hilfe beruhigend begleiten",
          correctIndex: 2,
          reason: "Schritt 3: Auskühlung auf kaltem Boden verhindern und psychischen Halt geben."
        }
      ]
    }
  ];

  const targetCount = Math.max(1, Math.min(10, count || 3));
  const finalStations = allDemoStations.slice(0, targetCount).map((s, idx) => ({
    ...s,
    id: `st-${idx + 1}`,
    title: `Station ${idx + 1}: ${s.title.split(": ")[1] || s.title}`,
  }));

  return {
    title: topic.trim() ? topic : "Sturzprävention im Alltag: Interaktive ZQP-Lernreise",
    targetAudience: audience,
    summary: "Rund 80 % der Stürze im häuslichen Umfeld lassen sich durch einfache Wohnraumanpassungen und passendes Schuhwerk vermeiden. Informieren Sie sich in unserem ZQP-Ratgeber 'Sturzprävention' auf zqp.de.",
    needsTailwind: true,
    needsFontAwesome: false,
    tailwindConfig: `tailwind.config = {
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
};`,
    stations: finalStations,
    generatedHtml: `<!-- ZQP Interaktives Lern-Quiz (zqp.de) -->
<div id="zqp-game-root" class="zqp-quiz-container">
  <header id="zqp-game-header">
    <div class="zqp-header-top">
      <span class="zqp-badge">🧩 ZQP Praxistest</span>
      <span id="zqp-station-counter">Station 1 von ${targetCount}</span>
    </div>
    <h2 id="zqp-game-title">Sturzprävention im Alltag</h2>
    <div class="zqp-progress-bar">
      <div id="zqp-progress-fill" style="width: ${(1 / targetCount) * 100}%;"></div>
    </div>
  </header>

  <main id="zqp-game-stage" class="zqp-stage">
    <div id="zqp-station-content">
      <!-- Station-Inhalt wird dynamisch gerendert -->
    </div>
  </main>

  <footer id="zqp-game-footer">
    <div id="zqp-footer-left">
      <button id="zqp-btn-reveal" type="button" class="zqp-btn-secondary">
        💡 Lösung anzeigen
      </button>
    </div>
    <div id="zqp-footer-right">
      <button id="zqp-btn-action" type="button" class="zqp-btn-primary" disabled>
        ${targetCount === 1 ? "Zur Gesamtauswertung ➔" : "Nächste Station ➔"}
      </button>
    </div>
  </footer>

  <div class="zqp-copyright-footer">
    Stiftung Zentrum für Qualität in der Pflege • ${new Date().getFullYear()}
  </div>

  <!-- Slide-Up Feedback Drawer (Zero Scrollbars, No Layout Shifts) -->
  <div id="zqp-drawer" class="zqp-drawer">
    <div class="zqp-drawer-header">
      <div id="zqp-drawer-title" class="zqp-drawer-title">✓ Auswertung</div>
      <button id="zqp-btn-close-drawer" type="button" class="zqp-btn-close" title="Erklärung schließen & Ansicht ansehen">
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
  padding: 0.875rem 1.25rem;
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
  margin-top: 0.5rem;
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
  overflow-y: auto;
  padding: 1rem 1.25rem;
  position: relative;
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
  transition: background 0.2s, opacity 0.2s;
}

.zqp-btn-primary:hover:not(:disabled) {
  background-color: #1b5c53;
}

.zqp-btn-primary:disabled {
  opacity: 0.4;
  cursor: not-allowed;
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
  border: 1.5px solid #bbd1cd;
  border-radius: 0.75rem;
  padding: 0.625rem 0.875rem;
  margin-bottom: 0.35rem;
  cursor: pointer;
  background: #ffffff;
  transition: all 0.15s;
  font-size: 0.8125rem;
}

.puzzle-piece:hover {
  border-color: #247a6d;
  background: #f3f8f7;
}

.puzzle-piece.selected {
  border-color: #247a6d;
  background-color: #e3eeec;
  outline: 2px solid #247a6d;
}

/* Slide-up Feedback Drawer Styles */
.zqp-drawer {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  max-height: 80%;
  background: #f8fafc;
  border-top: 2px solid #247a6d;
  box-shadow: 0 -10px 25px -5px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  transform: translateY(100%);
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  z-index: 20;
}

.zqp-drawer.open {
  transform: translateY(0);
}

.zqp-drawer.drawer-correct {
  border-top-color: #10b981;
  background: #f0fdf4;
}

.zqp-drawer.drawer-revealed {
  border-top-color: #f59e0b;
  background: #fffbeb;
}

.zqp-drawer.drawer-incorrect {
  border-top-color: #ef4444;
  background: #fef2f2;
}

.zqp-drawer-header {
  padding: 0.625rem 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(0,0,0,0.06);
}

.zqp-drawer-title {
  font-size: 0.8125rem;
  font-weight: 700;
  color: #1b5c53;
}

.zqp-btn-close {
  background: transparent;
  border: none;
  font-size: 0.75rem;
  font-weight: 600;
  color: #6e6c70;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  border-radius: 0.375rem;
}

.zqp-btn-close:hover {
  background: rgba(0,0,0,0.05);
  color: #1b5c53;
}

.zqp-drawer-body {
  padding: 0.875rem 1rem;
  font-size: 0.8125rem;
  line-height: 1.45;
  color: #334155;
  overflow: hidden;
}

.zqp-drawer-actions {
  padding: 0.625rem 1rem;
  display: flex;
  justify-content: flex-end;
  border-top: 1px solid rgba(0,0,0,0.06);
  background: rgba(255,255,255,0.7);
}`,
    generatedJs: `/* ZQP Quiz Interaktion (Vanilla JS mit dynamischem Stations-Array) */
(function() {
  var root = document.getElementById("zqp-game-root");
  if (!root) return;

  var currentStation = 0;
  var stationsData = ${JSON.stringify(finalStations)};
  var totalStations = stationsData.length;
  var stationResults = {}; // sIdx -> "solved" | "unsolved"
  var canAdvance = false;

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
    drawer.className = "zqp-drawer open " + (type === "correct" ? "drawer-correct" : type === "revealed" ? "drawer-revealed" : "drawer-incorrect");
    if (drawerTitle) drawerTitle.textContent = (type === "correct" ? "✓ " : type === "revealed" ? "💡 " : "⚠️ ") + title;
    if (drawerBody) {
      drawerBody.innerHTML = '<p style="margin:0 0 0.5rem 0; font-weight:600;">' + explanation + '</p>' +
        (zqpInfo ? '<div style="font-size:0.75rem; color:#475569; border-top:1px solid rgba(0,0,0,0.06); padding-top:0.35rem;"><strong>ZQP-Praxishinweis:</strong> ' + zqpInfo + '</div>' : '');
    }
  }

  function renderStation(idx) {
    closeDrawer();
    canAdvance = false;
    if (btnAction) {
      btnAction.disabled = true;
      btnAction.textContent = (idx === totalStations - 1) ? "Zur Gesamtauswertung ➔" : "Nächste Station ➔";
    }
    if (btnDrawerNext) {
      btnDrawerNext.textContent = (idx === totalStations - 1) ? "Zur Gesamtauswertung ➔" : "Nächste Station ➔";
    }
    if (btnReveal) {
      btnReveal.textContent = "💡 Lösung anzeigen";
    }
    if (counter) counter.textContent = "Station " + (idx + 1) + " von " + totalStations;
    if (progressFill) progressFill.style.width = (((idx + 1) / totalStations) * 100) + "%";

    var st = stationsData[idx];
    if (!st) return;

    var html = '<h3 style="color:#1b5c53; font-weight:700; margin-bottom:0.5rem; font-size:1rem;">' + st.title + '</h3>' +
      '<p style="font-size:0.8125rem; margin-bottom:0.875rem; color:#444;">' + st.promptOrInstruction + '</p>';

    if (st.type === "matching" && st.matchingPairs) {
      html += '<div style="display:flex; flex-direction:column; gap:0.4rem;">';
      st.matchingPairs.forEach(function(pair, pIdx) {
        html += '<div class="puzzle-piece" onclick="window.zqpSelectMatch(' + idx + ',' + pIdx + ')">' +
          '<strong>⚠️ ' + pair.threatOrTerm + '</strong> ➔ ' + pair.solutionOrDef +
          '</div>';
      });
      html += '</div>';
    } else if (st.type === "ordering" && st.orderingSteps) {
      html += '<div style="display:flex; flex-direction:column; gap:0.4rem;">';
      st.orderingSteps.forEach(function(step, sIdx) {
        html += '<div class="puzzle-piece" onclick="window.zqpSelectOrder(' + idx + ',' + sIdx + ')">' +
          step.text +
          '</div>';
      });
      html += '</div>';
    } else if (st.type === "comparison" && st.comparisonScenarios) {
      html += '<div style="display:grid; grid-template-columns:1fr 1fr; gap:0.5rem;">';
      st.comparisonScenarios.forEach(function(sc, cIdx) {
        html += '<div class="puzzle-piece" style="margin-bottom:0;" onclick="window.zqpSelectCompare(' + idx + ',' + cIdx + ')">' +
          '<span style="display:inline-block; font-size:0.6875rem; font-weight:700; padding:0.125rem 0.375rem; border-radius:0.25rem; margin-bottom:0.25rem; background:#f1f5f9;">' + sc.badge + '</span>' +
          '<div style="font-weight:700; font-size:0.8125rem; color:#1b5c53; margin-bottom:0.25rem;">' + sc.title + '</div>' +
          '<div style="font-size:0.75rem; color:#555;">' + sc.description + '</div>' +
          '</div>';
      });
      html += '</div>';
    } else if (st.type === "single_choice" && st.options) {
      html += '<div style="display:flex; flex-direction:column; gap:0.4rem;">';
      st.options.forEach(function(opt, oIdx) {
        html += '<div class="puzzle-piece" onclick="window.zqpSelectChoice(' + idx + ',' + oIdx + ')">' +
          opt.text +
          '</div>';
      });
      html += '</div>';
    }

    content.innerHTML = html;
  }

  function markStationCompleted(mode, explanation, zqpInfo) {
    canAdvance = true;
    stationResults[currentStation] = mode;
    if (btnAction) btnAction.disabled = false;
    if (btnReveal) btnReveal.textContent = "💡 Erklärung anzeigen";
    openDrawer(mode === "solved" ? "correct" : "revealed", mode === "solved" ? "Richtig gelöst!" : "Lösung aufgedeckt", explanation, zqpInfo);
  }

  window.zqpSelectMatch = function(stIdx, pIdx) {
    var st = stationsData[stIdx];
    var pair = st.matchingPairs[pIdx];
    markStationCompleted("solved", pair.explanation, st.zqpRationale);
  };

  window.zqpSelectOrder = function(stIdx, sIdx) {
    var st = stationsData[stIdx];
    var step = st.orderingSteps[sIdx];
    if (step.correctIndex === 0) {
      markStationCompleted("solved", st.solutionExplanation || "Richtig sortiert!", st.zqpRationale);
    } else {
      openDrawer("incorrect", "Reihenfolge prüfen", step.reason || "Überlegen Sie, welcher Schritt zuerst Stabilität verleiht.", st.zqpRationale);
    }
  };

  window.zqpSelectCompare = function(stIdx, cIdx) {
    var st = stationsData[stIdx];
    var sc = st.comparisonScenarios[cIdx];
    if (sc.isCorrect) {
      markStationCompleted("solved", sc.explanation, st.zqpRationale);
    } else {
      openDrawer("incorrect", "Erhöhtes Sturzrisiko", sc.explanation, st.zqpRationale);
    }
  };

  window.zqpSelectChoice = function(stIdx, oIdx) {
    var st = stationsData[stIdx];
    var opt = st.options[oIdx];
    if (opt.isCorrect) {
      markStationCompleted("solved", opt.explanation, st.zqpRationale);
    } else {
      openDrawer("incorrect", "Nicht empfohlen", opt.explanation, st.zqpRationale);
    }
  };

  if (btnCloseDrawer) btnCloseDrawer.addEventListener("click", closeDrawer);

  if (btnReveal) {
    btnReveal.addEventListener("click", function() {
      var st = stationsData[currentStation];
      if (canAdvance) {
        if (drawer && drawer.classList.contains("open")) {
          closeDrawer();
        } else {
          openDrawer(stationResults[currentStation] === "solved" ? "correct" : "revealed", "Erklärung", st.solutionExplanation || "Fachlich fundiert nach den Empfehlungen der Stiftung ZQP (zqp.de).", st.zqpRationale);
        }
      } else {
        markStationCompleted("unsolved", st.solutionExplanation || "Hier ist die empfohlene Lösung nach den Richtlinien der Stiftung ZQP.", st.zqpRationale);
      }
    });
  }

  function advanceStation() {
    closeDrawer();
    if (currentStation < totalStations - 1) {
      currentStation++;
      renderStation(currentStation);
    } else {
      var solvedCount = Object.keys(stationResults).filter(function(k) { return stationResults[k] === "solved"; }).length;
      var breakdownHtml = '';
      for (var i = 0; i < totalStations; i++) {
        var isSol = stationResults[i] === 'solved';
        breakdownHtml += '<div style="display:flex; justify-content:space-between; padding:0.25rem 0; border-bottom:1px solid rgba(0,0,0,0.05);">' +
          '<span style="max-width:70%; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">Station ' + (i + 1) + ': ' + (stationsData[i].title.replace(/^Station \\d+:\\s*/, '')) + '</span>' +
          '<span style="font-weight:600; color:' + (isSol ? '#047857' : '#991b1b') + '; shrink:0;">' + (isSol ? '✓ Gelöst' : '✕ Nicht gelöst') + '</span>' +
          '</div>';
      }

      content.innerHTML = '<div style="text-align:center; padding:1rem;">' +
        '<div style="width:44px; height:44px; border-radius:50%; background:#e3eeec; border:2px solid #247a6d; margin:0 auto 0.5rem auto; display:flex; align-items:center; justify-content:center; font-size:1.35rem;">🏆</div>' +
        '<h3 style="color:#1b5c53; font-size:1.1rem; font-weight:700; margin-bottom:0.2rem;">Glückwunsch! Praxistest beendet</h3>' +
        '<p style="font-size:0.75rem; color:#6e6c70; margin-bottom:0.75rem;">Sie haben alle ' + totalStations + ' Stationen abgeschlossen.</p>' +
        '<div style="background:#f3f8f7; border:1px solid #bbd1cd; border-radius:0.75rem; padding:0.75rem; text-align:left; font-size:0.75rem;">' +
        '<div style="display:flex; justify-content:space-between; font-weight:700; color:#1b5c53; margin-bottom:0.5rem; border-bottom:1px solid rgba(0,0,0,0.06); padding-bottom:0.35rem;">' +
        '<span>Ihr Testergebnis:</span>' +
        '<span style="background:#d1fae5; color:#065f46; padding:0.125rem 0.5rem; border-radius:9999px;">' + solvedCount + ' von ' + totalStations + ' Aufgaben gelöst</span>' +
        '</div>' +
        '<div style="line-height:1.5; margin-bottom:0.5rem;">' + breakdownHtml + '</div>' +
        '<div style="margin-top:0.35rem; padding-top:0.35rem; border-top:1px solid rgba(0,0,0,0.06); font-size:0.6875rem; color:#475569;">' +
        '<strong>ZQP-Fazit:</strong> Rund 80 % der Stürze im Alltag lassen sich durch Wohnraumanpassungen und passendes Schuhwerk verhindern. Ratgeber auf zqp.de.' +
        '</div>' +
        '</div>' +
        '</div>';
      if (btnReveal) btnReveal.style.display = "none";
      if (btnAction) {
        btnAction.disabled = false;
        btnAction.textContent = "Test wiederholen ↺";
        btnAction.onclick = function() { location.reload(); };
      }
    }
  }

  if (btnAction) btnAction.addEventListener("click", advanceStation);
  if (btnDrawerNext) btnDrawerNext.addEventListener("click", advanceStation);

  renderStation(0);
})();`,
  };
}

// ----------------------------------------------------
// 1. Quelltext-Abgleich & Zitat-Finder (Anti-Halluzination)
// ----------------------------------------------------

export interface SourceCitationMatch {
  isVerified: boolean;
  score: number; // 0-100%
  bestQuote: string;
  matchedKeywords: string[];
  explanation: string;
}

export function findSourceCitationsForStation(
  station: QuizStation,
  sourceText?: string
): SourceCitationMatch {
  if (!sourceText || sourceText.trim().length === 0) {
    return {
      isVerified: false,
      score: 0,
      bestQuote: "",
      matchedKeywords: [],
      explanation: "Kein Quelltext hinterlegt (Basiert auf allgemeinem Fachwissen).",
    };
  }

  // Extract key search terms from title, prompt, rationale, and options
  const rawTerms = [
    station.title,
    station.promptOrInstruction,
    station.zqpRationale,
    ...(station.options?.map((o) => o.text) || []),
    ...(station.matchingPairs?.map((m) => `${m.threatOrTerm} ${m.solutionOrDef}`) || []),
    ...(station.orderingSteps?.map((o) => o.text) || []),
    ...(station.mythFactItems?.map((m) => m.statement) || []),
    ...(station.bucketSortItems?.map((b) => b.text) || []),
    ...(station.dilemmaReactions?.map((d) => `${d.text} ${d.zqpAdvice}`) || []),
  ].join(" ");

  const stopWords = new Set([
    "der", "die", "das", "und", "oder", "ein", "eine", "einer", "eines", "einem", "einen",
    "in", "im", "an", "am", "auf", "aus", "bei", "mit", "nach", "von", "zu", "zum", "zur",
    "ist", "sind", "war", "wird", "werden", "hat", "haben", "kann", "können", "soll", "sollte",
    "nicht", "auch", "wie", "für", "über", "unter", "durch", "vor", "nach", "beim", "dass",
    "wenn", "aber", "sehr", "mehr", "immer", "noch", "hier", "dort", "man", "sich", "ihre", "ihr",
    "station", "frage", "richtig", "falsch", "warum", "welche", "welcher", "welches", "diese", "dieser"
  ]);

  const words = rawTerms
    .toLowerCase()
    .replace(/[^a-zäöüß0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 3 && !stopWords.has(w));

  const uniqueKeywords = Array.from(new Set(words));
  if (uniqueKeywords.length === 0) {
    return {
      isVerified: false,
      score: 0,
      bestQuote: "",
      matchedKeywords: [],
      explanation: "Keine spezifischen Fachbegriffe für den Abgleich extrahiert.",
    };
  }

  // Split source text into sentences and paragraphs
  const paragraphs = sourceText
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 20);

  let bestParagraph = "";
  let highestMatches: string[] = [];
  let maxScore = 0;

  for (const para of paragraphs) {
    const paraLower = para.toLowerCase();
    const matched = uniqueKeywords.filter((k) => paraLower.includes(k));
    const score = Math.round((matched.length / Math.min(uniqueKeywords.length, 5)) * 100);
    if (score > maxScore) {
      maxScore = score;
      highestMatches = matched;
      bestParagraph = para;
    }
  }

  if (bestParagraph.length > 350) {
    const sentences = bestParagraph.split(/(?<=[.!?])\s+/);
    let bestSentence = "";
    let maxSentScore = 0;
    for (const sent of sentences) {
      const sentLower = sent.toLowerCase();
      const matched = uniqueKeywords.filter((k) => sentLower.includes(k));
      if (matched.length > maxSentScore) {
        maxSentScore = matched.length;
        bestSentence = sent;
      }
    }
    if (bestSentence.length > 30) {
      bestParagraph = bestSentence.trim();
    }
  }

  const isVerified = maxScore >= 40;
  return {
    isVerified,
    score: Math.min(maxScore, 100),
    bestQuote: bestParagraph,
    matchedKeywords: highestMatches.slice(0, 5),
    explanation: isVerified
      ? `Belegt im Dokument (${maxScore}% Übereinstimmung anhand: ${highestMatches.slice(0, 3).join(", ")})`
      : `Geringe direkte Übereinstimmung (${maxScore}%). Beruht vermutlich auf allgemeinem Fachwissen oder abweichender Wortwahl.`,
  };
}

// ----------------------------------------------------
// 2. Einzelstations-Varianten-Generator ("3 Varianten / Neu würfeln")
// ----------------------------------------------------

export interface GenerateStationVariantsParams {
  apiKey: string;
  model: string;
  station: QuizStation;
  contextTopic: string;
  targetAudience?: TargetAudience;
  editorialRules?: string;
  glossary?: GlossaryEntry[];
}

export async function generateStationVariantsWithGemini(
  params: GenerateStationVariantsParams
): Promise<QuizStation[]> {
  const { apiKey, model, station, contextTopic, targetAudience = "angehoerige", editorialRules, glossary } = params;

  // Offline simulation fallback
  if (!apiKey || apiKey.trim() === "") {
    return [
      {
        ...station,
        id: `var-1-${Date.now()}`,
        title: `${station.title} (Fokussiert)`,
        promptOrInstruction: `Auf den Punkt gebracht: ${station.promptOrInstruction.replace(/^.+?:\s*/, "")}`,
        zqpRationale: `Didaktisch pointierte Variante: ${station.zqpRationale}`,
      },
      {
        ...station,
        id: `var-2-${Date.now()}`,
        title: `${station.title} (Praxisfall)`,
        promptOrInstruction: `Alltagssituation aus der häuslichen Pflege: Eine pflegende Angehörige steht vor folgender Situation. ${station.promptOrInstruction}`,
        zqpRationale: `Praxisorientierte Fallvariante mit direktem Alltagsbezug: ${station.zqpRationale}`,
      },
      {
        id: `var-3-${Date.now()}`,
        type: "dilemma",
        title: `${station.title} (Ethisches Dilemma)`,
        promptOrInstruction: `Wie entscheiden Sie sich in diesem Pflegekonflikt?`,
        zqpRationale: `Reflexionsaufgabe für wertschätzendes Handeln im ZQP-Sinne: ${station.zqpRationale}`,
        dilemmaReactions: [
          {
            id: "d1",
            text: "Sofort rigoros eingreifen und alle Freiheiten einschränken",
            isOptimal: false,
            consequence: "Erzeugt Abwehr, Angst und Misstrauen beim Pflegebedürftigen.",
            zqpAdvice: "Besser: Im Dialog bleiben und sanfte Kompromisse erarbeiten.",
          },
          {
            id: "d2",
            text: "Verstehend zuhören, Ressourcen stärken und gemeinsam eine sichere Lösung vereinbaren",
            isOptimal: true,
            consequence: "Fördert das Vertrauen und bewahrt Würde und Autonomie.",
            zqpAdvice: "Optimal: Personenzentriertes Handeln entspricht den ZQP-Qualitätskriterien.",
          },
        ],
      },
    ];
  }

  const editorialBlock = buildEditorialPromptBlock(editorialRules, glossary);

  const promptSystem = `Du bist Bildungsredakteur der Stiftung ZQP (zqp.de).
Deine Aufgabe ist es, für eine EINZELNE Quiz-Station 3 didaktisch hochwertige ALTERNATIVEN (Varianten) zu generieren.

${editorialBlock}

THEMA DES GESAMT-QUIZ: ${contextTopic}
ZIELGRUPPE: ${targetAudience}

ANFORDERUNGEN AN DIE 3 VARIANTEN:
- Variante 1: Prägnanter, kürzer und didaktisch direkter formuliert.
- Variante 2: Ein konkretes Fallbeispiel aus dem Pflegealltag (z.B. mit fiktiver Person / Alltagsszene).
- Variante 3: Alternative Aufgabenmechanik (z.B. als Dilemma, Mythos/Fakt oder Bucket-Sort).
- Jede Option muss ausführliche 'Warum richtig / Warum falsch' Erklärungen enthalten!
- Die Ausgabe MUSS ein JSON-Array mit genau 3 Stationen sein ([Station1, Station2, Station3]), konform zum QuizStation-Schema.`;

  const userContent = `Aktuelle Station (JSON):
${JSON.stringify(station, null, 2)}`;

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
    throw new Error("Keine Antwort von Gemini für Station-Varianten erhalten.");
  }

  const parsed = JSON.parse(textOutput);
  const list = Array.isArray(parsed) ? parsed : parsed.stations || [parsed];
  return list.slice(0, 3).map((st: QuizStation, idx: number) => ({
    ...st,
    id: `variant-${idx + 1}-${Date.now()}`,
    editorialStatus: "draft",
  }));
}


