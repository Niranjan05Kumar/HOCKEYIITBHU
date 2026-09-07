import { useState, useRef, useEffect, useMemo, type ReactNode } from "react";
import { ChevronDown, Search, Check } from "lucide-react";

export interface AdminSelectOption {
    value: string | number;
    label: string;
    sublabel?: string;
    disabled?: boolean;
}

export interface AdminSelectProps {
    value: string | number | undefined | null;
    onChange: (value: string) => void;
    options: AdminSelectOption[];
    placeholder?: string;
    disabled?: boolean;
    searchable?: boolean;
    searchPlaceholder?: string;
    className?: string;
    triggerClassName?: string;
    menuClassName?: string;
    error?: boolean | string;
    id?: string;
    allowClear?: boolean;
    clearLabel?: string;
    icon?: ReactNode;
}

/**
 * Standardized AdminSelect component matching the Captain/Vice-Captain reference UI.
 * Provides custom trigger, chevron icon, search filtering, scrollable menu, and active option indicators.
 */
export default function AdminSelect({
    value,
    onChange,
    options,
    placeholder = "Select...",
    disabled = false,
    searchable,
    searchPlaceholder = "Search options...",
    className = "w-full",
    triggerClassName = "",
    menuClassName = "",
    error,
    allowClear = false,
    clearLabel = "None",
    icon,
}: AdminSelectProps) {
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const [search, setSearch] = useState<string>("");
    const containerRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Auto-enable search if there are more than 6 options, unless explicitly specified
    const isSearchable = searchable !== undefined ? searchable : options.length > 6;

    // Find the currently selected option
    const selectedOption = useMemo(() => {
        if (value === undefined || value === null || value === "") return null;
        return options.find((opt) => String(opt.value) === String(value)) || null;
    }, [options, value]);

    // Filter options based on search query
    const filteredOptions = useMemo(() => {
        if (!isSearchable || !search.trim()) return options;
        const query = search.toLowerCase().trim();
        return options.filter(
            (opt) =>
                opt.label.toLowerCase().includes(query) || (opt.sublabel && opt.sublabel.toLowerCase().includes(query)),
        );
    }, [options, search, isSearchable]);

    // Handle outside clicks and keyboard escape
    useEffect(() => {
        if (!isOpen) return;

        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
                setSearch("");
            }
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                setIsOpen(false);
                setSearch("");
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("keydown", handleKeyDown);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [isOpen]);

    // Focus search input on open
    useEffect(() => {
        if (isOpen && isSearchable) {
            setTimeout(() => {
                searchInputRef.current?.focus();
            }, 50);
        }
    }, [isOpen, isSearchable]);

    const handleSelect = (val: string | number) => {
        onChange(String(val));
        setIsOpen(false);
        setSearch("");
    };

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange("");
        setIsOpen(false);
        setSearch("");
    };

    return (
        <div ref={containerRef} className={`relative ${className}`}>
            {/* Dropdown Trigger Button */}
            <div
                role="button"
                tabIndex={disabled ? -1 : 0}
                onClick={() => {
                    if (!disabled) {
                        setIsOpen(!isOpen);
                        if (!isOpen) setSearch("");
                    }
                }}
                onKeyDown={(e) => {
                    if (!disabled && (e.key === "Enter" || e.key === " ")) {
                        e.preventDefault();
                        setIsOpen(!isOpen);
                        if (!isOpen) setSearch("");
                    }
                }}
                className={`w-full bg-[#FCF9F2] border rounded px-3 py-2 text-xs text-[#1A1A1A] flex items-center justify-between cursor-pointer transition-colors ${
                    disabled
                        ? "opacity-50 cursor-not-allowed border-[rgba(26,26,26,0.1)] bg-[#f6f3ec]"
                        : "hover:border-[#3d030b]"
                } ${
                    isOpen
                        ? "border-[#3d030b] ring-1 ring-[#3d030b]/20"
                        : error
                          ? "border-[#ba1a1a]"
                          : "border-[rgba(26,26,26,0.15)]"
                } ${triggerClassName}`}
            >
                <div className="flex items-center gap-2 truncate pr-2">
                    {icon && <span className="shrink-0 text-[#6B665F]">{icon}</span>}
                    <span className={`truncate ${selectedOption ? "text-[#1A1A1A]" : "text-[#9C968D]"}`}>
                        {selectedOption ? selectedOption.label : placeholder}
                    </span>
                </div>
                <ChevronDown
                    className={`w-4 h-4 text-[#6B665F] shrink-0 transition-transform duration-150 ${
                        isOpen ? "rotate-180 text-[#3d030b]" : ""
                    }`}
                />
            </div>

            {/* Dropdown Popover Menu */}
            {isOpen && (
                <div
                    className={`absolute z-50 top-full left-0 right-0 mt-1 bg-[#FCF9F2] border border-[rgba(26,26,26,0.15)] rounded shadow-lg p-2 space-y-2 max-h-56 overflow-y-auto ${menuClassName}`}
                >
                    {/* Search Field (if enabled) */}
                    {isSearchable && (
                        <div className="relative">
                            <Search className="w-3.5 h-3.5 text-[#9C968D] absolute left-2 top-2 pointer-events-none" />
                            <input
                                ref={searchInputRef}
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder={searchPlaceholder}
                                className="w-full pl-7 pr-2 py-1 text-xs bg-white border border-[rgba(26,26,26,0.12)] rounded focus:outline-none focus:border-[#3d030b]"
                                onClick={(e) => e.stopPropagation()}
                            />
                        </div>
                    )}

                    {/* Options List */}
                    <div className="space-y-1">
                        {allowClear && (
                            <div
                                onClick={handleClear}
                                className={`px-2.5 py-1.5 rounded text-xs text-[#6B665F] hover:bg-[#ECE8E1] cursor-pointer transition-colors ${
                                    !value ? "bg-[#ECE8E1] font-semibold text-[#3d030b]" : ""
                                }`}
                            >
                                {clearLabel}
                            </div>
                        )}

                        {filteredOptions.length === 0 ? (
                            <div className="py-2 text-center text-xs text-[#9C968D]">No options found</div>
                        ) : (
                            filteredOptions.map((opt) => {
                                const isSelected =
                                    value !== undefined &&
                                    value !== null &&
                                    value !== "" &&
                                    String(value) === String(opt.value);

                                return (
                                    <div
                                        key={String(opt.value)}
                                        onClick={() => {
                                            if (!opt.disabled) {
                                                handleSelect(opt.value);
                                            }
                                        }}
                                        className={`px-2.5 py-1.5 rounded text-xs flex items-center justify-between cursor-pointer transition-colors ${
                                            opt.disabled ? "opacity-40 cursor-not-allowed" : "hover:bg-[#ECE8E1]"
                                        } ${
                                            isSelected ? "bg-[#ECE8E1] font-semibold text-[#3d030b]" : "text-[#1A1A1A]"
                                        }`}
                                    >
                                        <div className="truncate pr-2">
                                            <div className="truncate">{opt.label}</div>
                                            {opt.sublabel && (
                                                <div className="text-[10px] text-[#6B665F] truncate">
                                                    {opt.sublabel}
                                                </div>
                                            )}
                                        </div>
                                        {isSelected && <Check className="w-3.5 h-3.5 text-[#3d030b] shrink-0" />}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
