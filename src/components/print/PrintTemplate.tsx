
import React from 'react';
import { useApp } from '../../contexts/AppContext';

interface PrintTemplateProps {
    title: string;
    subtitle?: string;
    children: React.ReactNode;
}

const PrintTemplate: React.FC<PrintTemplateProps> = ({ title, subtitle, children }) => {
    const { db } = useApp();
    const settings = db.settings;

    return (
        <div className="print-template p-8 bg-white max-w-[210mm] mx-auto min-h-[297mm] flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-start border-b-2 border-primary pb-6 mb-8">
                <div className="flex items-start gap-4">
                    {settings?.company.logoDataUrl && (
                        <img 
                            src={settings.company.logoDataUrl} 
                            alt="Logo" 
                            className="h-16 w-16 object-contain"
                            referrerPolicy="no-referrer"
                        />
                    )}
                    <div className="space-y-1">
                        <h1 className="text-2xl font-black text-primary">{settings?.company.name}</h1>
                        <p className="text-xs text-muted-foreground">{settings?.company.address}</p>
                        <p className="text-xs text-muted-foreground">{settings?.company.phone}</p>
                    </div>
                </div>
                <div className="text-left space-y-1">
                    <h2 className="text-xl font-bold tracking-widest uppercase">{title}</h2>
                    {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
                    <p className="text-[10px] text-muted-foreground mt-2">تاريخ الطباعة: {new Date().toLocaleString('ar-EG')}</p>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1">
                {children}
            </div>

            {/* Footer */}
            <div className="mt-12 pt-6 border-t text-[10px] text-muted-foreground flex justify-between items-center">
                <p>تم إنشاء هذا المستند آلياً بواسطة نظام Rentrix ERP</p>
                <p>صفحة 1 من 1</p>
            </div>
        </div>
    );
};

export default PrintTemplate;
