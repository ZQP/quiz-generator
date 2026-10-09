import { describe, it, expect, beforeEach } from "vitest";
import {
  loadProjects,
  createNewProject,
  deleteProject,
  duplicateProject,
  exportProjectToJson,
  importProjectFromJson,
  updateProjectMetadata,
  saveFavoriteStation,
  loadFavoriteStations,
  deleteFavoriteStation,
  stripCompiledBundle,
} from "./projectStorage";
import { QuizGenerationResult } from "../types";

describe("projectStorage", () => {
  const store: Record<string, string> = {};

  beforeEach(() => {
    for (const key of Object.keys(store)) {
      delete store[key];
    }

    globalThis.localStorage = {
      getItem: (key: string) => store[key] ?? null,
      setItem: (key: string, value: string) => {
        store[key] = String(value);
      },
      removeItem: (key: string) => {
        delete store[key];
      },
      clear: () => {
        for (const key of Object.keys(store)) {
          delete store[key];
        }
      },
      key: (index: number) => Object.keys(store)[index] ?? null,
      get length() {
        return Object.keys(store).length;
      },
    } as Storage;

    const listeners: Record<string, Function[]> = {};
    (globalThis as any).window = {
      addEventListener: (type: string, fn: Function) => {
        listeners[type] = listeners[type] || [];
        listeners[type].push(fn);
      },
      removeEventListener: (type: string, fn: Function) => {
        listeners[type] = (listeners[type] || []).filter((l) => l !== fn);
      },
      dispatchEvent: (evt: any) => {
        (listeners[evt.type] || []).forEach((fn) => fn(evt));
        return true;
      },
    };
    (globalThis as any).CustomEvent = class CustomEvent {
      type: string;
      constructor(type: string) {
        this.type = type;
      }
    };
  });

  const mockQuiz: QuizGenerationResult = {
    title: "Demenz-Quiz",
    targetAudience: "angehoerige",
    summary: "Praxistipps für den Alltag",
    needsTailwind: true,
    needsFontAwesome: false,
    generatedHtml: "",
    generatedCss: "",
    generatedJs: "",
    stations: [],
  };

  it("creates, saves and loads a new project in library", () => {
    const proj = createNewProject(mockQuiz);

    expect(proj.id).toBeDefined();
    expect(proj.title).toBe("Demenz-Quiz");

    const projects = loadProjects();
    expect(projects.length).toBe(1);
    expect(projects[0].title).toBe("Demenz-Quiz");
  });

  it("duplicates an existing project", () => {
    const proj = createNewProject(mockQuiz);
    const copy = duplicateProject(proj.id);

    expect(copy).not.toBeNull();
    expect(copy?.title).toBe("Demenz-Quiz (Kopie)");

    const projects = loadProjects();
    expect(projects.length).toBe(2);
  });

  it("deletes a project from library", () => {
    const proj = createNewProject(mockQuiz);
    deleteProject(proj.id);

    const projects = loadProjects();
    expect(projects.length).toBe(0);
  });

  it("exports and imports a project JSON correctly", () => {
    const proj = createNewProject(mockQuiz);
    const jsonStr = exportProjectToJson(proj);

    expect(jsonStr).toContain("Demenz-Quiz");

    const imported = importProjectFromJson(jsonStr);
    expect(imported.title).toBe("Demenz-Quiz");

    const projects = loadProjects();
    expect(projects.length).toBe(2);
  });

  it("updates project editorial metadata and manages favorite stations", () => {
    const proj = createNewProject(mockQuiz);
    updateProjectMetadata(proj.id, {
      editorialStatus: "approved",
      editorialNotes: "Freigegeben durch Chefredaktion",
    });

    const projects = loadProjects();
    expect(projects[0].editorialStatus).toBe("approved");
    expect(projects[0].editorialNotes).toContain("Chefredaktion");

    // Favorites
    const favStation = {
      id: "stat_1",
      type: "myth_fact" as const,
      title: "Demenz-Mythos",
      promptOrInstruction: "Ist Demenz vererbbar?",
      zqpRationale: "Fundierte Begründung",
    };

    let eventDispatched = false;
    const listener = () => {
      eventDispatched = true;
    };
    window.addEventListener("zqp_favorites_changed", listener);

    const saved = saveFavoriteStation(favStation, "Demenz");
    expect(saved.id).toBeDefined();
    expect(eventDispatched).toBe(true);

    const favs = loadFavoriteStations();
    expect(favs.length).toBe(1);
    expect(favs[0].station.title).toBe("Demenz-Mythos");

    eventDispatched = false;
    deleteFavoriteStation(saved.id);
    expect(loadFavoriteStations().length).toBe(0);
    expect(eventDispatched).toBe(true);
    window.removeEventListener("zqp_favorites_changed", listener);
  });

  it("strips bulky compiled code bundles to save localStorage space", () => {
    const bulkyQuiz: QuizGenerationResult = {
      ...mockQuiz,
      generatedHtml: "<div id='heavy-html'>...50kb...</div>",
      generatedCss: ".heavy-css { color: red; }",
      generatedJs: "console.log('heavy-js');",
      tailwindConfig: "tailwind.config = {};",
    };

    const stripped = stripCompiledBundle(bulkyQuiz);
    expect(stripped.title).toBe("Demenz-Quiz");
    expect(stripped.generatedHtml).toBeUndefined();
    expect(stripped.generatedCss).toBeUndefined();
    expect(stripped.generatedJs).toBeUndefined();
    expect(stripped.tailwindConfig).toBeUndefined();
  });
});

