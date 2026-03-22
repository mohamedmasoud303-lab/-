
import React from 'react';
import PrintTemplate from './PrintTemplate';
import { MaintenanceRecord } from '../../types';
import { useApp } from '../../contexts/AppContext';
import { formatCurrency, formatDate } from '../../utils/helpers';

interface MaintenancePrintableProps {
    record: MaintenanceRecord;
}

const MaintenancePrintable: React.FC<MaintenancePrintableProps> = ({ record }) => {
    const { db } = useApp();
    const unit = db.units.find(u => u.id === record.unitId);
    const property = db.properties.find(p => p.id === unit?.propertyId);

    return (
        <PrintTemplate title="أمر صيانة" subtitle={`رقم الأمر: ${record.no}`}>
            <div className="space-y-8 text-sm leading-relaxed">
                <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <h3 className="font-bold border-b pb-1 text-primary">بيانات الوحدة</h3>
                        <div className="space-y-1">
                            <p className="font-bold">{property?.name}</p>
                            <p className="text-xs text-muted-foreground">الوحدة: {unit?.name}</p>
                        </div>
                    </div>
                    <div className="space-y-4 text-left">
                        <h3 className="font-bold border-b pb-1 text-primary">بيانات الطلب</h3>
                        <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">تاريخ الطلب: {formatDate(record.requestDate)}</p>
                            <p className="text-xs text-muted-foreground">الحالة: {record.status}</p>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="font-bold border-b pb-1 text-primary">وصف المشكلة</h3>
                    <div className="p-4 border rounded-lg bg-muted/20">
                        <p className="font-bold">{record.description}</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="font-bold border-b pb-1 text-primary">التكاليف المقدرة</h3>
                    <div className="p-4 border rounded-lg flex justify-between items-center">
                        <span className="font-bold">إجمالي التكلفة</span>
                        <span className="text-xl font-black text-primary">{formatCurrency(record.cost || 0, db.settings?.currency)}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground">يتحمل التكلفة: {record.chargedTo === 'OWNER' ? 'المالك' : 'المستأجر'}</p>
                </div>

                <div className="grid grid-cols-2 gap-12 pt-16">
                    <div className="text-center space-y-12">
                        <p className="font-bold">توقيع الفني</p>
                        <div className="border-b border-dashed w-48 mx-auto"></div>
                    </div>
                    <div className="text-center space-y-12">
                        <p className="font-bold">توقيع المستلم</p>
                        <div className="border-b border-dashed w-48 mx-auto"></div>
                    </div>
                </div>
            </div>
        </PrintTemplate>
    );
};

export default MaintenancePrintable;
