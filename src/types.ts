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
  | "fill_in_the_blank";

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
  dilemmaReactions?: DilemmaReaction[];
  checklistItems?: ChecklistItem[];
  fillInSentence?: string;
  fillInBlanks?: BlankItem[];
  editorialStatus?: EditorialStatus;
  editorialNotes?: string;
  sourceQuote?: string; // Direct citation from source document (anti-hallucination)
}

export interface QuizGenerationResult {
  title: string;
  targetAudience: TargetAudience;
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
}

export interface AppSettings {
  geminiApiKey: string;
  selectedModel: string;
  availableModels: string[];
  autoUpdate: boolean;
  editorialRules?: string;
  glossary?: GlossaryEntry[];
}
