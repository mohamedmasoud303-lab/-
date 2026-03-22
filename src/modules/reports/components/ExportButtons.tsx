
import React from 'react';
import { Download, Printer, FileText, FileSpreadsheet } from 'lucide-react';

interface ExportButtonsProps {
    onPdf?: () => void;
    onExcel?: () => void;
    onPrint?: () => void;
    data?: any[];
    filename?: string;
}

const ExportButtons: React.FC<ExportButtonsProps> = ({ onPdf, onExcel, onPrint, data, filename }) => {
    return (
        <div className="flex items-center gap-2 no-print">
            {onPdf && (
                <button onClick={onPdf} className="btn btn-secondary btn-sm gap-2">
                    <Download className="w-3 h-3" /> PDF
                </button>
            )}
            {onExcel && (
                <button onClick={onExcel} className="btn btn-secondary btn-sm gap-2">
                    <FileSpreadsheet className="w-3 h-3" /> Excel
                </button>
            )}
            {onPrint && (
                <button onClick={onPrint || (() => window.print())} className="btn btn-secondary btn-sm gap-2">
                    <Printer className="w-3 h-3" /> طباعة
                </button>
            )}
        </div>
    );
};

export default ExportButtons;
