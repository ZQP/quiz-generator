import React, { useState } from "react";
import { X, Key, Cpu, RefreshCw, Eye, EyeOff, ShieldCheck, DownloadCloud, CheckCircle2 } from "lucide-react";
import { AppSettings } from "../types";
import { fetchAvailableModels } from "../services/geminiService";
import { checkForAppUpdates, installAppUpdate } from "../services/updaterService";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSave: (newSettings: AppSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSave,
}) => {
  const [apiKey, setApiKey] = useState<string>(settings.geminiApiKey);
  const [selectedModel, setSelectedModel] = useState<string>(settings.selectedModel);
  const [availableModels, setAvailableModels] = useState<string[]>(settings.availableModels);
  const [autoUpdate, setAutoUpdate] = useState<boolean>(settings.autoUpdate);
  const [showKey, setShowKey] = useState<boolean>(false);
  const [isFetchingModels, setIsFetchingModels] = useState<boolean>(false);
  const [fetchMsg, setFetchMsg] = useState<string | null>(null);

  // Updater State
  const [isCheckingUpdate, setIsCheckingUpdate] = useState<boolean>(false);
  const [updateMsg, setUpdateMsg] = useState<string | null>(null);
  const [availableVersion, setAvailableVersion] = useState<string | null>(null);
  const [isInstallingUpdate, setIsInstallingUpdate] = useState<boolean>(false);
  const [installProgress, setInstallProgress] = useState<string>("");

  if (!isOpen) return null;

  const handleRefreshModels = async () => {
    if (!apiKey.trim()) {
      setFetchMsg("Bitte geben Sie zuerst Ihren API-Schlüssel ein.");
      return;
    }

    setIsFetchingModels(true);
    setFetchMsg(null);
    try {
      const models = await fetchAvailableModels(apiKey);
      setAvailableModels(models);
      setFetchMsg(`✓ ${models.length} Modelle von Gemini synchronisiert.`);
      if (!models.includes(selectedModel) && models.length > 0) {
        setSelectedModel(models[0]);
      }
    } catch (err: any) {
      setFetchMsg(`Fehler: ${err?.message || "Konnte Modelle nicht abrufen"}`);
    } finally {
      setIsFetchingModels(false);
    }
  };

  const handleCheckUpdate = async () => {
    setIsCheckingUpdate(true);
    setUpdateMsg("Prüfe GitHub Releases auf Updates...");
    setAvailableVersion(null);

    try {
      const res = await checkForAppUpdates(false);
      if (res.updateFound && res.version) {
        setAvailableVersion(res.version);
        setUpdateMsg(`Neue Version verfügbar: v${res.version}`);
      } else if (!res.isDesktop) {
        setUpdateMsg("Auto-Update ist in der Desktop-Installation (.exe) aktiv.");
      } else if (res.error) {
        setUpdateMsg(`Fehler bei Prüfung: ${res.error}`);
      } else {
        setUpdateMsg("✓ Sie verwenden bereits die neueste Version (v1.0.0).");
      }
    } catch (err: any) {
      setUpdateMsg(`Fehler: ${err?.message || "Update-Prüfung fehlgeschlagen"}`);
    } finally {
      setIsCheckingUpdate(false);
    }
  };

  const handleInstallUpdate = async () => {
    setIsInstallingUpdate(true);
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
      setIsInstallingUpdate(false);
      setUpdateMsg(`Installationsfehler: ${result.error}`);
    }
  };

  const handleSave = () => {
    onSave({
      geminiApiKey: apiKey.trim(),
      selectedModel,
      availableModels,
      autoUpdate,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-[#bbd1cd] max-w-lg w-full p-6 shadow-xl flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#bbd1cd]">
          <h3 className="text-base font-bold text-[#1b5c53] flex items-center gap-2">
            <Key className="w-5 h-5 text-[#247a6d]" />
            <span>Einstellungen & API-Konfiguration</span>
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* API Key Input */}
        <div>
          <label
            htmlFor="gemini-key"
            className="block text-xs font-semibold text-[#1b5c53] mb-1"
          >
            Google Gemini API Key
          </label>
          <div className="relative">
            <input
              id="gemini-key"
              type={showKey ? "text" : "password"}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full rounded-lg border border-[#bbd1cd] p-2.5 pr-20 text-xs font-mono focus:ring-2 focus:ring-[#247a6d] outline-none"
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-2 top-2 text-[11px] text-[#247a6d] font-semibold px-2 py-0.5 rounded hover:bg-[#f3f8f7] flex items-center gap-1"
            >
              {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span>{showKey ? "Verbergen" : "Zeigen"}</span>
            </button>
          </div>
          <p className="text-[11px] text-[#6e6c70] mt-1 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Wird ausschließlich lokal auf Ihrem Rechner gespeichert.
          </p>
        </div>

        {/* Model Selection */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label
              htmlFor="model-select"
              className="text-xs font-semibold text-[#1b5c53] flex items-center gap-1.5"
            >
              <Cpu className="w-3.5 h-3.5 text-[#247a6d]" />
              <span>Gemini KI-Modell</span>
            </label>
            <button
              type="button"
              onClick={handleRefreshModels}
              disabled={isFetchingModels}
              className="text-[11px] text-[#247a6d] hover:underline flex items-center gap-1 disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${isFetchingModels ? "animate-spin" : ""}`} />
              <span>Modelle von API aktualisieren</span>
            </button>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              id="model-select"
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              placeholder="z. B. gemini-3.0-flash, gemini-3.0-pro..."
              className="flex-1 rounded-lg border border-[#bbd1cd] p-2.5 text-xs font-mono bg-white focus:ring-2 focus:ring-[#247a6d] outline-none"
            />
            {availableModels.length > 0 && (
              <select
                value=""
                onChange={(e) => {
                  if (e.target.value) setSelectedModel(e.target.value);
                }}
                className="w-36 rounded-lg border border-[#bbd1cd] p-2 text-xs bg-[#f3f8f7] text-[#1b5c53] font-semibold focus:ring-2 focus:ring-[#247a6d] outline-none cursor-pointer"
              >
                <option value="">Modell wählen...</option>
                {availableModels.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            )}
          </div>
          <p className="text-[11px] text-[#6e6c70] mt-1">
            Geben Sie das gewünschte Gemini-Modell frei ein oder synchronisieren Sie die neuesten Modelle direkt von der Google API.
          </p>

          {fetchMsg && (
            <p
              className={`text-[11px] mt-1 ${
                fetchMsg.startsWith("✓") ? "text-emerald-700 font-medium" : "text-amber-700"
              }`}
            >
              {fetchMsg}
            </p>
          )}
        </div>

        {/* Auto Update Section */}
        <div className="bg-[#f3f8f7] border border-[#bbd1cd] p-3.5 rounded-xl flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-[#1b5c53] block">
                Automatische Updates
              </span>
              <span className="text-[11px] text-[#6e6c70]">
                GitHub Releases (ZQP/quiz-generator) • Version 1.0.0
              </span>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <span className="text-xs text-[#6e6c70]">Aktiviert</span>
              <input
                type="checkbox"
                checked={autoUpdate}
                onChange={(e) => setAutoUpdate(e.target.checked)}
                className="w-4 h-4 text-[#247a6d] rounded focus:ring-[#247a6d]"
              />
            </label>
          </div>

          <div className="pt-2 border-t border-[#bbd1cd]/50 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={handleCheckUpdate}
              disabled={isCheckingUpdate || isInstallingUpdate}
              className="px-3 py-1.5 rounded-lg border border-[#bbd1cd] bg-white text-xs font-semibold text-[#1b5c53] hover:bg-gray-50 flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#247a6d] ${isCheckingUpdate ? "animate-spin" : ""}`} />
              <span>{isCheckingUpdate ? "Prüfe..." : "Jetzt nach Updates suchen"}</span>
            </button>

            {availableVersion && (
              <button
                type="button"
                onClick={handleInstallUpdate}
                disabled={isInstallingUpdate}
                className="px-3 py-1.5 rounded-lg bg-[#247a6d] hover:bg-[#1b5c53] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm animate-pulse"
              >
                <DownloadCloud className="w-3.5 h-3.5" />
                <span>
                  {isInstallingUpdate
                    ? `Installiere... (${installProgress})`
                    : `Update installieren (v${availableVersion})`}
                </span>
              </button>
            )}
          </div>

          {updateMsg && (
            <p
              className={`text-[11px] ${
                updateMsg.startsWith("✓")
                  ? "text-emerald-700 font-medium flex items-center gap-1"
                  : updateMsg.includes("Fehler")
                  ? "text-red-700"
                  : "text-[#1b5c53] font-medium"
              }`}
            >
              {updateMsg.startsWith("✓") && <CheckCircle2 className="w-3 h-3 text-emerald-600 inline" />}
              {updateMsg}
            </p>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#bbd1cd]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-[#bbd1cd] text-xs font-medium hover:bg-gray-50"
          >
            Abbrechen
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 rounded-lg bg-[#247a6d] hover:bg-[#1b5c53] text-white text-xs font-semibold shadow-sm"
          >
            Einstellungen speichern
          </button>
        </div>
      </div>
    </div>
  );
};
