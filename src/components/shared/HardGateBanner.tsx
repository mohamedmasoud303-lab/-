
import React from 'react';
import { AlertTriangle, Lock } from 'lucide-react';

const HardGateBanner: React.FC = () => {
    return (
        <div className="bg-danger-foreground text-danger p-4 rounded-lg flex items-center gap-4 mb-6 border border-danger/20">
            <div className="p-2 bg-danger/10 rounded-full">
                <Lock className="w-6 h-6" />
            </div>
            <div className="flex-1">
                <h3 className="font-bold text-sm">النظام مغلق حالياً</h3>
                <p className="text-xs opacity-80">تم تفعيل القفل المالي، جميع العمليات الحسابية والتحرير معطلة حالياً.</p>
            </div>
            <AlertTriangle className="w-5 h-5 opacity-50" />
        </div>
    );
};

export default HardGateBanner;
