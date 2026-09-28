export type TargetAudience = "angehoerige" | "fachkraefte" | "senioren" | "allgemein";

export type StationType = "matching" | "ordering" | "comparison" | "single_choice" | "multiple_choice";

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
}

export interface AppSettings {
  geminiApiKey: string;
  selectedModel: string;
  availableModels: string[];
  autoUpdate: boolean;
}
