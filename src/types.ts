export type TargetAudience = "angehoerige" | "fachkraefte" | "senioren" | "allgemein";

export type StationType =
  | "matching"
  | "ordering"
  | "comparison"
  | "single_choice"
  | "myth_fact"
  | "bucket_sort"
  | "dilemma"
  | "checklist"
  | "fill_in_the_blank"
  | "branching_scenario";

export interface MatchingPair {
  id: string;
  threatOrTerm: string;
  solutionOrDef: string;
  explanation?: string; // Why this pair matches
}

export interface OrderingStep {
  id: string;
  text: string;
  correctIndex: number;
  reason?: string; // Why this step has this position
}

export interface ComparisonScenario {
  id: string;
  title: string;
  badge: string;
  description: string;
  isCorrect: boolean;
  explanation: string; // Detailed reasoning why this is safe or risky
}

export interface QuizQuestionOption {
  text: string;
  isCorrect: boolean;
  explanation: string; // Specific rationale explaining why this option is correct or false
}

export interface MythFactItem {
  id: string;
  statement: string;
  isFact: boolean; // true = Fakt, false = Mythos
  explanation: string; // Detailed pedagogical justification
}

export interface BucketSortItem {
  id: string;
  text: string;
  targetBucket: "do" | "dont"; // "do" = Empfohlen, "dont" = Vermeiden
  explanation: string;
}

export interface DilemmaReaction {
  id: string;
  text: string;
  isOptimal: boolean;
  consequence: string;
  zqpAdvice: string;
}

export interface ChecklistItem {
  id: string;
  text: string;
  isCorrect: boolean;
  explanation: string;
}

export interface BlankItem {
  id: string;
  correctWord: string;
  options: string[];
}

export interface BranchingChoice {
  id: string;
  text: string;               // Handlung/Antwort des Nutzers
  consequenceText: string;    // Was daraufhin geschieht (Reaktion der Person)
  isOptimal: boolean;         // Didaktisch optimal vs. risikobehaftet
  nextStepId?: string;        // ID des nächsten Schritts / Knotens (oder undefined für Abschluss)
  zqpAdvice: string;          // ZQP-Praxistipp zu dieser spezifischen Wahl
}

export interface BranchingNode {
  id: string;                 // z.B. "step_1", "step_2_a", "step_2_b"
  sceneTitle: string;         // z.B. "Szene 1: Nächtliche Unruhe", "Szene 2: Deeskalation"
  situationDescription: string;
  choices: BranchingChoice[];
}

export interface BranchingScenarioData {
  rootNodeId: string;
  depthMode: "compact_2_steps" | "deep_3_steps";
  nodes: Record<string, BranchingNode>;
  zqpSummaryAdvice: string;
}

export type EditorialStatus = "draft" | "in_review" | "approved";

export interface GlossaryEntry {
  id: string;
  term: string;        // E.g. "Demenzkranke"
  preferred: string;   // E.g. "Menschen mit Demenz"
  explanation?: string;// E.g. "Person-zentrierte Sprache nach Tom Kitwood"
}

export interface FavoriteStation {
  id: string;
  savedAt: string;
  category?: string;
  station: QuizStation;
}

export interface QuizCustomLabels {
  feedbackWhyLabel?: string;       // Default: "Warum richtig / Warum falsch:"
  feedbackKnowledgeLabel?: string; // Default: "ZQP-Praxiswissen:"
  feedbackCloseLabel?: string;     // Default: "Ansicht ansehen ✕"
  bucketDoLabel?: string;          // Default: "Do ✓"
  bucketDontLabel?: string;        // Default: "Don't ✕"
  bucketDoHeader?: string;         // Default: "Empfohlen (Do)"
  bucketDontHeader?: string;       // Default: "Vermeiden (Don't)"
  nextStationLabel?: string;       // Default: "Nächste Station"
  finishStationLabel?: string;     // Default: "Zur Gesamtauswertung"
  restartQuizLabel?: string;       // Default: "Praxistest wiederholen"
}

export interface QuizResultScreenConfig {
  title?: string;                  // Default: "Praxistest abgeschlossen"
  subtitle?: string;               // Optionaler Rat / Auswertungstext
  scoreLabel?: string;             // Default: "Ihr Praxistest-Ergebnis:"
  perfectScoreTitle?: string;      // Default: "Hervorragend! Alle Aufgaben gelöst"
  perfectScoreText?: string;       // Default: "Perfektes Ergebnis: Alle {total} Stationen eigenständig gemeistert (100%)."
  goodScoreTitle?: string;         // Default: "Gutes Ergebnis im Praxistest"
  goodScoreText?: string;          // Default: "Solide Leistung: {solved} von {total} Stationen eigenständig gelöst ({percent}%)."
  lowScoreTitle?: string;          // Default: "Praxistest abgeschlossen"
  lowScoreText?: string;           // Default: "{solved} von {total} Stationen gelöst ({percent}%). Nutzen Sie die ZQP-Erklärungen zur Vertiefung."
  zeroScoreTitle?: string;         // Default: "Praxistest durchlaufen"
  zeroScoreText?: string;          // Default: "Keine Station eigenständig gelöst. Wiederholen Sie das Training, um das Wissen zu festigen."
  restartButtonText?: string;      // Default: "Praxistest wiederholen"
  printButtonText?: string;        // Default: "Ergebnis als PDF drucken"
}

export interface QuizStation {
  id: string;
  type: StationType;
  title: string;
  promptOrInstruction: string;
  zqpRationale: string;
  solutionExplanation?: string; // Complete solution breakdown for "Lösung anzeigen"
  matchingPairs?: MatchingPair[];
  orderingSteps?: OrderingStep[];
  comparisonScenarios?: ComparisonScenario[];
  options?: QuizQuestionOption[];
  mythFactItems?: MythFactItem[];
  bucketSortItems?: BucketSortItem[];
  bucketDoLabel?: string;      // Optional override per station
  bucketDontLabel?: string;    // Optional override per station
  bucketDoHeader?: string;     // Optional override per station
  bucketDontHeader?: string;   // Optional override per station
  dilemmaReactions?: DilemmaReaction[];
  checklistItems?: ChecklistItem[];
  fillInSentence?: string;
  fillInBlanks?: BlankItem[];
  branchingScenario?: BranchingScenarioData;
  editorialStatus?: EditorialStatus;
  editorialNotes?: string;
  sourceQuote?: string; // Direct citation from source document (anti-hallucination)
}

export interface QuizThemeColors {
  primary: string;
  primaryDark: string;
  primaryDeep: string;
  primaryLight: string;
  accent: string;
  bgRoot: string;
  bgStage?: string;
  cardBg: string;
  border: string;
  textMain: string;
  textMuted: string;
  headerText: string;
}

export interface QuizTheme {
  id: string;
  name: string;
  description: string;
  badge?: string;
  isBuiltin: boolean;
  colors: QuizThemeColors;
}

export interface QuizGenerationResult {
  title: string;
  topicPrompt?: string;
  allowedMechanics?: StationType[];
  targetAudience: TargetAudience;
  themeId?: string;
  customTheme?: QuizTheme;
  stations: QuizStation[];
  needsTailwind: boolean;
  needsFontAwesome: boolean;
  summary: string;
  generatedHtml: string;
  generatedCss: string;
  generatedJs: string;
  tailwindConfig?: string;
  enablePrintSummary?: boolean;
  referenceSourceText?: string; // Full original uploaded/input text for verification
  editorialStatus?: EditorialStatus;
  editorialNotes?: string;
  customLabels?: QuizCustomLabels;
  resultScreen?: QuizResultScreenConfig;
}

export interface AppSettings {
  geminiApiKey: string;
  selectedModel: string;
  availableModels: string[];
  autoUpdate: boolean;
  defaultThemeId?: string;
  editorialRules?: string;
  glossary?: GlossaryEntry[];
  defaultCustomLabels?: QuizCustomLabels;
  defaultResultScreen?: QuizResultScreenConfig;
}

