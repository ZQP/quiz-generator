import React, { useState, useEffect } from "react";
import { X, Star, Trash2, Plus, Search } from "lucide-react";
import { FavoriteStation, QuizStation } from "../types";
import { loadFavoriteStations, deleteFavoriteStation } from "../services/projectStorage";

interface FavoritesLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertStation: (station: QuizStation) => void;
}

export const FavoritesLibraryModal: React.FC<FavoritesLibraryModalProps> = ({
  isOpen,
  onClose,
  onInsertStation,
}) => {
  const [favorites, setFavorites] = useState<FavoriteStation[]>(loadFavoriteStations);
  const [search, setSearch] = useState<string>("");

  useEffect(() => {
    if (isOpen) {
      setFavorites(loadFavoriteStations());
    }
  }, [isOpen]);

  useEffect(() => {
    const handleUpdate = () => {
      setFavorites(loadFavoriteStations());
    };
    window.addEventListener("zqp_favorites_changed", handleUpdate);
    return () => window.removeEventListener("zqp_favorites_changed", handleUpdate);
  }, []);

  if (!isOpen) return null;

  const refreshList = () => {
    setFavorites(loadFavoriteStations());
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Möchten Sie diese Vorlagen-Station aus Ihrer Schatzkiste entfernen?")) {
      deleteFavoriteStation(id);
      refreshList();
    }
  };

  const filtered = favorites.filter((f) => {
    const q = search.toLowerCase();
    return (
      f.station.title.toLowerCase().includes(q) ||
      f.station.promptOrInstruction.toLowerCase().includes(q) ||
      (f.category && f.category.toLowerCase().includes(q))
    );
  });

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-3 md:p-6 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl border border-[#bbd1cd] max-w-3xl w-full max-h-[85vh] shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-[#f3f8f7] border-b border-[#bbd1cd] px-5 py-3.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#247a6d] text-white flex items-center justify-center shadow-2xs">
              <Star className="w-4 h-4 fill-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#1b5c53]">
                Stations-Schatzkiste (Vorlagen-Bibliothek)
              </h2>
              <p className="text-[11px] text-[#6e6c70]">
                Gespeicherte Lieblings- und Standard-Stationen in jedes Quiz einfügen
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-[#e3eeec] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-[#bbd1cd] bg-[#fbfdfc] shrink-0">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-gray-400" />
            <input
              type="text"
              placeholder="Vorlagen nach Titel, Thema oder Mechanik durchsuchen..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-[#bbd1cd] text-xs bg-white focus:ring-1 focus:ring-[#247a6d] outline-none"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filtered.length === 0 ? (
            <div className="p-8 text-center bg-[#f9fbfb] rounded-xl border border-dashed border-[#bbd1cd]">
              <Star className="w-8 h-8 text-amber-400 mx-auto mb-2" />
              <h4 className="text-xs font-bold text-[#1b5c53]">
                {favorites.length === 0 ? "Noch keine Stationen gespeichert" : "Keine Treffer"}
              </h4>
              <p className="text-[11px] text-[#6e6c70] max-w-sm mx-auto mt-1">
                Klicken Sie in der Station-Vorschau oder im WYSIWYG-Editor auf „⭐ In Schatzkiste
                speichern“, um gelungene Stationen (z. B. Notrufnummern, ZQP-Definitionen) hier
                wiederzuverwenden.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filtered.map((fav) => (
                <div
                  key={fav.id}
                  className="bg-white rounded-xl border border-[#bbd1cd] hover:border-[#247a6d] p-3 flex flex-col justify-between shadow-2xs transition-all"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-[#e3eeec] text-[#1b5c53]">
                        {fav.station.type}
                      </span>
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-[#6e6c70]">{fav.category}</span>
                        <button
                          type="button"
                          onClick={(e) => handleDelete(fav.id, e)}
                          className="text-gray-400 hover:text-red-600 p-0.5 rounded cursor-pointer"
                          title="Aus Schatzkiste löschen"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <h4 className="text-xs font-bold text-[#1b5c53] line-clamp-1">
                      {fav.station.title}
                    </h4>
                    <p className="text-[11px] text-[#444444] line-clamp-2 leading-relaxed">
                      {fav.station.promptOrInstruction}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      onInsertStation(fav.station);
                      onClose();
                    }}
                    className="mt-3 w-full py-1.5 px-3 rounded-lg bg-[#247a6d] hover:bg-[#1b5c53] text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>In aktuelles Quiz einfügen</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-[#f3f8f7] border-t border-[#bbd1cd] px-5 py-2.5 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-[#6e6c70]">
            {favorites.length} Station{favorites.length === 1 ? "" : "en"} in der Schatzkiste hinterlegt
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border border-[#bbd1cd] text-xs font-medium hover:bg-gray-100 cursor-pointer"
          >
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
};
