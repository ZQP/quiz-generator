import React, { useState, useEffect } from "react";
import {
  X,
  Key,
  Cpu,
  RefreshCw,
  Eye,
  EyeOff,
  ShieldCheck,
  DownloadCloud,
  CheckCircle2,
  BookOpen,
  Plus,
  Trash2,
  RotateCcw,
} from "lucide-react";
import { AppSettings, GlossaryEntry } from "../types";
import {
  fetchAvailableModels,
  defaultEditorialRules,
  defaultGlossary,
  isInvalidGeminiModel,
} from "../services/geminiService";
import { checkForAppUpdates, installAppUpdate } from "../services/updaterService";
import { APP_VERSION } from "../version";

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
  const [activeTab, setActiveTab] = useState<"api" | "editorial">("api");

  // API State
  const [apiKey, setApiKey] = useState<string>(settings.geminiApiKey);
  const [selectedModel, setSelectedModel] = useState<string>(() =>
    isInvalidGeminiModel(settings.selectedModel) ? "gemini-1.5-flash" : settings.selectedModel
  );
  const [availableModels, setAvailableModels] = useState<string[]>(() => {
    const valid = (settings.availableModels || []).filter((m) => !isInvalidGeminiModel(m));
    return valid.length > 0 ? valid : ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-2.0-flash"];
  });
  const [autoUpdate, setAutoUpdate] = useState<boolean>(settings.autoUpdate);
  const [showKey, setShowKey] = useState<boolean>(false);
  const [isFetchingModels, setIsFetchingModels] = useState<boolean>(false);
  const [fetchMsg, setFetchMsg] = useState<string | null>(null);

  // Auto-migrate and synchronize models when modal opens
  useEffect(() => {
    if (!isOpen) return;

    if (isInvalidGeminiModel(selectedModel)) {
      setSelectedModel("gemini-1.5-flash");
    }

    setAvailableModels((prev) => {
      const valid = prev.filter((m) => !isInvalidGeminiModel(m));
      return valid.length > 0 ? valid : ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-2.0-flash"];
    });

    if (apiKey.trim()) {
      fetchAvailableModels(apiKey.trim())
        .then((models) => {
          setAvailableModels(models);
          if (models.length > 0 && (isInvalidGeminiModel(selectedModel) || !models.includes(selectedModel))) {
            setSelectedModel(models[0]);
          }
        })
        .catch(() => {
          // Silent fallback on modal open
        });
    }
  }, [isOpen]);

  // Editorial Guidelines & Glossary State
  const [editorialRules, setEditorialRules] = useState<string>(
    settings.editorialRules || defaultEditorialRules
  );
  const [glossary, setGlossary] = useState<GlossaryEntry[]>(() =>
    settings.glossary && settings.glossary.length > 0
      ? JSON.parse(JSON.stringify(settings.glossary))
      : JSON.parse(JSON.stringify(defaultGlossary))
  );

  // New Glossary entry inputs
  const [newTerm, setNewTerm] = useState<string>("");
  const [newPreferred, setNewPreferred] = useState<string>("");
  const [newExplanation, setNewExplanation] = useState<string>("");

  // Updater State
  const [isCheckingUpdate, setIsCheckingUpdate] = useState<boolean>(false);
  const [updateMsg, setUpdateMsg] = useState<string | null>(null);
  const [availableVersion, setAvailableVersion] = useState<string | null>(null);
  const [isInstallingUpdate, setIsInstallingUpdate] = useState<boolean>(false);
  const [installProgress, setInstallProgress] = useState<string>("");

  if (!isOpen) return null;

  const handleRefreshModels = async () => {
    const keyToUse = apiKey.trim();
    if (!keyToUse) {
      setFetchMsg("Bitte geben Sie zuerst Ihren API-Schlüssel ein.");
      return;
    }

    setIsFetchingModels(true);
    setFetchMsg(null);
    try {
      const models = await fetchAvailableModels(keyToUse);
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
        setUpdateMsg(`✓ Sie verwenden die neueste Version (v${APP_VERSION}).`);
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

  const handleAddGlossaryEntry = () => {
    if (!newTerm.trim() || !newPreferred.trim()) return;
    const entry: GlossaryEntry = {
      id: "g_" + Date.now(),
      term: newTerm.trim(),
      preferred: newPreferred.trim(),
      explanation: newExplanation.trim() || undefined,
    };
    setGlossary((prev) => [...prev, entry]);
    setNewTerm("");
    setNewPreferred("");
    setNewExplanation("");
  };

  const handleDeleteGlossaryEntry = (id: string) => {
    setGlossary((prev) => prev.filter((item) => item.id !== id));
  };

  const handleResetEditorial = () => {
    if (confirm("Möchten Sie die Redaktionsregeln und das Glossar auf die ZQP-Standardwerte zurücksetzen?")) {
      setEditorialRules(defaultEditorialRules);
      setGlossary(JSON.parse(JSON.stringify(defaultGlossary)));
    }
  };

  const handleSave = () => {
    let finalModel = selectedModel.trim();
    if (isInvalidGeminiModel(finalModel)) {
      finalModel = "gemini-1.5-flash";
    }
    const cleanAvailable = availableModels.filter((m) => !isInvalidGeminiModel(m));
    if (!cleanAvailable.includes(finalModel)) {
      cleanAvailable.unshift(finalModel);
    }

    onSave({
      geminiApiKey: apiKey.trim(),
      selectedModel: finalModel,
      availableModels: cleanAvailable.length > 0 ? cleanAvailable : ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-2.0-flash"],
      autoUpdate,
      editorialRules,
      glossary,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-[#bbd1cd] max-w-2xl w-full max-h-[90vh] p-5 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#bbd1cd]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#247a6d] text-white flex items-center justify-center font-bold text-xs shadow-2xs">
              ZQP
            </div>
            <div>
              <h3 className="text-base font-bold text-[#1b5c53]">
                Einstellungen & Redaktions-Leitfaden
              </h3>
              <p className="text-[11px] text-[#6e6c70]">
                API-Schlüssel, Modelle und zentrale Tonalitäts-Vorgaben für die KI
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 border-b border-[#bbd1cd] pt-2 pb-0">
          <button
            type="button"
            onClick={() => setActiveTab("api")}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-t-lg flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === "api"
                ? "bg-[#f3f8f7] text-[#1b5c53] border-t border-x border-[#bbd1cd] shadow-2xs"
                : "text-[#6e6c70] hover:text-[#1b5c53]"
            }`}
          >
            <Key className="w-3.5 h-3.5 text-[#247a6d]" />
            <span>API & Modelle</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("editorial")}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-t-lg flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === "editorial"
                ? "bg-[#f3f8f7] text-[#1b5c53] border-t border-x border-[#bbd1cd] shadow-2xs"
                : "text-[#6e6c70] hover:text-[#1b5c53]"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-[#247a6d]" />
            <span>Redaktions-Leitfaden & Glossar</span>
            <span className="px-1.5 py-0.2 rounded-full bg-[#247a6d] text-white text-[10px] font-bold">
              {glossary.length}
            </span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto py-3 space-y-4">
          {activeTab === "api" ? (
            <>
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
                    className="text-[11px] text-[#247a6d] hover:underline flex items-center gap-1 disabled:opacity-50 cursor-pointer"
                  >
                    <RefreshCw className={`w-3 h-3 ${isFetchingModels ? "animate-spin" : ""}`} />
                    <span>Modelle von API aktualisieren</span>
                  </button>
                </div>

                <div className="flex gap-2">
                  <select
                    id="model-select"
                    value={availableModels.includes(selectedModel) ? selectedModel : "custom"}
                    onChange={(e) => {
                      if (e.target.value !== "custom") {
                        setSelectedModel(e.target.value);
                      }
                    }}
                    className="flex-1 rounded-lg border border-[#bbd1cd] p-2.5 text-xs bg-white text-[#1b5c53] font-semibold focus:ring-2 focus:ring-[#247a6d] outline-none cursor-pointer shadow-2xs"
                  >
                    {availableModels.map((m) => (
                      <option key={m} value={m}>
                        {m === "gemini-1.5-flash"
                          ? "gemini-1.5-flash (Empfohlen: Schnell, präzise & stabil)"
                          : m === "gemini-1.5-pro"
                          ? "gemini-1.5-pro (Höhere Denkleistung / Komplexe Kontexte)"
                          : m === "gemini-2.0-flash"
                          ? "gemini-2.0-flash (Neueste Modell-Generation)"
                          : m}
                      </option>
                    ))}
                    {!availableModels.includes(selectedModel) && (
                      <option value="custom">Benutzerdefiniert: {selectedModel}</option>
                    )}
                  </select>
                </div>

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
              <div className="bg-[#f3f8f7] border border-[#bbd1cd] p-3 rounded-xl flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-[#1b5c53] block">
                      Automatische Updates
                    </span>
                    <span className="text-[11px] text-[#6e6c70]">
                      GitHub Releases (ZQP/quiz-generator) • v{APP_VERSION}
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
                    className="px-3 py-1.5 rounded-lg border border-[#bbd1cd] bg-white text-xs font-semibold text-[#1b5c53] hover:bg-gray-50 flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 text-[#247a6d] ${isCheckingUpdate ? "animate-spin" : ""}`} />
                    <span>{isCheckingUpdate ? "Prüfe..." : "Jetzt nach Updates suchen"}</span>
                  </button>

                  {availableVersion && (
                    <button
                      type="button"
                      onClick={handleInstallUpdate}
                      disabled={isInstallingUpdate}
                      className="px-3 py-1.5 rounded-lg bg-[#247a6d] hover:bg-[#1b5c53] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs animate-pulse cursor-pointer"
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
            </>
          ) : (
            <>
              {/* Editorial Guidelines & Glossary Section */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#1b5c53]">
                  Feste Redaktionsregeln für Gemini
                </span>
                <button
                  type="button"
                  onClick={handleResetEditorial}
                  className="text-[11px] text-[#247a6d] hover:underline flex items-center gap-1 cursor-pointer font-medium"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Auf ZQP-Standard zurücksetzen</span>
                </button>
              </div>

              <div>
                <textarea
                  rows={4}
                  value={editorialRules}
                  onChange={(e) => setEditorialRules(e.target.value)}
                  placeholder="Geben Sie hier Ihre festen Redaktions- und Tonalitätsrichtlinien ein..."
                  className="w-full rounded-lg border border-[#bbd1cd] p-2.5 text-xs text-[#444444] leading-relaxed focus:ring-2 focus:ring-[#247a6d] outline-none resize-none font-sans"
                />
                <p className="text-[10px] text-[#6e6c70] mt-0.5">
                  Diese Regeln werden automatisch jedem KI-Generierungs- und Verfeinerungs-Prompt vorangestellt.
                </p>
              </div>

              {/* Protected Glossary */}
              <div className="pt-2 border-t border-[#bbd1cd]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-[#1b5c53]">
                    Geschützte ZQP-Nomenklatur & Begriffsersetzungen
                  </span>
                  <span className="text-[11px] text-[#6e6c70]">
                    {glossary.length} Begriffe definiert
                  </span>
                </div>

                {/* Glossary Table */}
                <div className="border border-[#bbd1cd] rounded-xl overflow-hidden bg-white max-h-48 overflow-y-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-[#f3f8f7] text-[#1b5c53] font-semibold sticky top-0 border-b border-[#bbd1cd]">
                      <tr>
                        <th className="p-2">Vermeiden (Alter Begriff)</th>
                        <th className="p-2">Bevorzugter ZQP-Begriff</th>
                        <th className="p-2 hidden sm:table-cell">Begründung / Notiz</th>
                        <th className="p-2 w-8 text-center"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#bbd1cd]/40">
                      {glossary.map((entry) => (
                        <tr key={entry.id} className="hover:bg-[#f9fbfb]">
                          <td className="p-2 text-rose-700 font-medium line-through">
                            {entry.term}
                          </td>
                          <td className="p-2 text-[#1b5c53] font-bold">
                            {entry.preferred}
                          </td>
                          <td className="p-2 text-[11px] text-[#6e6c70] hidden sm:table-cell">
                            {entry.explanation || "-"}
                          </td>
                          <td className="p-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleDeleteGlossaryEntry(entry.id)}
                              className="text-gray-400 hover:text-red-600 transition-colors cursor-pointer"
                              title="Begriff entfernen"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Add new glossary entry */}
                <div className="mt-2.5 p-2.5 bg-[#f3f8f7] rounded-xl border border-[#bbd1cd] flex flex-col gap-2">
                  <span className="text-[11px] font-bold text-[#1b5c53]">
                    Neuen Begriff hinzufügen:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      type="text"
                      placeholder="Vermeiden (z.B. Heim)"
                      value={newTerm}
                      onChange={(e) => setNewTerm(e.target.value)}
                      className="rounded-lg border border-[#bbd1cd] p-1.5 text-xs bg-white focus:ring-1 focus:ring-[#247a6d] outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Bevorzugt (z.B. Pflegeheim)"
                      value={newPreferred}
                      onChange={(e) => setNewPreferred(e.target.value)}
                      className="rounded-lg border border-[#bbd1cd] p-1.5 text-xs bg-white focus:ring-1 focus:ring-[#247a6d] outline-none"
                    />
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        placeholder="Notiz (optional)"
                        value={newExplanation}
                        onChange={(e) => setNewExplanation(e.target.value)}
                        className="flex-1 rounded-lg border border-[#bbd1cd] p-1.5 text-xs bg-white focus:ring-1 focus:ring-[#247a6d] outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleAddGlossaryEntry}
                        disabled={!newTerm.trim() || !newPreferred.trim()}
                        className="px-2.5 py-1.5 rounded-lg bg-[#247a6d] text-white hover:bg-[#1b5c53] text-xs font-semibold disabled:opacity-40 transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Hinzufügen</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#bbd1cd]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-[#bbd1cd] text-xs font-medium hover:bg-gray-50 cursor-pointer"
          >
            Abbrechen
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 rounded-lg bg-[#247a6d] hover:bg-[#1b5c53] text-white text-xs font-semibold shadow-2xs cursor-pointer"
          >
            Einstellungen speichern
          </button>
        </div>
      </div>
    </div>
  );
};
