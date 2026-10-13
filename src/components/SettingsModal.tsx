import React, { useState, useEffect, useRef } from "react";
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
  Sliders,
  MessageSquare,
  Layers,
  Award,
} from "lucide-react";
import { AppSettings, GlossaryEntry, QuizCustomLabels, QuizResultScreenConfig } from "../types";
import {
  fetchAvailableModels,
  defaultEditorialRules,
  defaultGlossary,
  defaultCustomLabels,
  defaultResultScreen,
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
  const [activeTab, setActiveTab] = useState<"api" | "editorial" | "labels">("api");

  // API State
  const [apiKey, setApiKey] = useState<string>(settings.geminiApiKey);
  const [selectedModel, setSelectedModel] = useState<string>(() =>
    isInvalidGeminiModel(settings.selectedModel) ? "gemini-3.8-flash" : settings.selectedModel
  );
  const [availableModels, setAvailableModels] = useState<string[]>(() => {
    const valid = (settings.availableModels || []).filter((m) => !isInvalidGeminiModel(m));
    return valid.length > 0 ? valid : ["gemini-3.8-flash"];
  });
  const [autoUpdate, setAutoUpdate] = useState<boolean>(settings.autoUpdate);
  const [showKey, setShowKey] = useState<boolean>(false);
  const [isFetchingModels, setIsFetchingModels] = useState<boolean>(false);
  const [fetchMsg, setFetchMsg] = useState<string | null>(null);

  // Auto-migrate and synchronize models when modal opens
  useEffect(() => {
    if (!isOpen) return;

    if (isInvalidGeminiModel(selectedModel)) {
      setSelectedModel("gemini-3.8-flash");
    }

    setAvailableModels((prev) => {
      const valid = prev.filter((m) => !isInvalidGeminiModel(m));
      return valid.length > 0 ? valid : ["gemini-3.8-flash"];
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
  const newTermInputRef = useRef<HTMLInputElement>(null);

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
    setTimeout(() => {
      newTermInputRef.current?.focus();
    }, 0);
  };

  // Global Default Labels & Result State
  const [defaultLabels, setDefaultLabels] = useState<QuizCustomLabels>(() =>
    JSON.parse(JSON.stringify(settings.defaultCustomLabels || defaultCustomLabels))
  );
  const [defaultResultConfig, setDefaultResultConfig] = useState<QuizResultScreenConfig>(() =>
    JSON.parse(JSON.stringify(settings.defaultResultScreen || defaultResultScreen))
  );

  const handleDeleteGlossaryEntry = (id: string) => {
    setGlossary((prev) => prev.filter((item) => item.id !== id));
  };

  const handleResetEditorial = () => {
    if (confirm("Möchten Sie die Redaktionsregeln und das Glossar auf die ZQP-Standardwerte zurücksetzen?")) {
      setEditorialRules(defaultEditorialRules);
      setGlossary(JSON.parse(JSON.stringify(defaultGlossary)));
    }
  };

  const handleResetLabels = () => {
    if (confirm("Möchten Sie die Standard-Textbausteine und Ergebnis-Formulierungen auf die ZQP-Standardwerte zurücksetzen?")) {
      setDefaultLabels(JSON.parse(JSON.stringify(defaultCustomLabels)));
      setDefaultResultConfig(JSON.parse(JSON.stringify(defaultResultScreen)));
    }
  };

  const handleSave = () => {
    let finalModel = selectedModel.trim();
    if (isInvalidGeminiModel(finalModel)) {
      finalModel = "gemini-3.8-flash";
    }
    const cleanAvailable = availableModels.filter((m) => !isInvalidGeminiModel(m));
    if (!cleanAvailable.includes(finalModel)) {
      cleanAvailable.unshift(finalModel);
    }

    onSave({
      geminiApiKey: apiKey.trim(),
      selectedModel: finalModel,
      availableModels: cleanAvailable.length > 0 ? cleanAvailable : ["gemini-3.8-flash"],
      autoUpdate,
      editorialRules,
      glossary,
      defaultCustomLabels: defaultLabels,
      defaultResultScreen: defaultResultConfig,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-[#bbd1cd] max-w-3xl w-full max-h-[90vh] p-5 shadow-2xl flex flex-col overflow-hidden">
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
          <button
            type="button"
            onClick={() => setActiveTab("labels")}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-t-lg flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === "labels"
                ? "bg-[#f3f8f7] text-[#1b5c53] border-t border-x border-[#bbd1cd] shadow-2xs"
                : "text-[#6e6c70] hover:text-[#1b5c53]"
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-[#247a6d]" />
            <span>Standard-Textbausteine</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden py-3 space-y-4">
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
                        {m === "gemini-3.8-flash" ? `${m} (Standard)` : m}
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
                <div className="border border-[#bbd1cd] rounded-xl overflow-hidden bg-white max-h-52 overflow-y-auto">
                  <table className="w-full text-left text-xs border-collapse table-fixed">
                    <thead className="bg-[#f3f8f7] text-[#1b5c53] font-semibold sticky top-0 border-b border-[#bbd1cd] z-10">
                      <tr>
                        <th className="p-2.5 w-[32%]">Vermeiden (Alter Begriff)</th>
                        <th className="p-2.5 w-[34%]">Bevorzugter ZQP-Begriff</th>
                        <th className="p-2.5 w-[26%]">Begründung / Notiz</th>
                        <th className="p-2.5 w-[8%] text-center"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#bbd1cd]/40">
                      {glossary.map((entry) => (
                        <tr key={entry.id} className="hover:bg-[#f9fbfb]">
                          <td className="p-2.5 text-rose-700 font-medium line-through break-words">
                            {entry.term}
                          </td>
                          <td className="p-2.5 text-[#1b5c53] font-bold break-words">
                            {entry.preferred}
                          </td>
                          <td className="p-2.5 text-[11px] text-[#6e6c70] break-words">
                            {entry.explanation || "-"}
                          </td>
                          <td className="p-2.5 text-center">
                            <button
                              type="button"
                              onClick={() => handleDeleteGlossaryEntry(entry.id)}
                              className="text-gray-400 hover:text-red-600 transition-colors cursor-pointer p-1 rounded hover:bg-red-50"
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
                <div className="mt-3 p-3 bg-[#f3f8f7] rounded-xl border border-[#bbd1cd] flex flex-col gap-2.5">
                  <span className="text-xs font-bold text-[#1b5c53] flex items-center gap-1.5">
                    <Plus className="w-3.5 h-3.5 text-[#247a6d]" />
                    <span>Neuen Begriff zum Fachglossar hinzufügen</span>
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-semibold text-[#1b5c53] mb-1">
                        Vermeiden (Alter Begriff) *
                      </label>
                      <input
                        ref={newTermInputRef}
                        type="text"
                        placeholder="z. B. Demenzkranke, Altenheim"
                        value={newTerm}
                        onChange={(e) => setNewTerm(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && newTerm.trim() && newPreferred.trim()) {
                            e.preventDefault();
                            handleAddGlossaryEntry();
                          }
                        }}
                        className="w-full rounded-lg border border-[#bbd1cd] p-2 text-xs bg-white focus:ring-1 focus:ring-[#247a6d] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-[#1b5c53] mb-1">
                        Bevorzugter ZQP-Begriff *
                      </label>
                      <input
                        type="text"
                        placeholder="z. B. Menschen mit Demenz, Pflegeeinrichtung"
                        value={newPreferred}
                        onChange={(e) => setNewPreferred(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && newTerm.trim() && newPreferred.trim()) {
                            e.preventDefault();
                            handleAddGlossaryEntry();
                          }
                        }}
                        className="w-full rounded-lg border border-[#bbd1cd] p-2 text-xs bg-white focus:ring-1 focus:ring-[#247a6d] outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2.5 items-end">
                    <div className="flex-1 w-full min-w-0">
                      <label className="block text-[11px] font-semibold text-[#1b5c53] mb-1">
                        Begründung / redaktionelle Notiz (optional)
                      </label>
                      <input
                        type="text"
                        placeholder="z. B. Personenzentrierte Sprache nach Tom Kitwood"
                        value={newExplanation}
                        onChange={(e) => setNewExplanation(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && newTerm.trim() && newPreferred.trim()) {
                            e.preventDefault();
                            handleAddGlossaryEntry();
                          }
                        }}
                        className="w-full rounded-lg border border-[#bbd1cd] p-2 text-xs bg-white focus:ring-1 focus:ring-[#247a6d] outline-none"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleAddGlossaryEntry}
                      disabled={!newTerm.trim() || !newPreferred.trim()}
                      className="w-full sm:w-auto px-4 py-2 rounded-lg bg-[#247a6d] text-white hover:bg-[#1b5c53] text-xs font-semibold disabled:opacity-40 transition-colors flex items-center justify-center gap-1.5 shrink-0 cursor-pointer shadow-2xs h-[34px]"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Hinzufügen</span>
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === "labels" && (
            <>
              {/* Info banner */}
              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-[#e6f2f0] border border-[#247a6d]/20 text-[#1b5c53] text-xs leading-relaxed">
                <Sliders className="w-4 h-4 shrink-0 mt-0.5 text-[#247a6d]" />
                <div className="flex-1">
                  <p className="font-semibold text-[#1b5c53] mb-0.5">
                    Globale Standard-Textbausteine & Ergebnis-Formulierungen
                  </p>
                  <p className="text-[#1b5c53]/80">
                    Diese Texte werden als Voreinstellung für jedes neu generierte Quiz verwendet. Im Quiz-Editor können die Texte für jedes einzelne Quiz individuell angepasst und überschrieben werden.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleResetLabels}
                  className="px-2.5 py-1 text-[11px] font-semibold text-[#8b3232] hover:bg-[#8b3232]/10 rounded border border-[#8b3232]/30 transition-colors shrink-0 cursor-pointer"
                >
                  Standard wiederherstellen
                </button>
              </div>

              {/* Rückmeldungen & Drawer */}
              <div className="p-4 rounded-xl bg-[#f2f7f6] border border-[#bbd1cd] space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#1b5c53] flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5" /> Rückmeldungen & Auswertung (Drawer)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#1b5c53] mb-1">
                      Schließen-Button (z. B. "Ansicht ansehen")
                    </label>
                    <input
                      type="text"
                      value={defaultLabels.feedbackCloseLabel}
                      onChange={(e) => setDefaultLabels({ ...defaultLabels, feedbackCloseLabel: e.target.value })}
                      className="w-full rounded-lg border border-[#bbd1cd] p-2 text-xs bg-white focus:ring-1 focus:ring-[#247a6d] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#1b5c53] mb-1">
                      Warum-Abschnitt ("Warum richtig / falsch")
                    </label>
                    <input
                      type="text"
                      value={defaultLabels.feedbackWhyLabel}
                      onChange={(e) => setDefaultLabels({ ...defaultLabels, feedbackWhyLabel: e.target.value })}
                      className="w-full rounded-lg border border-[#bbd1cd] p-2 text-xs bg-white focus:ring-1 focus:ring-[#247a6d] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#1b5c53] mb-1">
                      Wissens-Abschnitt ("ZQP-Praxiswissen")
                    </label>
                    <input
                      type="text"
                      value={defaultLabels.feedbackKnowledgeLabel}
                      onChange={(e) => setDefaultLabels({ ...defaultLabels, feedbackKnowledgeLabel: e.target.value })}
                      className="w-full rounded-lg border border-[#bbd1cd] p-2 text-xs bg-white focus:ring-1 focus:ring-[#247a6d] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#1b5c53] mb-1">
                      Button: Nächste Station
                    </label>
                    <input
                      type="text"
                      value={defaultLabels.nextStationLabel}
                      onChange={(e) => setDefaultLabels({ ...defaultLabels, nextStationLabel: e.target.value })}
                      className="w-full rounded-lg border border-[#bbd1cd] p-2 text-xs bg-white focus:ring-1 focus:ring-[#247a6d] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#1b5c53] mb-1">
                      Button: Zur Gesamtauswertung
                    </label>
                    <input
                      type="text"
                      value={defaultLabels.finishStationLabel}
                      onChange={(e) => setDefaultLabels({ ...defaultLabels, finishStationLabel: e.target.value })}
                      className="w-full rounded-lg border border-[#bbd1cd] p-2 text-xs bg-white focus:ring-1 focus:ring-[#247a6d] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#1b5c53] mb-1">
                      Button: Quiz wiederholen
                    </label>
                    <input
                      type="text"
                      value={defaultLabels.restartQuizLabel}
                      onChange={(e) => setDefaultLabels({ ...defaultLabels, restartQuizLabel: e.target.value })}
                      className="w-full rounded-lg border border-[#bbd1cd] p-2 text-xs bg-white focus:ring-1 focus:ring-[#247a6d] outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Sortierstationen (Bucket Sort) Standard-Begriffe */}
              <div className="p-4 rounded-xl bg-[#f2f7f6] border border-[#bbd1cd] space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#1b5c53] flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5" /> Sortierstationen (Do / Don't Standard-Begriffe)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#1b5c53] mb-1">
                      Kategorie 1 Header (Standard: "Empfehlenswert (Do)")
                    </label>
                    <input
                      type="text"
                      value={defaultLabels.bucketDoHeader}
                      onChange={(e) => setDefaultLabels({ ...defaultLabels, bucketDoHeader: e.target.value })}
                      className="w-full rounded-lg border border-[#bbd1cd] p-2 text-xs bg-white focus:ring-1 focus:ring-[#247a6d] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#1b5c53] mb-1">
                      Kategorie 1 Button ("Do")
                    </label>
                    <input
                      type="text"
                      value={defaultLabels.bucketDoLabel}
                      onChange={(e) => setDefaultLabels({ ...defaultLabels, bucketDoLabel: e.target.value })}
                      className="w-full rounded-lg border border-[#bbd1cd] p-2 text-xs bg-white focus:ring-1 focus:ring-[#247a6d] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#1b5c53] mb-1">
                      Kategorie 2 Header (Standard: "Nicht empfehlenswert (Don't)")
                    </label>
                    <input
                      type="text"
                      value={defaultLabels.bucketDontHeader}
                      onChange={(e) => setDefaultLabels({ ...defaultLabels, bucketDontHeader: e.target.value })}
                      className="w-full rounded-lg border border-[#bbd1cd] p-2 text-xs bg-white focus:ring-1 focus:ring-[#247a6d] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#1b5c53] mb-1">
                      Kategorie 2 Button ("Don't")
                    </label>
                    <input
                      type="text"
                      value={defaultLabels.bucketDontLabel}
                      onChange={(e) => setDefaultLabels({ ...defaultLabels, bucketDontLabel: e.target.value })}
                      className="w-full rounded-lg border border-[#bbd1cd] p-2 text-xs bg-white focus:ring-1 focus:ring-[#247a6d] outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Standard Ergebnis-Station */}
              <div className="p-4 rounded-xl bg-[#f2f7f6] border border-[#bbd1cd] space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#1b5c53] flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5" /> Standard-Ergebnis-Station
                </h4>
                <div className="space-y-3 text-xs">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-[#1b5c53] mb-1">Titel der Ergebnis-Station</label>
                      <input
                        type="text"
                        value={defaultResultConfig.title}
                        onChange={(e) => setDefaultResultConfig({ ...defaultResultConfig, title: e.target.value })}
                        className="w-full rounded-lg border border-[#bbd1cd] p-2 text-xs bg-white focus:ring-1 focus:ring-[#247a6d] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-[#1b5c53] mb-1">Untertitel</label>
                      <input
                        type="text"
                        value={defaultResultConfig.subtitle}
                        onChange={(e) => setDefaultResultConfig({ ...defaultResultConfig, subtitle: e.target.value })}
                        className="w-full rounded-lg border border-[#bbd1cd] p-2 text-xs bg-white focus:ring-1 focus:ring-[#247a6d] outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#1b5c53] mb-1">
                      Text bei 0% / noch keinen richtigen Antworten (neutral ohne Zwang zu "ZQP-Leitlinien")
                    </label>
                    <textarea
                      rows={2}
                      value={defaultResultConfig.zeroScoreText}
                      onChange={(e) => setDefaultResultConfig({ ...defaultResultConfig, zeroScoreText: e.target.value })}
                      className="w-full rounded-lg border border-[#bbd1cd] p-2 text-xs bg-white focus:ring-1 focus:ring-[#247a6d] outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-semibold text-[#1b5c53] mb-1">Feedback 100%</label>
                      <textarea
                        rows={2}
                        value={defaultResultConfig.perfectScoreText}
                        onChange={(e) => setDefaultResultConfig({ ...defaultResultConfig, perfectScoreText: e.target.value })}
                        className="w-full rounded-lg border border-[#bbd1cd] p-2 text-xs bg-white focus:ring-1 focus:ring-[#247a6d] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-[#1b5c53] mb-1">Feedback ab 70%</label>
                      <textarea
                        rows={2}
                        value={defaultResultConfig.goodScoreText}
                        onChange={(e) => setDefaultResultConfig({ ...defaultResultConfig, goodScoreText: e.target.value })}
                        className="w-full rounded-lg border border-[#bbd1cd] p-2 text-xs bg-white focus:ring-1 focus:ring-[#247a6d] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-[#1b5c53] mb-1">Feedback unter 70%</label>
                      <textarea
                        rows={2}
                        value={defaultResultConfig.lowScoreText}
                        onChange={(e) => setDefaultResultConfig({ ...defaultResultConfig, lowScoreText: e.target.value })}
                        className="w-full rounded-lg border border-[#bbd1cd] p-2 text-xs bg-white focus:ring-1 focus:ring-[#247a6d] outline-none"
                      />
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
