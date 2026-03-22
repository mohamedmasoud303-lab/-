
import React, { useState, useRef, useEffect } from 'react';
import { MoreVertical, Edit2, Trash2, Printer, Ban, Eye, Download, Share2 } from 'lucide-react';

export interface ActionItem {
    label: string;
    icon?: React.ReactNode;
    onClick: () => void;
    variant?: 'default' | 'danger' | 'warning' | 'success';
}

interface ActionsMenuProps {
    items: ActionItem[];
}

const ActionsMenu: React.FC<ActionsMenuProps> = ({ items }) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative inline-block text-right" ref={menuRef}>
            <button 
                onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen(!isOpen);
                }}
                className="p-1 hover:bg-muted rounded-full transition-colors"
            >
                <MoreVertical className="w-4 h-4" />
            </button>

            {isOpen && (
                <div className="absolute left-0 mt-2 w-48 bg-white border rounded-md shadow-lg z-50 py-1 origin-top-left">
                    {items.map((item, idx) => (
                        <button
                            key={idx}
                            onClick={(e) => {
                                e.stopPropagation();
                                item.onClick();
                                setIsOpen(false);
                            }}
                            className={`w-full text-right px-4 py-2 text-sm flex items-center gap-2 hover:bg-muted transition-colors ${
                                item.variant === 'danger' ? 'text-danger' : 
                                item.variant === 'warning' ? 'text-warning' : 
                                item.variant === 'success' ? 'text-success' : 'text-foreground'
                            }`}
                        >
                            {item.icon}
                            <span>{item.label}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export const EditAction = (onClick: () => void): ActionItem => ({
    label: 'تعديل',
    icon: <Edit2 className="w-4 h-4" />,
    onClick
});

export const DeleteAction = (onClick: () => void): ActionItem => ({
    label: 'حذف',
    icon: <Trash2 className="w-4 h-4" />,
    onClick,
    variant: 'danger'
});

export const PrintAction = (onClick: () => void): ActionItem => ({
    label: 'طباعة',
    icon: <Printer className="w-4 h-4" />,
    onClick
});

export const VoidAction = (onClick: () => void): ActionItem => ({
    label: 'إلغاء / عكس',
    icon: <Ban className="w-4 h-4" />,
    onClick,
    variant: 'danger'
});

export const ViewAction = (onClick: () => void): ActionItem => ({
    label: 'عرض',
    icon: <Eye className="w-4 h-4" />,
    onClick
});

export const DownloadAction = (onClick: () => void): ActionItem => ({
    label: 'تحميل',
    icon: <Download className="w-4 h-4" />,
    onClick
});

export const ShareAction = (onClick: () => void): ActionItem => ({
    label: 'مشاركة',
    icon: <Share2 className="w-4 h-4" />,
    onClick
});

export default ActionsMenu;
