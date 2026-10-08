import React, { useState, useEffect } from "react";
import { Settings, DownloadCloud, FolderOpen } from "lucide-react";
import { AppSettings } from "../types";
import { checkForAppUpdates, installAppUpdate, isTauriApp } from "../services/updaterService";
import { APP_VERSION } from "../version";

interface HeaderProps {
  settings: AppSettings;
  onOpenSettings: () => void;
  onOpenLibrary: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  onOpenSettings,
  onOpenLibrary,
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
              v{APP_VERSION}
            </span>
          </div>
          <p className="text-[11px] text-[#6e6c70] leading-tight hidden sm:block">
            Redaktionswerkzeug für interaktive Webmodule auf zqp.de
          </p>
        </div>
      </div>

      {/* Action Toolbar (Schlank & Fokussiert) */}
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

        {/* Compact Model / API Key Indicator */}
        {settings.geminiApiKey && settings.geminiApiKey.trim() ? (
          <div
            className="hidden md:flex items-center gap-1.5 h-8 px-2.5 rounded-lg bg-[#f3f8f7] border border-[#bbd1cd] text-xs text-[#1b5c53]"
            title={`Gemini API verbunden • Modell: ${settings.selectedModel}`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[#6e6c70] font-normal">KI:</span>
            <span className="font-semibold">{settings.selectedModel}</span>
          </div>
        ) : (
          <button
            type="button"
            onClick={onOpenSettings}
            className="hidden sm:flex items-center gap-1.5 h-8 px-2.5 rounded-lg bg-amber-50 border border-amber-300 text-xs text-amber-900 hover:bg-amber-100 transition-colors cursor-pointer shadow-2xs"
            title="Kein Gemini API-Schlüssel hinterlegt. Klicken, um Einstellungen zu öffnen."
          >
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="font-bold text-amber-800">Demo-Modus</span>
            <span className="text-[11px] text-amber-700 underline font-normal">(API-Key fehlt)</span>
          </button>
        )}

        <div className="hidden sm:block h-5 w-px bg-[#bbd1cd]/70 mx-0.5" />

        {/* Library Button */}
        <button
          onClick={onOpenLibrary}
          className="h-8 flex items-center gap-1.5 px-3 rounded-lg bg-white border border-[#bbd1cd] hover:border-[#247a6d] hover:bg-[#f3f8f7] text-xs font-semibold text-[#1b5c53] transition-colors shadow-2xs cursor-pointer"
          title="Gespeicherte Quiz-Entwürfe & Projektdateien öffnen"
        >
          <FolderOpen className="w-3.5 h-3.5 text-[#247a6d]" />
          <span>Meine Entwürfe</span>
        </button>

        {/* Settings Button */}
        <button
          onClick={onOpenSettings}
          className="h-8 flex items-center gap-1.5 px-3 rounded-lg bg-white border border-[#bbd1cd] hover:border-[#247a6d] hover:bg-[#f3f8f7] text-xs font-semibold text-[#1b5c53] transition-colors shadow-2xs cursor-pointer"
          title="Einstellungen, Redaktionsleitfaden & API-Schlüssel"
          aria-label="Einstellungen öffnen"
        >
          <Settings className="w-3.5 h-3.5 text-[#247a6d]" />
          <span className="hidden sm:inline">Einstellungen</span>
        </button>
      </div>
    </header>
  );
};

