
import React from 'react';
import Card from '../../../components/ui/Card';
import { ArrowRight } from 'lucide-react';

interface ReportCardProps {
    title: string;
    description?: string;
    subtitle?: string;
    icon: React.ReactNode;
    onClick: () => void;
    color?: string;
}

const ReportCard: React.FC<ReportCardProps> = ({ title, description, subtitle, icon, onClick, color = 'primary' }) => {
    return (
        <Card 
            className="p-8 rounded-3xl shadow-sm hover:shadow-md transition-all cursor-pointer group border-r-4 border-r-primary"
            onClick={onClick}
        >
            <div className="flex items-start justify-between mb-6">
                <div className="p-4 rounded-2xl bg-primary/10 text-primary group-hover:scale-110 transition-transform">
                    {icon}
                </div>
                <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-[-4px] transition-transform" />
            </div>
            <h3 className="font-black text-xl text-heading tracking-tight mb-2">{title}</h3>
            <p className="text-xs font-medium text-muted-foreground tracking-widest uppercase line-clamp-2">{subtitle || description}</p>
        </Card>
    );
};

export default ReportCard;
