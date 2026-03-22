
import React from 'react';
import PrintTemplate from './PrintTemplate';
import { Contract } from '../../types';
import { useApp } from '../../contexts/AppContext';
import { formatCurrency, formatDate } from '../../utils/helpers';

interface ContractPrintableProps {
    contract: Contract;
}

const ContractPrintable: React.FC<ContractPrintableProps> = ({ contract }) => {
    const { db } = useApp();
    const tenant = db.tenants.find(t => t.id === contract.tenantId);
    const unit = db.units.find(u => u.id === contract.unitId);
    const property = db.properties.find(p => p.id === unit?.propertyId);

    return (
        <PrintTemplate title="عقد إيجار" subtitle={`رقم العقد: ${contract.id.slice(0, 8)}`}>
            <div className="space-y-8 text-sm leading-relaxed">
                <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <h3 className="font-bold border-b pb-1 text-primary">بيانات المستأجر</h3>
                        <div className="space-y-1">
                            <p className="font-bold">{tenant?.name}</p>
                            <p className="text-xs text-muted-foreground">رقم الهوية: {tenant?.idNo}</p>
                            <p className="text-xs text-muted-foreground">رقم الهاتف: {tenant?.phone}</p>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <h3 className="font-bold border-b pb-1 text-primary">بيانات العقار</h3>
                        <div className="space-y-1">
                            <p className="font-bold">{property?.name}</p>
                            <p className="text-xs text-muted-foreground">الوحدة: {unit?.name}</p>
                            <p className="text-xs text-muted-foreground">النوع: {unit?.type}</p>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="font-bold border-b pb-1 text-primary">تفاصيل العقد</h3>
                    <div className="grid grid-cols-3 gap-4 bg-muted/20 p-4 rounded-lg">
                        <div className="space-y-1">
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">تاريخ البدء</p>
                            <p className="font-bold">{formatDate(contract.start)}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">تاريخ الانتهاء</p>
                            <p className="font-bold">{formatDate(contract.end)}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">القيمة الإيجارية</p>
                            <p className="font-bold text-primary">{formatCurrency(contract.rent, db.settings?.currency)}</p>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="font-bold border-b pb-1 text-primary">الشروط والأحكام</h3>
                    <div className="text-xs space-y-2 text-muted-foreground">
                        <p>1. يلتزم المستأجر بسداد القيمة الإيجارية في المواعيد المحددة.</p>
                        <p>2. يلتزم المستأجر بالمحافظة على العين المؤجرة وتسليمها بحالتها الأصلية.</p>
                        <p>3. لا يحق للمستأجر التنازل عن الإيجار أو التأجير من الباطن دون موافقة خطية.</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-12 pt-16">
                    <div className="text-center space-y-12">
                        <p className="font-bold">توقيع المالك / المكتب</p>
                        <div className="border-b border-dashed w-48 mx-auto"></div>
                    </div>
                    <div className="text-center space-y-12">
                        <p className="font-bold">توقيع المستأجر</p>
                        <div className="border-b border-dashed w-48 mx-auto"></div>
                    </div>
                </div>
            </div>
        </PrintTemplate>
    );
};

export default ContractPrintable;
