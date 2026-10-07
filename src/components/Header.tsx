import React, { useState, useEffect } from "react";
import { Settings, Sparkles, DownloadCloud, FolderOpen, ShieldCheck } from "lucide-react";
import { AppSettings } from "../types";
import { checkForAppUpdates, installAppUpdate, isTauriApp } from "../services/updaterService";

interface HeaderProps {
  settings: AppSettings;
  onOpenSettings: () => void;
  onOpenLibrary: () => void;
  onOpenAudit: () => void;
  hasCurrentQuiz: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  onOpenSettings,
  onOpenLibrary,
  onOpenAudit,
  hasCurrentQuiz,
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
        <div className="w-8 h-8 rounded-lg bg-linear-to-br from-[#247a6d] to-[#1b5c53] flex items-center justify-center text-white font-extrabold text-xs tracking-wider shadow-2xs shrink-0">
          ZQP
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-bold text-[#1b5c53] tracking-tight leading-tight">
              Quiz- & Lernspiel-Generator
            </h1>
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#e3eeec] text-[#1b5c53] border border-[#bbd1cd]">
              v0.1.0 Beta
            </span>
          </div>
          <p className="text-[11px] text-[#6e6c70] leading-tight hidden sm:block">
            Redaktionswerkzeug für interaktive Webmodule auf zqp.de
          </p>
        </div>
      </div>

      {/* Action Toolbar */}
      <div className="flex items-center gap-2">
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

        {/* Quality Audit Button */}
        {hasCurrentQuiz && (
          <button
            onClick={onOpenAudit}
            className="h-8 flex items-center gap-1.5 px-3 rounded-lg bg-white border border-[#bbd1cd] hover:border-[#247a6d] hover:bg-[#f3f8f7] text-xs font-semibold text-[#1b5c53] transition-colors shadow-2xs cursor-pointer"
            title="Qualitäts- & Barrierefreiheitsprüfung (WCAG 2.1 AA)"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-[#247a6d]" />
            <span className="hidden lg:inline">Qualitäts-Audit</span>
            <span className="lg:hidden">Audit</span>
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
          title="Einstellungen & API-Schlüssel"
          aria-label="Einstellungen öffnen"
        >
          <Settings className="w-3.5 h-3.5 text-[#247a6d]" />
          <span className="hidden sm:inline">Einstellungen</span>
        </button>
      </div>
    </header>
  );
};

