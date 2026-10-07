import React, { useState, useRef } from "react";
import { X, FolderOpen, Plus, Copy, Trash2, Download, Upload, Check, Calendar, Users, Layers } from "lucide-react";
import { QuizProject, loadProjects, deleteProject, duplicateProject, exportProjectToJson, importProjectFromJson } from "../services/projectStorage";

interface ProjectLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeProjectId: string | null;
  onSelectProject: (project: QuizProject) => void;
  onNewProject: () => void;
}

export const ProjectLibraryModal: React.FC<ProjectLibraryModalProps> = ({
  isOpen,
  onClose,
  activeProjectId,
  onSelectProject,
  onNewProject,
}) => {
  const [projects, setProjects] = useState<QuizProject[]>(loadProjects);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const refreshList = () => {
    setProjects(loadProjects());
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Möchten Sie diesen Quiz-Entwurf wirklich löschen?")) {
      deleteProject(id);
      refreshList();
    }
  };

  const handleDuplicate = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    duplicateProject(id);
    refreshList();
  };

  const handleExportJson = (project: QuizProject, e: React.MouseEvent) => {
    e.stopPropagation();
    const jsonStr = exportProjectToJson(project);
    const blob = new Blob([jsonStr], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `zqp-quiz-${project.title.toLowerCase().replace(/[^a-z0-9]/g, "-")}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const imported = importProjectFromJson(content);
        refreshList();
        onSelectProject(imported);
        onClose();
      } catch (err: any) {
        alert("Fehler beim Import: " + (err?.message || "Ungültige Datei"));
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const audienceLabel = (aud: string) => {
    switch (aud) {
      case "angehoerige":
        return "Pflegende Angehörige";
      case "fachkraefte":
        return "Pflegefachkräfte";
      case "senioren":
        return "Senioren";
      default:
        return "Allgemein";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl border border-[#bbd1cd] shadow-2xl max-w-3xl w-full max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-[#f3f8f7] border-b border-[#bbd1cd] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#247a6d] text-white flex items-center justify-center shadow-xs">
              <FolderOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#1b5c53]">
                Meine Quiz-Entwürfe (Bibliothek)
              </h2>
              <p className="text-xs text-[#6e6c70]">
                Verwalten, Wechseln, Duplizieren und Sichern Ihrer ZQP-Quizprojekte
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-[#e3eeec] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="bg-[#fcfaf8] border-b border-[#e2ddd5] px-6 py-2.5 flex items-center justify-between gap-3 flex-wrap">
          <span className="text-xs text-[#6e6c70] font-medium">
            {projects.length} {projects.length === 1 ? "Entwurf" : "Entwürfe"} gespeichert
          </span>

          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImportFile}
              accept=".json"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#bbd1cd] hover:border-[#247a6d] text-xs font-semibold text-[#1b5c53] rounded-lg shadow-2xs transition-colors"
              title="Quiz aus einer .json-Datei importieren"
            >
              <Upload className="w-3.5 h-3.5 text-[#247a6d]" />
              <span>JSON importieren</span>
            </button>

            <button
              onClick={() => {
                onNewProject();
                onClose();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#247a6d] hover:bg-[#1b5c53] text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Neues Quiz starten</span>
            </button>
          </div>
        </div>

        {/* Project List */}
        <div className="p-6 overflow-y-auto flex-1 space-y-3">
          {projects.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-[#bbd1cd] rounded-xl bg-[#fcfaf8]">
              <FolderOpen className="w-10 h-10 text-[#247a6d]/40 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-[#1b5c53] mb-1">Noch keine Entwürfe gespeichert</h4>
              <p className="text-xs text-[#6e6c70] max-w-sm mx-auto mb-4">
                Erstellen Sie ein neues Quiz – es wird automatisch hier in Ihrer persönlichen Bibliothek abgelegt.
              </p>
              <button
                onClick={() => {
                  onNewProject();
                  onClose();
                }}
                className="px-4 py-2 bg-[#247a6d] hover:bg-[#1b5c53] text-white text-xs font-semibold rounded-lg shadow-xs"
              >
                Erstes Quiz erstellen
              </button>
            </div>
          ) : (
            projects.map((proj) => {
              const isActive = proj.id === activeProjectId;
              const dateStr = new Date(proj.updatedAt).toLocaleDateString("de-DE", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              });

              return (
                <div
                  key={proj.id}
                  onClick={() => {
                    onSelectProject(proj);
                    onClose();
                  }}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                    isActive
                      ? "bg-[#f3f8f7] border-[#247a6d] shadow-xs"
                      : "bg-white border-[#bbd1cd] hover:border-[#247a6d]/70 hover:shadow-2xs"
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h4 className="text-sm font-bold text-[#1b5c53] truncate">{proj.title}</h4>
                      {isActive && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-[#247a6d] text-white px-2 py-0.5 rounded-full">
                          <Check className="w-3 h-3" />
                          <span>Aktiv</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-[#6e6c70] flex-wrap">
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-[#247a6d]" />
                        <span>{audienceLabel(proj.targetAudience)}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Layers className="w-3.5 h-3.5 text-[#247a6d]" />
                        <span>{proj.stationCount} Stationen (v{proj.currentIndex + 1})</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        <span>{dateStr}</span>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={(e) => handleDuplicate(proj.id, e)}
                      className="p-1.5 text-gray-500 hover:text-[#1b5c53] hover:bg-white rounded-lg border border-transparent hover:border-[#bbd1cd] transition-colors"
                      title="Entwurf duplizieren"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => handleExportJson(proj, e)}
                      className="p-1.5 text-gray-500 hover:text-[#1b5c53] hover:bg-white rounded-lg border border-transparent hover:border-[#bbd1cd] transition-colors"
                      title="Als Projekt-JSON herunterladen"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => handleDelete(proj.id, e)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg border border-transparent hover:border-red-200 transition-colors"
                      title="Entwurf löschen"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="bg-[#f3f8f7] border-t border-[#bbd1cd] px-6 py-3 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white border border-[#bbd1cd] hover:border-[#247a6d] text-xs font-semibold text-[#1b5c53] rounded-lg shadow-2xs transition-colors"
          >
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
};
