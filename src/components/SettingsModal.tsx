import React, { useState } from "react";
import { X, Key, Cpu, RefreshCw, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { AppSettings } from "../types";
import { fetchAvailableModels } from "../services/geminiService";

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

          <select
            id="model-select"
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="w-full rounded-lg border border-[#bbd1cd] p-2.5 text-xs bg-white focus:ring-2 focus:ring-[#247a6d] outline-none"
          >
            {availableModels.map((m) => (
              <option key={m} value={m}>
                {m} {m === "gemini-2.5-flash" ? "(Empfohlen: Schnell & präzise)" : ""}
              </option>
            ))}
          </select>

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

        {/* Auto Update Checkbox */}
        <div className="bg-[#f3f8f7] border border-[#bbd1cd] p-3 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-[#1b5c53] block">
              Automatische Updates
            </span>
            <span className="text-[11px] text-[#6e6c70]">
              Über GitHub Releases (ZQP/quiz-generator)
            </span>
          </div>
          <input
            type="checkbox"
            checked={autoUpdate}
            onChange={(e) => setAutoUpdate(e.target.checked)}
            className="w-4 h-4 text-[#247a6d] rounded focus:ring-[#247a6d]"
          />
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
