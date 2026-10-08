import { QuizGenerationResult, TargetAudience, EditorialStatus, QuizStation, FavoriteStation } from "../types";

export interface QuizProject {
  id: string;
  title: string;
  updatedAt: string;
  targetAudience: TargetAudience;
  stationCount: number;
  history: QuizGenerationResult[];
  currentIndex: number;
  referenceSourceText?: string;
  editorialStatus?: EditorialStatus;
  editorialNotes?: string;
}

const PROJECTS_STORAGE_KEY = "zqp_quiz_generator_projects_v2";
const ACTIVE_PROJECT_ID_KEY = "zqp_quiz_generator_active_project_id_v2";
const FAVORITE_STATIONS_STORAGE_KEY = "zqp_quiz_favorite_stations_v1";

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

export function createNewProject(
  quiz: QuizGenerationResult,
  extra?: { referenceSourceText?: string; editorialStatus?: EditorialStatus; editorialNotes?: string }
): QuizProject {
  const newProject: QuizProject = {
    id: "proj_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
    title: quiz.title || "Unbenanntes ZQP-Quiz",
    updatedAt: new Date().toISOString(),
    targetAudience: quiz.targetAudience,
    stationCount: quiz.stations?.length || 0,
    history: [quiz],
    currentIndex: 0,
    referenceSourceText: extra?.referenceSourceText || quiz.referenceSourceText || "",
    editorialStatus: extra?.editorialStatus || quiz.editorialStatus || "draft",
    editorialNotes: extra?.editorialNotes || quiz.editorialNotes || "",
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
    if (currentQuiz.referenceSourceText) {
      proj.referenceSourceText = currentQuiz.referenceSourceText;
    }
    if (currentQuiz.editorialStatus) {
      proj.editorialStatus = currentQuiz.editorialStatus;
    }
    if (currentQuiz.editorialNotes !== undefined) {
      proj.editorialNotes = currentQuiz.editorialNotes;
    }
  }

  saveProjects(projects);
}

export function updateProjectMetadata(
  projectId: string,
  patch: Partial<Pick<QuizProject, "title" | "editorialStatus" | "editorialNotes" | "referenceSourceText">>
): void {
  const projects = loadProjects();
  const proj = projects.find((p) => p.id === projectId);
  if (!proj) return;

  Object.assign(proj, patch);
  proj.updatedAt = new Date().toISOString();

  // Also sync into current quiz in history
  if (proj.history[proj.currentIndex]) {
    const cur = proj.history[proj.currentIndex];
    if (patch.editorialStatus) cur.editorialStatus = patch.editorialStatus;
    if (patch.editorialNotes !== undefined) cur.editorialNotes = patch.editorialNotes;
    if (patch.referenceSourceText !== undefined) cur.referenceSourceText = patch.referenceSourceText;
    if (patch.title) cur.title = patch.title;
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
    editorialStatus: "draft", // Copies start as draft
    editorialNotes: original.editorialNotes ? `Kopie von ${original.title}. ${original.editorialNotes}` : "",
  };

  projects.unshift(duplicated);
  saveProjects(projects);
  return duplicated;
}

export function exportProjectToJson(project: QuizProject): string {
  const exportPayload = {
    format: "zqp-quiz-project",
    version: "0.2.0",
    exportedAt: new Date().toISOString(),
    project,
  };
  return JSON.stringify(exportPayload, null, 2);
}

export function importProjectFromJson(jsonStr: string): QuizProject {
  const parsed = JSON.parse(jsonStr);
  const data = parsed.project || parsed;

  if (!data || !Array.isArray(data.history) || data.history.length === 0) {
    throw new Error("Ungültiges ZQP-Projektformat: Keine Quiz-Historie gefunden.");
  }

  const newProject: QuizProject = {
    id: "proj_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
    title: data.title || "Importiertes ZQP-Quiz",
    updatedAt: new Date().toISOString(),
    targetAudience: data.targetAudience || "angehoerige",
    stationCount: data.stationCount || data.history[0]?.stations?.length || 0,
    history: data.history,
    currentIndex: typeof data.currentIndex === "number" ? data.currentIndex : 0,
    referenceSourceText: data.referenceSourceText || data.history[0]?.referenceSourceText || "",
    editorialStatus: data.editorialStatus || data.history[0]?.editorialStatus || "draft",
    editorialNotes: data.editorialNotes || data.history[0]?.editorialNotes || "",
  };

  const projects = loadProjects();
  projects.unshift(newProject);
  saveProjects(projects);
  setActiveProjectId(newProject.id);
  return newProject;
}

// ----------------------------------------------------
// Stations-Schatzkiste / Vorlagen-Bibliothek (Favorites)
// ----------------------------------------------------

export function loadFavoriteStations(): FavoriteStation[] {
  try {
    const raw = localStorage.getItem(FAVORITE_STATIONS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch (err) {
    console.warn("Fehler beim Laden der Favoriten-Stationen:", err);
  }
  return [];
}

export function saveFavoriteStation(
  station: QuizStation,
  category: string = "Allgemein"
): FavoriteStation {
  const favorites = loadFavoriteStations();
  const existing = favorites.find((f) => f.station.title === station.title);
  if (existing) {
    existing.savedAt = new Date().toISOString();
    existing.category = category;
    existing.station = JSON.parse(JSON.stringify(station));
    try {
      localStorage.setItem(FAVORITE_STATIONS_STORAGE_KEY, JSON.stringify(favorites));
    } catch {}
    return existing;
  }

  const newFavorite: FavoriteStation = {
    id: "fav_stat_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
    savedAt: new Date().toISOString(),
    category,
    station: JSON.parse(JSON.stringify(station)),
  };

  favorites.unshift(newFavorite);
  try {
    localStorage.setItem(FAVORITE_STATIONS_STORAGE_KEY, JSON.stringify(favorites));
  } catch (err) {
    console.warn("Fehler beim Speichern des Favoriten:", err);
  }
  return newFavorite;
}

export function deleteFavoriteStation(favoriteId: string): void {
  const favorites = loadFavoriteStations().filter((f) => f.id !== favoriteId);
  try {
    localStorage.setItem(FAVORITE_STATIONS_STORAGE_KEY, JSON.stringify(favorites));
  } catch {}
}
