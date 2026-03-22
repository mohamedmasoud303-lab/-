import React from 'react';
import { ArrowUpRight, ArrowDownRight, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '../../utils/helpers';

interface ExecutiveKpiCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: string;
    isPositive: boolean;
    label?: string;
  };
  description?: string;
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'indigo' | 'emerald' | 'rose' | 'amber';
  className?: string;
  onClick?: () => void;
}

const ExecutiveKpiCard: React.FC<ExecutiveKpiCardProps> = ({
  title,
  value,
  icon,
  trend,
  description,
  variant = 'primary',
  className,
  onClick
}) => {
  const variantStyles = {
    primary: 'bg-card text-primary border-primary/10',
    success: 'bg-card text-emerald-600 border-emerald-500/10',
    warning: 'bg-card text-amber-600 border-amber-500/10',
    danger: 'bg-card text-rose-600 border-rose-500/10',
    info: 'bg-card text-blue-600 border-blue-500/10',
    indigo: 'bg-card text-indigo-600 border-indigo-500/10',
    emerald: 'bg-card text-emerald-600 border-emerald-500/10',
    rose: 'bg-card text-rose-600 border-rose-500/10',
    amber: 'bg-card text-amber-600 border-amber-500/10',
  };

  const iconBgStyles = {
    primary: 'bg-primary/10 text-primary',
    success: 'bg-emerald-500/10 text-emerald-600',
    warning: 'bg-amber-500/10 text-amber-600',
    danger: 'bg-rose-500/10 text-rose-600',
    info: 'bg-blue-500/10 text-blue-600',
    indigo: 'bg-indigo-500/10 text-indigo-600',
    emerald: 'bg-emerald-500/10 text-emerald-600',
    rose: 'bg-rose-500/10 text-rose-600',
    amber: 'bg-amber-500/10 text-amber-600',
  };

  return (
    <div 
      onClick={onClick}
      className={cn(
        "group relative overflow-hidden rounded-2xl border bg-card p-6 shadow-sm transition-all duration-300 hover:shadow-brand hover:-translate-y-1",
        onClick && "cursor-pointer active:scale-[0.98]",
        variantStyles[variant],
        className
      )}
    >
      <div className="relative flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-[11px] font-bold uppercase tracking-[0.15em] opacity-60">{title}</p>
          <h3 className="text-3xl font-black tracking-tight text-heading">{value}</h3>
        </div>
        <div className={cn("rounded-2xl p-3.5 transition-transform duration-300 group-hover:scale-110", iconBgStyles[variant])}>
          {icon}
        </div>
      </div>
      
      {(trend || description) && (
        <div className="relative mt-5 flex items-center gap-3 text-xs">
          {trend && (
            <div className={cn(
              "flex items-center gap-1.5 font-bold rounded-full px-3 py-1",
              trend.isPositive ? "text-emerald-700 bg-emerald-500/10" : "text-rose-700 bg-rose-500/10"
            )}>
              {trend.isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              <span>{trend.value}</span>
            </div>
          )}
          {description && (
            <p className="text-muted-foreground font-medium truncate opacity-70">{description}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default ExecutiveKpiCard;
