import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";
import { EditorialStatus } from "../types";

interface EditorialStatusDropdownProps {
  status: EditorialStatus;
  onChange: (newStatus: EditorialStatus) => void;
  className?: string;
}

const STATUS_CONFIG: Record<
  EditorialStatus,
  {
    label: string;
    sublabel: string;
    dotColor: string;
    bgColor: string;
    borderColor: string;
    textColor: string;
  }
> = {
  draft: {
    label: "Entwurf",
    sublabel: "In Bearbeitung & Formulierung",
    dotColor: "bg-amber-500",
    bgColor: "bg-amber-50/80 hover:bg-amber-100/80",
    borderColor: "border-amber-300",
    textColor: "text-amber-900",
  },
  in_review: {
    label: "In Prüfung",
    sublabel: "Bereit für Lektorat & Qualitätsprüfung",
    dotColor: "bg-sky-500",
    bgColor: "bg-sky-50/80 hover:bg-sky-100/80",
    borderColor: "border-sky-300",
    textColor: "text-sky-900",
  },
  approved: {
    label: "Freigegeben",
    sublabel: "Final geprüft für zqp.de",
    dotColor: "bg-emerald-500",
    bgColor: "bg-emerald-50/80 hover:bg-emerald-100/80",
    borderColor: "border-emerald-300",
    textColor: "text-emerald-900",
  },
};

export const EditorialStatusDropdown: React.FC<EditorialStatusDropdownProps> = ({
  status,
  onChange,
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const current = STATUS_CONFIG[status] || STATUS_CONFIG.draft;

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (key: EditorialStatus) => {
    onChange(key);
    setIsOpen(false);
  };

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      {/* Trigger Pill */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`h-7 px-2.5 rounded-full border text-xs font-semibold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer ${current.bgColor} ${current.borderColor} ${current.textColor}`}
        title="Redaktionsstatus ändern"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <span className={`w-2 h-2 rounded-full ${current.dotColor} shrink-0`} />
        <span>{current.label}</span>
        <ChevronDown className={`w-3 h-3 transition-transform duration-150 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {/* Popover Menu */}
      {isOpen && (
        <div className="absolute left-0 mt-1.5 w-64 rounded-xl bg-white border border-[#bbd1cd] shadow-xl z-50 py-1 animate-in fade-in zoom-in-95 duration-100">
          <div className="px-3 py-1.5 border-b border-[#bbd1cd]/50">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#6e6c70]">
              Redaktions-Workflow
            </span>
          </div>

          <div className="p-1 space-y-0.5">
            {(Object.keys(STATUS_CONFIG) as EditorialStatus[]).map((key) => {
              const cfg = STATUS_CONFIG[key];
              const isSelected = key === status;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleSelect(key)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-start gap-2.5 transition-colors cursor-pointer ${
                    isSelected ? "bg-[#f3f8f7] text-[#1b5c53]" : "hover:bg-gray-50 text-[#444444]"
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${cfg.dotColor} shrink-0 mt-1.5`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold leading-tight">{cfg.label}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-[#247a6d]" />}
                    </div>
                    <p className="text-[10px] text-[#6e6c70] leading-tight mt-0.5">
                      {cfg.sublabel}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
