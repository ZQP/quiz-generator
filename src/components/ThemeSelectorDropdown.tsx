import React, { useState, useRef, useEffect } from "react";
import { Palette, Check, Plus, Copy, Trash2, Edit2, ChevronDown } from "lucide-react";
import { QuizTheme } from "../types";
import { getAllThemes, getThemeById, deleteCustomTheme, BUILTIN_THEMES } from "../services/themeService";

interface ThemeSelectorDropdownProps {
  currentThemeId?: string;
  customTheme?: QuizTheme;
  onSelectTheme: (themeId: string, customTheme?: QuizTheme) => void;
  onOpenCreateModal: () => void;
  onOpenDuplicateModal: (baseTheme: QuizTheme) => void;
  onOpenEditModal: (themeToEdit: QuizTheme) => void;
}

export const ThemeSelectorDropdown: React.FC<ThemeSelectorDropdownProps> = ({
  currentThemeId,
  customTheme,
  onSelectTheme,
  onOpenCreateModal,
  onOpenDuplicateModal,
  onOpenEditModal,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [allThemes, setAllThemes] = useState<QuizTheme[]>(getAllThemes);

  const activeTheme = getThemeById(currentThemeId, customTheme);

  // Reload themes if custom themes change
  useEffect(() => {
    const handleThemesChanged = () => {
      setAllThemes(getAllThemes());
    };
    window.addEventListener("zqp_themes_changed", handleThemesChanged);
    return () => window.removeEventListener("zqp_themes_changed", handleThemesChanged);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const customThemes = allThemes.filter((t) => !t.isBuiltin);

  const handleDeleteTheme = (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation();
    if (confirm(`Möchten Sie das Theme „${name}“ wirklich löschen?`)) {
      deleteCustomTheme(id);
      setAllThemes(getAllThemes());
      if (activeTheme.id === id) {
        onSelectTheme("zqp-petrol");
      }
    }
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Trigger Button in Preview Toolbar */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 h-7 px-2.5 text-xs font-semibold text-[#1b5c53] bg-white hover:bg-[#e3eeec] rounded-lg border border-[#bbd1cd] hover:border-[#247a6d] shadow-2xs transition-all cursor-pointer"
        title="Theme & Farbdesign des Quizes anpassen"
      >
        <Palette className="w-3.5 h-3.5 text-[#247a6d]" />
        
        {/* Color preview pip */}
        <div className="flex items-center -space-x-1">
          <span
            className="w-2.5 h-2.5 rounded-full border border-white shadow-2xs"
            style={{ backgroundColor: activeTheme.colors.primary }}
          />
          <span
            className="w-2.5 h-2.5 rounded-full border border-white shadow-2xs"
            style={{ backgroundColor: activeTheme.colors.accent }}
          />
        </div>

        <span className="max-w-[120px] truncate">{activeTheme.name}</span>
        <ChevronDown className="w-3 h-3 text-[#6e6c70]" />
      </button>

      {/* Popover Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-80 max-h-[460px] overflow-y-auto bg-white rounded-xl shadow-xl border border-[#bbd1cd] z-50 p-2 animate-in fade-in duration-150">
          <div className="px-2 py-1.5 border-b border-[#e3eeec] mb-1.5 flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#1b5c53] uppercase tracking-wider">
              Quiz-Farbdesign (ZQP)
            </span>
            <span className="text-[10px] text-[#6e6c70]">
              {allThemes.length} Themes
            </span>
          </div>

          {/* Built-in Presets */}
          <div className="space-y-1 mb-2">
            <div className="px-2 text-[10px] font-bold text-[#6e6c70] uppercase tracking-wider">
              ZQP-Standard-Designs
            </div>
            {BUILTIN_THEMES.map((theme) => {
              const isSelected = activeTheme.id === theme.id;
              return (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => {
                    onSelectTheme(theme.id);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left p-2 rounded-lg transition-all flex items-center justify-between group cursor-pointer border ${
                    isSelected
                      ? "bg-[#edf7f4] border-[#247a6d] text-[#1b5c53] font-semibold"
                      : "bg-white hover:bg-[#f3f8f7] border-transparent text-[#444444]"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {/* Swatch Trio */}
                    <div className="flex items-center -space-x-1 shrink-0">
                      <span
                        className="w-4 h-4 rounded-full border border-white shadow-xs"
                        style={{ backgroundColor: theme.colors.primary }}
                        title={`Primär: ${theme.colors.primary}`}
                      />
                      <span
                        className="w-4 h-4 rounded-full border border-white shadow-xs"
                        style={{ backgroundColor: theme.colors.primaryDark }}
                        title={`Header-Verlauf: ${theme.colors.primaryDark}`}
                      />
                      <span
                        className="w-4 h-4 rounded-full border border-white shadow-xs"
                        style={{ backgroundColor: theme.colors.accent }}
                        title={`Akzent: ${theme.colors.accent}`}
                      />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs truncate">{theme.name}</span>
                        {theme.badge && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-white border border-[#bbd1cd] text-[#1b5c53] shrink-0 font-medium">
                            {theme.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-[#6e6c70] truncate leading-tight">
                        {theme.description}
                      </p>
                    </div>
                  </div>

                  {isSelected && <Check className="w-4 h-4 text-[#247a6d] shrink-0 ml-1" />}
                </button>
              );
            })}
          </div>

          {/* Custom Themes Section (if any) */}
          {customThemes.length > 0 && (
            <div className="space-y-1 mb-2 pt-1 border-t border-[#e3eeec]">
              <div className="px-2 text-[10px] font-bold text-[#6e6c70] uppercase tracking-wider">
                Eigene Themes ({customThemes.length})
              </div>
              {customThemes.map((theme) => {
                const isSelected = activeTheme.id === theme.id;
                return (
                  <div
                    key={theme.id}
                    onClick={() => {
                      onSelectTheme(theme.id, theme);
                      setIsOpen(false);
                    }}
                    className={`p-2 rounded-lg transition-all flex items-center justify-between group cursor-pointer border ${
                      isSelected
                        ? "bg-[#edf7f4] border-[#247a6d] text-[#1b5c53] font-semibold"
                        : "bg-white hover:bg-[#f3f8f7] border-transparent text-[#444444]"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="flex items-center -space-x-1 shrink-0">
                        <span
                          className="w-4 h-4 rounded-full border border-white shadow-xs"
                          style={{ backgroundColor: theme.colors.primary }}
                        />
                        <span
                          className="w-4 h-4 rounded-full border border-white shadow-xs"
                          style={{ backgroundColor: theme.colors.accent }}
                        />
                      </div>

                      <div className="min-w-0">
                        <span className="text-xs truncate block">{theme.name}</span>
                        <p className="text-[10px] text-[#6e6c70] truncate leading-tight">
                          {theme.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsOpen(false);
                          onOpenEditModal(theme);
                        }}
                        className="p-1 text-[#6e6c70] hover:text-[#1b5c53] rounded hover:bg-[#e3eeec] transition-colors"
                        title="Theme bearbeiten"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteTheme(e, theme.id, theme.name)}
                        className="p-1 text-[#6e6c70] hover:text-rose-600 rounded hover:bg-rose-50 transition-colors"
                        title="Theme löschen"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      {isSelected && <Check className="w-4 h-4 text-[#247a6d] ml-0.5" />}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Action Footer: Duplizieren & Neu erstellen */}
          <div className="pt-2 border-t border-[#e3eeec] space-y-1">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onOpenDuplicateModal(activeTheme);
              }}
              className="w-full py-1.5 px-2.5 rounded-lg text-xs font-semibold text-[#1b5c53] hover:bg-[#e3eeec] transition-colors flex items-center gap-2 cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5 text-[#247a6d]" />
              <span>Aktuelles Theme duplizieren & anpassen</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onOpenCreateModal();
              }}
              className="w-full py-1.5 px-2.5 rounded-lg text-xs font-semibold text-[#1b5c53] hover:bg-[#e3eeec] transition-colors flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-[#247a6d]" />
              <span>Neues Theme erstellen</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
