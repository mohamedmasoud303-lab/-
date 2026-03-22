
import React from 'react';

interface QuickActionBtnProps {
    label: string;
    icon: React.ReactNode;
    onClick: () => void;
    color?: string;
}

const QuickActionBtn: React.FC<QuickActionBtnProps> = ({ label, icon, onClick, color = 'primary' }) => {
    return (
        <button 
            onClick={onClick}
            className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 border-transparent hover:border-${color} hover:bg-${color}/5 transition-all group`}
        >
            <div className={`p-3 rounded-lg bg-${color}/10 text-${color} mb-2 group-hover:scale-110 transition-transform`}>
                {icon}
            </div>
            <span className="text-xs font-bold text-slate-600">{label}</span>
        </button>
    );
};

export default QuickActionBtn;
