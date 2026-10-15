import React, { useState } from "react";
import { X, Palette, Sparkles, Check } from "lucide-react";
import { QuizTheme, QuizThemeColors } from "../types";
import { saveCustomTheme, BUILTIN_THEMES } from "../services/themeService";

interface ThemeEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  baseTheme?: QuizTheme;
  themeToEdit?: QuizTheme;
  onThemeSaved: (savedTheme: QuizTheme) => void;
}

export const ThemeEditorModal: React.FC<ThemeEditorModalProps> = ({
  isOpen,
  onClose,
  baseTheme,
  themeToEdit,
  onThemeSaved,
}) => {
  if (!isOpen) return null;

  const initialTheme = themeToEdit || baseTheme || BUILTIN_THEMES[0];
  const isEditingExisting = Boolean(themeToEdit && !themeToEdit.isBuiltin);

  const [name, setName] = useState<string>(() => {
    if (themeToEdit) return themeToEdit.name;
    if (baseTheme) return `${baseTheme.name} (Kopie)`;
    return "Mein ZQP Theme";
  });

  const [description, setDescription] = useState<string>(() => {
    if (themeToEdit) return themeToEdit.description;
    if (baseTheme) return `Basiert auf ${baseTheme.name}.`;
    return "Eigenes Farbdesign für ZQP-Lernquizes.";
  });

  const [colors, setColors] = useState<QuizThemeColors>(() => ({
    ...initialTheme.colors,
  }));

  const handleColorChange = (key: keyof QuizThemeColors, value: string) => {
    setColors((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleResetToPreset = (preset: QuizTheme) => {
    setColors({ ...preset.colors });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert("Bitte geben Sie einen Namen für das Theme ein.");
      return;
    }

    const themeId = isEditingExisting && themeToEdit
      ? themeToEdit.id
      : "custom-theme-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6);

    const themeToSave: QuizTheme = {
      id: themeId,
      name: name.trim(),
      description: description.trim(),
      badge: "Eigenes Design",
      isBuiltin: false,
      colors,
    };

    saveCustomTheme(themeToSave);
    onThemeSaved(themeToSave);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-[#bbd1cd] w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#bbd1cd] bg-[#f3f8f7] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#247a6d] text-white flex items-center justify-center shadow-xs">
              <Palette className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-[#1b5c53]">
                {isEditingExisting ? "Eigenes Theme bearbeiten" : "Neues Theme erstellen & anpassen"}
              </h2>
              <p className="text-[11px] text-[#6e6c70]">
                Passen Sie die ZQP-Farbpalette an und prüfen Sie die Wirkung live in der Mini-Vorschau.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#6e6c70] hover:text-[#1b5c53] hover:bg-[#e3eeec] transition-colors cursor-pointer"
            title="Schließen"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Two Columns (Left Form, Right Live Preview) */}
        <form onSubmit={handleSave} className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden">
          {/* Left Column: Form & Color Controls */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 border-b lg:border-b-0 lg:border-r border-[#bbd1cd]">
            {/* Metadata (Name & Description) */}
            <div className="space-y-2.5">
              <div>
                <label className="block text-xs font-semibold text-[#1b5c53] mb-1">
                  Theme-Name <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="z. B. 'ZQP Pflege-Praxis'"
                  className="w-full rounded-lg border border-[#bbd1cd] px-3 py-1.5 text-xs focus:ring-2 focus:ring-[#247a6d] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1b5c53] mb-1">
                  Beschreibung
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Kurze Notiz zum Einsatzbereich..."
                  className="w-full rounded-lg border border-[#bbd1cd] px-3 py-1.5 text-xs focus:ring-2 focus:ring-[#247a6d] outline-none"
                />
              </div>
            </div>

            {/* Basis-Vorlage Schnellwechsel */}
            <div className="pt-2 border-t border-[#e3eeec]">
              <span className="text-[11px] font-bold text-[#6e6c70] block mb-1.5">
                Farben aus ZQP-Standardvorlage übernehmen:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {BUILTIN_THEMES.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleResetToPreset(preset)}
                    className="px-2 py-1 rounded border border-[#bbd1cd] bg-[#f8faf9] hover:bg-[#e3eeec] text-[10px] font-semibold text-[#1b5c53] flex items-center gap-1.5 transition-colors cursor-pointer"
                    title={`Farben von ${preset.name} laden`}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full border border-white"
                      style={{ backgroundColor: preset.colors.primary }}
                    />
                    <span>{preset.name.split(" ")[1] || preset.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Color Pickers Grid */}
            <div className="pt-2 border-t border-[#e3eeec]">
              <h3 className="text-xs font-bold text-[#1b5c53] mb-2.5 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#247a6d]" />
                <span>Farbdefinitionen</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* 1. Primärfarbe */}
                <div className="p-2.5 rounded-lg border border-[#bbd1cd] bg-[#fcfaf8] flex flex-col gap-1">
                  <span className="font-semibold text-[#1b5c53]">Primärfarbe (Buttons & Akzente)</span>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="color"
                      value={colors.primary}
                      onChange={(e) => handleColorChange("primary", e.target.value)}
                      className="w-8 h-8 rounded border border-gray-300 cursor-pointer p-0.5 bg-white shrink-0"
                    />
                    <input
                      type="text"
                      value={colors.primary}
                      onChange={(e) => handleColorChange("primary", e.target.value)}
                      className="flex-1 font-mono text-[11px] px-2 py-1 border border-[#bbd1cd] rounded bg-white"
                    />
                  </div>
                </div>

                {/* 2. Header-Verlauf Dunkel */}
                <div className="p-2.5 rounded-lg border border-[#bbd1cd] bg-[#fcfaf8] flex flex-col gap-1">
                  <span className="font-semibold text-[#1b5c53]">Header-Verlauf (Endfarbe)</span>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="color"
                      value={colors.primaryDark}
                      onChange={(e) => handleColorChange("primaryDark", e.target.value)}
                      className="w-8 h-8 rounded border border-gray-300 cursor-pointer p-0.5 bg-white shrink-0"
                    />
                    <input
                      type="text"
                      value={colors.primaryDark}
                      onChange={(e) => handleColorChange("primaryDark", e.target.value)}
                      className="flex-1 font-mono text-[11px] px-2 py-1 border border-[#bbd1cd] rounded bg-white"
                    />
                  </div>
                </div>

                {/* 3. Akzentfarbe / Fortschritt */}
                <div className="p-2.5 rounded-lg border border-[#bbd1cd] bg-[#fcfaf8] flex flex-col gap-1">
                  <span className="font-semibold text-[#1b5c53]">Fortschrittsbalken (Akzent)</span>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="color"
                      value={colors.accent}
                      onChange={(e) => handleColorChange("accent", e.target.value)}
                      className="w-8 h-8 rounded border border-gray-300 cursor-pointer p-0.5 bg-white shrink-0"
                    />
                    <input
                      type="text"
                      value={colors.accent}
                      onChange={(e) => handleColorChange("accent", e.target.value)}
                      className="flex-1 font-mono text-[11px] px-2 py-1 border border-[#bbd1cd] rounded bg-white"
                    />
                  </div>
                </div>

                {/* 4. Tiefes Petrol / Progress Track */}
                <div className="p-2.5 rounded-lg border border-[#bbd1cd] bg-[#fcfaf8] flex flex-col gap-1">
                  <span className="font-semibold text-[#1b5c53]">Fortschritts-Hintergrund</span>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="color"
                      value={colors.primaryDeep}
                      onChange={(e) => handleColorChange("primaryDeep", e.target.value)}
                      className="w-8 h-8 rounded border border-gray-300 cursor-pointer p-0.5 bg-white shrink-0"
                    />
                    <input
                      type="text"
                      value={colors.primaryDeep}
                      onChange={(e) => handleColorChange("primaryDeep", e.target.value)}
                      className="flex-1 font-mono text-[11px] px-2 py-1 border border-[#bbd1cd] rounded bg-white"
                    />
                  </div>
                </div>

                {/* 5. Container Hintergrund */}
                <div className="p-2.5 rounded-lg border border-[#bbd1cd] bg-[#fcfaf8] flex flex-col gap-1">
                  <span className="font-semibold text-[#1b5c53]">Quiz-Container Hintergrund</span>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="color"
                      value={colors.bgRoot}
                      onChange={(e) => handleColorChange("bgRoot", e.target.value)}
                      className="w-8 h-8 rounded border border-gray-300 cursor-pointer p-0.5 bg-white shrink-0"
                    />
                    <input
                      type="text"
                      value={colors.bgRoot}
                      onChange={(e) => handleColorChange("bgRoot", e.target.value)}
                      className="flex-1 font-mono text-[11px] px-2 py-1 border border-[#bbd1cd] rounded bg-white"
                    />
                  </div>
                </div>

                {/* 6. Bühnen Hintergrund */}
                <div className="p-2.5 rounded-lg border border-[#bbd1cd] bg-[#fcfaf8] flex flex-col gap-1">
                  <span className="font-semibold text-[#1b5c53]">Bühnen-Fläche (Stage)</span>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="color"
                      value={colors.bgStage || colors.bgRoot}
                      onChange={(e) => handleColorChange("bgStage", e.target.value)}
                      className="w-8 h-8 rounded border border-gray-300 cursor-pointer p-0.5 bg-white shrink-0"
                    />
                    <input
                      type="text"
                      value={colors.bgStage || colors.bgRoot}
                      onChange={(e) => handleColorChange("bgStage", e.target.value)}
                      className="flex-1 font-mono text-[11px] px-2 py-1 border border-[#bbd1cd] rounded bg-white"
                    />
                  </div>
                </div>

                {/* 7. Rahmenfarbe */}
                <div className="p-2.5 rounded-lg border border-[#bbd1cd] bg-[#fcfaf8] flex flex-col gap-1">
                  <span className="font-semibold text-[#1b5c53]">Rahmenlinien</span>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="color"
                      value={colors.border}
                      onChange={(e) => handleColorChange("border", e.target.value)}
                      className="w-8 h-8 rounded border border-gray-300 cursor-pointer p-0.5 bg-white shrink-0"
                    />
                    <input
                      type="text"
                      value={colors.border}
                      onChange={(e) => handleColorChange("border", e.target.value)}
                      className="flex-1 font-mono text-[11px] px-2 py-1 border border-[#bbd1cd] rounded bg-white"
                    />
                  </div>
                </div>

                {/* 8. Haupttextfarbe */}
                <div className="p-2.5 rounded-lg border border-[#bbd1cd] bg-[#fcfaf8] flex flex-col gap-1">
                  <span className="font-semibold text-[#1b5c53]">Haupt-Textfarbe</span>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="color"
                      value={colors.textMain}
                      onChange={(e) => handleColorChange("textMain", e.target.value)}
                      className="w-8 h-8 rounded border border-gray-300 cursor-pointer p-0.5 bg-white shrink-0"
                    />
                    <input
                      type="text"
                      value={colors.textMain}
                      onChange={(e) => handleColorChange("textMain", e.target.value)}
                      className="flex-1 font-mono text-[11px] px-2 py-1 border border-[#bbd1cd] rounded bg-white"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Echtzeit-Live-Vorschau */}
          <div className="w-full lg:w-[360px] bg-[#f8faf9] p-4 sm:p-5 flex flex-col justify-between shrink-0">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-[#1b5c53] uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#247a6d]" />
                  <span>Live-Vorschau</span>
                </span>
                <span className="text-[10px] text-[#6e6c70] bg-white px-2 py-0.5 rounded border border-[#bbd1cd]">
                  Echtzeit
                </span>
              </div>

              {/* Miniature Simulated Quiz Container */}
              <div
                className="rounded-xl shadow-md overflow-hidden border transition-all"
                style={{
                  backgroundColor: colors.bgRoot,
                  borderColor: colors.border,
                  color: colors.textMain,
                }}
              >
                {/* Simulated Header */}
                <div
                  className="p-3 text-white"
                  style={{
                    background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
                    color: colors.headerText,
                  }}
                >
                  <div className="flex items-center justify-between text-[10px] opacity-90 mb-1">
                    <span>🧩 ZQP Praxistest</span>
                    <span>Station 1 von 5</span>
                  </div>
                  <div className="font-bold text-xs truncate">
                    Sturzprävention im Alltag
                  </div>

                  {/* Simulated Progress */}
                  <div
                    className="w-full h-1.5 rounded-full mt-2 overflow-hidden"
                    style={{ backgroundColor: colors.primaryDeep }}
                  >
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: "35%",
                        backgroundColor: colors.accent,
                      }}
                    />
                  </div>
                </div>

                {/* Simulated Stage */}
                <div
                  className="p-3 space-y-2 text-xs"
                  style={{ backgroundColor: colors.bgStage || colors.bgRoot }}
                >
                  <p
                    className="font-bold text-[11px]"
                    style={{ color: colors.primaryDark }}
                  >
                    Welche Maßnahme sichert lose Teppichkanten im Flur ab?
                  </p>

                  {/* Simulated Selected Option Card */}
                  <div
                    className="p-2 rounded-lg border text-[11px] font-semibold flex items-center justify-between shadow-2xs"
                    style={{
                      backgroundColor: colors.primaryLight,
                      borderColor: colors.primary,
                      color: colors.textMain,
                    }}
                  >
                    <span>✓ Antirutsch-Gittermatte unterlegen</span>
                    <span
                      className="w-3 h-3 rounded-full flex items-center justify-center text-[8px] text-white"
                      style={{ backgroundColor: colors.primary }}
                    >
                      ✓
                    </span>
                  </div>

                  {/* Simulated Inactive Option Card */}
                  <div
                    className="p-2 rounded-lg border text-[11px] opacity-80"
                    style={{
                      backgroundColor: colors.cardBg,
                      borderColor: colors.border,
                      color: colors.textMain,
                    }}
                  >
                    <span>Teppich lose liegen lassen</span>
                  </div>
                </div>

                {/* Simulated Footer */}
                <div
                  className="p-2.5 border-t flex items-center justify-between"
                  style={{
                    backgroundColor: colors.cardBg,
                    borderColor: colors.border,
                  }}
                >
                  <span
                    className="text-[10px] font-semibold"
                    style={{ color: colors.textMuted }}
                  >
                    1 Aufgabe gelöst
                  </span>
                  <button
                    type="button"
                    className="px-2.5 py-1 rounded text-[11px] font-semibold text-white shadow-2xs"
                    style={{ backgroundColor: colors.primary }}
                  >
                    Weiter →
                  </button>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-[#bbd1cd] flex items-center justify-end gap-2 mt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 rounded-xl border border-[#bbd1cd] bg-white hover:bg-[#f3f8f7] text-xs font-semibold text-[#6e6c70] transition-colors cursor-pointer"
              >
                Abbrechen
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-[#247a6d] hover:bg-[#1b5c53] text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Theme speichern & anwenden</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
