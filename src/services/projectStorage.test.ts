import { describe, it, expect, beforeEach } from "vitest";
import {
  loadProjects,
  createNewProject,
  deleteProject,
  duplicateProject,
  exportProjectToJson,
  importProjectFromJson,
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
});
