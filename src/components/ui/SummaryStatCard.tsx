import React from 'react';

interface SummaryStatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color?: 'success' | 'warning' | 'danger' | 'info';
}

const SummaryStatCard: React.FC<SummaryStatCardProps> = ({ label, value, icon, color = 'info' }) => {
  const colorClasses = {
    success: 'bg-success/10 text-success border-success/20',
    warning: 'bg-warning/10 text-warning border-warning/20',
    danger: 'bg-danger/10 text-danger border-danger/20',
    info: 'bg-primary/10 text-primary border-primary/20',
  };

  return (
    <div className="p-6 bg-card rounded-2xl border border-border shadow-sm hover:shadow-brand transition-all duration-300">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">{label}</p>
          <p className="text-3xl font-black text-heading mt-1">{value}</p>
        </div>
        <div className={`flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-2xl border ${colorClasses[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

export default SummaryStatCard;