import React from 'react';
import { cn } from '../../../utils/helpers';
import { Trophy, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface RankItem {
  id: string;
  name: string;
  value: string | number;
  subValue?: string;
  rank?: number;
  trend?: 'up' | 'down' | 'neutral';
  image?: string;
}

interface PerformanceRankListProps {
  title: string;
  items: RankItem[];
  icon?: React.ReactNode;
  className?: string;
  onItemClick?: (item: RankItem) => void;
}

const PerformanceRankList: React.FC<PerformanceRankListProps> = ({
  title,
  items,
  icon,
  className,
  onItemClick
}) => {
  return (
    <div className={cn("rounded-2xl border bg-card shadow-sm overflow-hidden", className)}>
      <div className="p-4 border-b bg-muted/30 flex items-center justify-between">
        <h3 className="font-bold text-sm flex items-center gap-2">
          {icon || <Trophy size={16} className="text-warning" />}
          {title}
        </h3>
      </div>
      <div className="divide-y divide-border">
        {items.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-xs">لا توجد بيانات</div>
        ) : (
          items.map((item, index) => (
            <div 
              key={item.id}
              onClick={() => onItemClick?.(item)}
              className={cn(
                "p-3 flex items-center gap-3 hover:bg-muted/50 transition-colors",
                onItemClick && "cursor-pointer"
              )}
            >
              <div className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black",
                index === 0 ? "bg-warning/20 text-warning" :
                index === 1 ? "bg-slate-300/50 text-slate-600" :
                index === 2 ? "bg-orange-700/10 text-orange-700" :
                "bg-muted text-muted-foreground"
              )}>
                {item.rank || index + 1}
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate">{item.name}</p>
                {item.subValue && <p className="text-[10px] text-muted-foreground truncate">{item.subValue}</p>}
              </div>
              
              <div className="text-right">
                <p className="text-sm font-black">{item.value}</p>
                {item.trend && (
                  <div className="flex justify-end">
                    {item.trend === 'up' && <TrendingUp size={12} className="text-success" />}
                    {item.trend === 'down' && <TrendingDown size={12} className="text-danger" />}
                    {item.trend === 'neutral' && <Minus size={12} className="text-muted-foreground" />}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default PerformanceRankList;
