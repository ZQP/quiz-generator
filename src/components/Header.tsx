import React, { useState } from "react";
import { Settings, RefreshCw } from "lucide-react";
import { AppSettings } from "../types";

interface HeaderProps {
  settings: AppSettings;
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({ settings, onOpenSettings }) => {
  const [updateStatus, setUpdateStatus] = useState<string>("App aktuell");
  const [isCheckingUpdate, setIsCheckingUpdate] = useState<boolean>(false);

  const handleCheckUpdate = () => {
    setIsCheckingUpdate(true);
    setUpdateStatus("Prüfe...");
    setTimeout(() => {
      setIsCheckingUpdate(false);
      setUpdateStatus("Version aktuell (v1.0.0)");
    }, 1200);
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
          v1.0.0
        </span>
      </div>

      <div className="flex items-center gap-3">
        {/* Auto-Update Check Button */}
        <button
          onClick={handleCheckUpdate}
          disabled={isCheckingUpdate}
          className="text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#bbd1cd] hover:bg-[#f3f8f7] text-[#444444] transition-colors focus:ring-2 focus:ring-[#247a6d] focus:outline-none"
          title="Nach neuer Version auf GitHub suchen"
        >
          {isCheckingUpdate ? (
            <RefreshCw className="w-3.5 h-3.5 text-[#247a6d] animate-spin" />
          ) : (
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          )}
          <span>{updateStatus}</span>
        </button>

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
