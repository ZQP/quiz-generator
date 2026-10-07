import { QuizGenerationResult, TargetAudience } from "../types";

export interface QuizProject {
  id: string;
  title: string;
  updatedAt: string;
  targetAudience: TargetAudience;
  stationCount: number;
  history: QuizGenerationResult[];
  currentIndex: number;
}

const PROJECTS_STORAGE_KEY = "zqp_quiz_generator_projects_v2";
const ACTIVE_PROJECT_ID_KEY = "zqp_quiz_generator_active_project_id_v2";

export function loadProjects(): QuizProject[] {
  try {
    const raw = localStorage.getItem(PROJECTS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch (err) {
    console.warn("Fehler beim Laden der Projektbibliothek:", err);
  }
  return [];
}

export function saveProjects(projects: QuizProject[]): void {
  try {
    localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projects));
  } catch (err) {
    console.warn("Fehler beim Speichern der Projektbibliothek:", err);
  }
}

export function getActiveProjectId(): string | null {
  try {
    return localStorage.getItem(ACTIVE_PROJECT_ID_KEY);
  } catch {
    return null;
  }
}

export function setActiveProjectId(id: string | null): void {
  try {
    if (id) {
      localStorage.setItem(ACTIVE_PROJECT_ID_KEY, id);
    } else {
      localStorage.removeItem(ACTIVE_PROJECT_ID_KEY);
    }
  } catch {}
}

export function createNewProject(quiz: QuizGenerationResult): QuizProject {
  const newProject: QuizProject = {
    id: "proj_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
    title: quiz.title || "Unbenanntes ZQP-Quiz",
    updatedAt: new Date().toISOString(),
    targetAudience: quiz.targetAudience,
    stationCount: quiz.stations?.length || 0,
    history: [quiz],
    currentIndex: 0,
  };

  const projects = loadProjects();
  projects.unshift(newProject);
  saveProjects(projects);
  setActiveProjectId(newProject.id);
  return newProject;
}

export function updateProjectHistory(
  projectId: string,
  history: QuizGenerationResult[],
  index: number
): void {
  const projects = loadProjects();
  const proj = projects.find((p) => p.id === projectId);
  if (!proj) return;

  const currentQuiz = history[index] || history[0];
  proj.history = history;
  proj.currentIndex = index;
  proj.updatedAt = new Date().toISOString();
  if (currentQuiz) {
    proj.title = currentQuiz.title || proj.title;
    proj.targetAudience = currentQuiz.targetAudience || proj.targetAudience;
    proj.stationCount = currentQuiz.stations?.length || 0;
  }

  saveProjects(projects);
}

export function deleteProject(projectId: string): void {
  const projects = loadProjects().filter((p) => p.id !== projectId);
  saveProjects(projects);
  if (getActiveProjectId() === projectId) {
    setActiveProjectId(projects[0]?.id || null);
  }
}

export function duplicateProject(projectId: string): QuizProject | null {
  const projects = loadProjects();
  const original = projects.find((p) => p.id === projectId);
  if (!original) return null;

  const duplicated: QuizProject = {
    ...original,
    id: "proj_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
    title: `${original.title} (Kopie)`,
    updatedAt: new Date().toISOString(),
    history: JSON.parse(JSON.stringify(original.history)),
    currentIndex: original.currentIndex,
  };

  projects.unshift(duplicated);
  saveProjects(projects);
  return duplicated;
}

export function exportProjectToJson(project: QuizProject): string {
  return JSON.stringify(project, null, 2);
}

export function importProjectFromJson(jsonStr: string): QuizProject {
  const parsed = JSON.parse(jsonStr);
  if (!parsed || !Array.isArray(parsed.history) || parsed.history.length === 0) {
    throw new Error("Ungültiges ZQP-Projektformat: Keine Quiz-Historie gefunden.");
  }

  const newProject: QuizProject = {
    id: "proj_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
    title: parsed.title || "Importiertes ZQP-Quiz",
    updatedAt: new Date().toISOString(),
    targetAudience: parsed.targetAudience || "angehoerige",
    stationCount: parsed.stationCount || parsed.history[0]?.stations?.length || 0,
    history: parsed.history,
    currentIndex: typeof parsed.currentIndex === "number" ? parsed.currentIndex : 0,
  };

  const projects = loadProjects();
  projects.unshift(newProject);
  saveProjects(projects);
  setActiveProjectId(newProject.id);
  return newProject;
}
