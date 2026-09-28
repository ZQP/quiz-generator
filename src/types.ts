export type TargetAudience = "angehoerige" | "fachkraefte" | "senioren" | "allgemein";

export type StationType = "matching" | "ordering" | "comparison" | "single_choice" | "multiple_choice";

export interface MatchingPair {
  id: string;
  threatOrTerm: string;
  solutionOrDef: string;
}

export interface OrderingStep {
  id: string;
  text: string;
  correctIndex: number;
}

export interface ComparisonScenario {
  id: string;
  title: string;
  badge: string;
  description: string;
  isCorrect: boolean;
  explanation: string;
}

export interface QuizQuestionOption {
  text: string;
  isCorrect: boolean;
  explanation: string;
}

export interface QuizStation {
  id: string;
  type: StationType;
  title: string;
  promptOrInstruction: string;
  zqpRationale: string;
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
