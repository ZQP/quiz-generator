import React, { useState, useEffect } from "react";
import { Settings, Sparkles, DownloadCloud, FolderOpen, ShieldCheck, FileSearch, Star } from "lucide-react";
import { AppSettings, EditorialStatus } from "../types";
import { checkForAppUpdates, installAppUpdate, isTauriApp } from "../services/updaterService";

interface HeaderProps {
  settings: AppSettings;
  onOpenSettings: () => void;
  onOpenLibrary: () => void;
  onOpenAudit: () => void;
  onOpenSourceInspector?: () => void;
  onOpenFavorites?: () => void;
  hasCurrentQuiz: boolean;
  editorialStatus?: EditorialStatus;
  onChangeStatus?: (status: EditorialStatus) => void;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  onOpenSettings,
  onOpenLibrary,
  onOpenAudit,
  onOpenSourceInspector,
  onOpenFavorites,
  hasCurrentQuiz,
  editorialStatus,
  onChangeStatus,
}) => {
  const [availableVersion, setAvailableVersion] = useState<string | null>(null);
  const [isInstalling, setIsInstalling] = useState<boolean>(false);
  const [installProgress, setInstallProgress] = useState<string>("");

  useEffect(() => {
    // Silent background check if running in Tauri desktop and auto-update is active
    if (settings.autoUpdate && isTauriApp()) {
      checkForAppUpdates(true).then((res) => {
        if (res.updateFound && res.version) {
          setAvailableVersion(res.version);
        }
      });
    }
  }, [settings.autoUpdate]);

  const handleInstallUpdate = async () => {
    if (!availableVersion) return;
    setIsInstalling(true);
    setInstallProgress("Start...");
    const result = await installAppUpdate((downloaded, total) => {
      if (total > 0) {
        const pct = Math.round((downloaded / total) * 100);
        setInstallProgress(`${pct}%`);
      } else {
        setInstallProgress(`${Math.round(downloaded / 1024)} KB`);
      }
    });
    if (!result.success) {
      setIsInstalling(false);
      alert(`Update fehlgeschlagen: ${result.error}`);
    }
  };

  return (
    <header className="bg-white border-b border-[#bbd1cd] px-5 py-2.5 flex items-center justify-between shadow-2xs sticky top-0 z-30 select-none">
      {/* Brand & Title */}
      <div className="flex items-center gap-3">
        <img
          src="/favicon.png"
          alt="ZQP Quiz-Generator"
          className="w-8 h-8 rounded-lg shadow-2xs shrink-0 object-contain"
        />
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-bold text-[#1b5c53] tracking-tight leading-tight">
              Quiz- & Lernspiel-Generator
            </h1>
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#e3eeec] text-[#1b5c53] border border-[#bbd1cd]">
              v0.2.0
            </span>
          </div>
          <p className="text-[11px] text-[#6e6c70] leading-tight hidden sm:block">
            Redaktionswerkzeug für interaktive Webmodule auf zqp.de
          </p>
        </div>
      </div>

      {/* Action Toolbar */}
      <div className="flex items-center gap-2">
        {/* Editorial Status Dropdown */}
        {hasCurrentQuiz && (
          <div className="flex items-center gap-1.5 h-8 px-2 rounded-lg bg-white border border-[#bbd1cd] text-xs">
            <span
              className={`w-2 h-2 rounded-full ${
                editorialStatus === "approved"
                  ? "bg-emerald-500"
                  : editorialStatus === "in_review"
                  ? "bg-sky-500"
                  : "bg-amber-500"
              }`}
            />
            <select
              value={editorialStatus || "draft"}
              onChange={(e) => onChangeStatus?.(e.target.value as EditorialStatus)}
              className="font-bold text-[11px] text-[#1b5c53] bg-transparent outline-none cursor-pointer pr-1"
              title="Redaktions-Status des aktuellen Quiz ändern"
            >
              <option value="draft">Entwurf</option>
              <option value="in_review">In Prüfung</option>
              <option value="approved">Freigegeben</option>
            </select>
          </div>
        )}

        {/* Update Notification (only shown when an update is actually available!) */}
        {availableVersion && (
          <button
            onClick={handleInstallUpdate}
            disabled={isInstalling}
            className="h-8 text-xs flex items-center gap-1.5 px-3 rounded-lg bg-[#247a6d] text-white hover:bg-[#1b5c53] font-semibold transition-colors shadow-2xs animate-pulse cursor-pointer shrink-0"
            title="Neueste Version herunterladen und installieren"
          >
            <DownloadCloud className="w-3.5 h-3.5" />
            <span>
              {isInstalling ? `Update (${installProgress})...` : `Update verfügbar (v${availableVersion})`}
            </span>
          </button>
        )}

        {/* Model Indicator Chip */}
        <div className="hidden md:flex items-center gap-1.5 h-8 px-2.5 rounded-lg bg-[#f3f8f7] border border-[#bbd1cd] text-xs text-[#1b5c53]">
          <Sparkles className="w-3.5 h-3.5 text-[#247a6d]" />
          <span className="text-[#6e6c70] font-normal">Modell:</span>
          <span className="font-semibold">{settings.selectedModel}</span>
        </div>

        <div className="hidden sm:block h-5 w-px bg-[#bbd1cd]/70 mx-0.5" />

        {/* Source Inspector Button */}
        {hasCurrentQuiz && onOpenSourceInspector && (
          <button
            onClick={onOpenSourceInspector}
            className="h-8 flex items-center gap-1.5 px-2.5 rounded-lg bg-white border border-[#bbd1cd] hover:border-[#247a6d] hover:bg-[#f3f8f7] text-xs font-semibold text-[#1b5c53] transition-colors shadow-2xs cursor-pointer"
            title="Quelltext-Abgleich & Zitat-Finder (Anti-Halluzination)"
          >
            <FileSearch className="w-3.5 h-3.5 text-[#247a6d]" />
            <span className="hidden xl:inline">Quelltext-Abgleich</span>
            <span className="xl:hidden">Quellen</span>
          </button>
        )}

        {/* Favorites Library Button */}
        {onOpenFavorites && (
          <button
            onClick={onOpenFavorites}
            className="h-8 flex items-center gap-1.5 px-2.5 rounded-lg bg-white border border-[#bbd1cd] hover:border-[#247a6d] hover:bg-[#f3f8f7] text-xs font-semibold text-[#1b5c53] transition-colors shadow-2xs cursor-pointer"
            title="Stations-Schatzkiste (Vorlagen-Bibliothek)"
          >
            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            <span className="hidden xl:inline">Schatzkiste</span>
          </button>
        )}

        {/* Quality Audit Button */}
        {hasCurrentQuiz && (
          <button
            onClick={onOpenAudit}
            className="h-8 flex items-center gap-1.5 px-2.5 rounded-lg bg-white border border-[#bbd1cd] hover:border-[#247a6d] hover:bg-[#f3f8f7] text-xs font-semibold text-[#1b5c53] transition-colors shadow-2xs cursor-pointer"
            title="Qualitäts- & Barrierefreiheitsprüfung (WCAG 2.1 AA)"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-[#247a6d]" />
            <span className="hidden lg:inline">Audit</span>
          </button>
        )}

        {/* Library Button */}
        <button
          onClick={onOpenLibrary}
          className="h-8 flex items-center gap-1.5 px-3 rounded-lg bg-white border border-[#bbd1cd] hover:border-[#247a6d] hover:bg-[#f3f8f7] text-xs font-semibold text-[#1b5c53] transition-colors shadow-2xs cursor-pointer"
          title="Gespeicherte Quiz-Entwürfe öffnen"
        >
          <FolderOpen className="w-3.5 h-3.5 text-[#247a6d]" />
          <span className="hidden lg:inline">Meine Entwürfe</span>
          <span className="lg:hidden">Entwürfe</span>
        </button>

        {/* Settings Button */}
        <button
          onClick={onOpenSettings}
          className="h-8 flex items-center gap-1.5 px-3 rounded-lg bg-white border border-[#bbd1cd] hover:border-[#247a6d] hover:bg-[#f3f8f7] text-xs font-semibold text-[#1b5c53] transition-colors shadow-2xs cursor-pointer"
          title="Einstellungen, Glossar & API-Schlüssel"
          aria-label="Einstellungen öffnen"
        >
          <Settings className="w-3.5 h-3.5 text-[#247a6d]" />
          <span className="hidden sm:inline">Einstellungen</span>
        </button>
      </div>
    </header>
  );
};

