import React, { useState, useEffect } from "react";
import { Settings, RefreshCw, DownloadCloud, CheckCircle2 } from "lucide-react";
import { AppSettings } from "../types";
import { checkForAppUpdates, installAppUpdate, isTauriApp } from "../services/updaterService";

interface HeaderProps {
  settings: AppSettings;
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({ settings, onOpenSettings }) => {
  const [updateStatus, setUpdateStatus] = useState<string>("App aktuell (v0.1.0 Beta)");
  const [isCheckingUpdate, setIsCheckingUpdate] = useState<boolean>(false);
  const [availableVersion, setAvailableVersion] = useState<string | null>(null);
  const [isInstalling, setIsInstalling] = useState<boolean>(false);
  const [installProgress, setInstallProgress] = useState<string>("");

  useEffect(() => {
    // If running in Tauri desktop and auto-update is enabled, run a silent background check
    if (settings.autoUpdate && isTauriApp()) {
      checkForAppUpdates(true).then((res) => {
        if (res.updateFound && res.version) {
          setAvailableVersion(res.version);
          setUpdateStatus(`Update bereit (v${res.version})`);
        }
      });
    }
  }, [settings.autoUpdate]);

  const handleUpdateClick = async () => {
    if (availableVersion) {
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
      return;
    }

    setIsCheckingUpdate(true);
    setUpdateStatus("Prüfe auf GitHub...");
    try {
      const res = await checkForAppUpdates(false);
      if (res.updateFound && res.version) {
        setAvailableVersion(res.version);
        setUpdateStatus(`Update bereit (v${res.version})`);
      } else if (!res.isDesktop) {
        setUpdateStatus("v0.1.0 Beta (Web-Vorschau)");
      } else if (res.error) {
        setUpdateStatus("Update-Server nicht erreichbar");
      } else {
        setUpdateStatus("Aktuellste Version (v0.1.0 Beta)");
      }
    } catch {
      setUpdateStatus("Prüfung fehlgeschlagen");
    } finally {
      setIsCheckingUpdate(false);
    }
  };

  return (
    <header className="bg-white border-b border-[#bbd1cd] px-6 py-3 flex items-center justify-between shadow-sm sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-[#247a6d] flex items-center justify-center text-white font-bold text-lg shadow-sm">
            ZQP
          </div>
          <div>
            <h1 className="text-base font-bold text-[#1b5c53] leading-tight">
              ZQP Quiz- & Lernspiel-Generator
            </h1>
            <p className="text-xs text-[#6e6c70]">
              Barrierefreie HTML5-Quizze für zqp.de (Puzzle, Zuordnung, Vergleiche)
            </p>
          </div>
        </div>
        <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[#e3eeec] text-[#1b5c53] border border-[#bbd1cd]">
          v0.1.0 (Beta)
        </span>
      </div>

      <div className="flex items-center gap-3">
        {/* Auto-Update Check / Install Button */}
        {availableVersion ? (
          <button
            onClick={handleUpdateClick}
            disabled={isInstalling}
            className="text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#247a6d] text-white hover:bg-[#1b5c53] font-semibold transition-colors shadow-sm animate-pulse"
            title="Klicken, um das neueste Update herunterzuladen und zu installieren"
          >
            <DownloadCloud className="w-3.5 h-3.5" />
            <span>
              {isInstalling
                ? `Installiere Update... (${installProgress})`
                : `Update installieren (v${availableVersion})`}
            </span>
          </button>
        ) : (
          <button
            onClick={handleUpdateClick}
            disabled={isCheckingUpdate}
            className="text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#bbd1cd] hover:bg-[#f3f8f7] text-[#444444] transition-colors focus:ring-2 focus:ring-[#247a6d] focus:outline-none"
            title="Nach neuer Version auf GitHub suchen"
          >
            {isCheckingUpdate ? (
              <RefreshCw className="w-3.5 h-3.5 text-[#247a6d] animate-spin" />
            ) : (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            )}
            <span>{updateStatus}</span>
          </button>
        )}

        {/* Model Indicator Badge */}
        <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#f3f8f7] border border-[#bbd1cd] text-xs text-[#1b5c53]">
          <span className="font-semibold">Modell:</span>
          <span>{settings.selectedModel}</span>
        </div>

        {/* Settings Button */}
        <button
          onClick={onOpenSettings}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[#bbd1cd] hover:border-[#247a6d] hover:bg-[#f3f8f7] text-xs font-medium text-[#1b5c53] transition-colors focus:ring-2 focus:ring-[#247a6d] focus:outline-none"
          aria-label="Einstellungen öffnen"
        >
          <Settings className="w-4 h-4 text-[#247a6d]" />
          <span>Einstellungen</span>
        </button>
      </div>
    </header>
  );
};
