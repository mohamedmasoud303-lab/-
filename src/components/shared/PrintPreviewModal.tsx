
import React from 'react';
import Modal from '../ui/Modal';
import { Printer, Download, X } from 'lucide-react';

interface PrintPreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    onDownload?: () => void;
    onExportPdf?: () => void;
    size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

const PrintPreviewModal: React.FC<PrintPreviewModalProps> = ({ 
    isOpen, 
    onClose, 
    title, 
    children, 
    onDownload,
    onExportPdf,
    size = 'xl'
}) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title} size={size}>
            <div className="flex flex-col h-full">
                <div className="flex justify-end gap-2 mb-4 no-print">
                    {(onDownload || onExportPdf) && (
                        <button onClick={onDownload || onExportPdf} className="btn btn-secondary gap-2">
                            <Download className="w-4 h-4" /> تحميل PDF
                        </button>
                    )}
                    <button onClick={() => window.print()} className="btn btn-primary gap-2">
                        <Printer className="w-4 h-4" /> طباعة
                    </button>
                </div>
                <div className="flex-1 overflow-auto bg-slate-100 p-8 rounded-lg">
                    <div className="bg-white shadow-lg mx-auto max-w-[210mm] min-h-[297mm] p-[20mm] print-area">
                        {children}
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default PrintPreviewModal;
