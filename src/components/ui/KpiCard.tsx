
import React from 'react';

interface KpiCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  color?: 'green' | 'red' | 'blue' | 'yellow';
  onClick?: () => void;
  className?: string;
}

const KpiCard: React.FC<KpiCardProps> = ({ title, value, icon, color = 'blue', onClick, className = '' }) => {
  const colorMap = {
    green: 'text-success bg-success/5 border-success/10',
    red: 'text-danger bg-danger/5 border-danger/10',
    blue: 'text-primary bg-primary/5 border-primary/10',
    yellow: 'text-warning bg-warning/5 border-warning/10',
  };

  return (
    <div 
      onClick={onClick}
      className={`relative overflow-hidden bg-card border border-border p-5 rounded-2xl shadow-sm transition-all duration-300 hover:border-primary/30 hover:shadow-brand ${onClick ? 'cursor-pointer active:scale-[0.98]' : ''} ${className}`}
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
           <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">{title}</span>
           {icon && <div className={`p-2 rounded-xl border ${colorMap[color]}`}>{icon}</div>}
        </div>
        <div className="flex items-baseline gap-1 truncate">
            <span className="text-2xl font-black text-heading leading-none" dir="ltr">{value}</span>
        </div>
      </div>
    </div>
  );
};

export default KpiCard;
