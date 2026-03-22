
import React from 'react';
import { Search, Plus, Printer } from 'lucide-react';

interface FilterOption {
    value: string;
    label: string;
}

interface TableControlsProps {
    searchTerm: string;
    onSearchChange: (value: string) => void;
    placeholder?: string;
    onAdd?: () => void;
    addLabel?: string;
    onPrint?: () => void;
    filterOptions?: FilterOption[];
    activeFilter?: string;
    onFilterChange?: (value: string) => void;
    children?: React.ReactNode;
}

const TableControls: React.FC<TableControlsProps> = ({ 
    searchTerm, 
    onSearchChange, 
    placeholder = "بحث...", 
    onAdd,
    addLabel = "إضافة جديد",
    onPrint,
    filterOptions,
    activeFilter,
    onFilterChange,
    children 
}) => {
    return (
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
            <div className="flex flex-col md:flex-row items-center gap-4 flex-1 w-full">
                <div className="relative flex-1 max-w-md w-full">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input 
                        type="text" 
                        placeholder={placeholder}
                        className="w-full pr-10 pl-4 py-2.5 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                        value={searchTerm}
                        onChange={e => onSearchChange(e.target.value)}
                    />
                </div>

                {filterOptions && onFilterChange && (
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 w-full md:w-auto">
                        {filterOptions.map(opt => (
                            <button
                                key={opt.value}
                                onClick={() => onFilterChange(opt.value)}
                                className={`px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                                    activeFilter === opt.value 
                                    ? 'bg-primary text-primary-foreground shadow-brand' 
                                    : 'bg-card border border-border text-muted-foreground hover:bg-muted'
                                }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                )}
                
                {children}
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
                {onPrint && (
                    <button onClick={onPrint} className="btn btn-secondary gap-2 flex-1 md:flex-none rounded-xl">
                        <Printer className="w-4 h-4" /> طباعة
                    </button>
                )}
                {onAdd && (
                    <button onClick={onAdd} className="btn btn-primary gap-2 flex-1 md:flex-none rounded-xl shadow-brand">
                        <Plus className="w-4 h-4" /> {addLabel}
                    </button>
                )}
            </div>
        </div>
    );
};

export default TableControls;
