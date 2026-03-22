
import React from 'react';
import PrintTemplate from './PrintTemplate';
import { Receipt } from '../../types';
import { useApp } from '../../contexts/AppContext';
import { formatCurrency, formatDate } from '../../utils/helpers';

interface ReceiptPrintableProps {
    receipt: Receipt;
}

const ReceiptPrintable: React.FC<ReceiptPrintableProps> = ({ receipt }) => {
    const { db } = useApp();
    const contract = db.contracts.find(c => c.id === receipt.contractId);
    const tenant = db.tenants.find(t => t.id === contract?.tenantId);
    const unit = db.units.find(u => u.id === contract?.unitId);
    const property = db.properties.find(p => p.id === unit?.propertyId);

    return (
        <PrintTemplate title="سند قبض" subtitle={`رقم السند: ${receipt.no}`}>
            <div className="space-y-8 text-sm leading-relaxed">
                <div className="flex justify-between items-center p-6 bg-muted/20 rounded-lg">
                    <div className="space-y-1">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">تاريخ السند</p>
                        <p className="font-bold">{formatDate(receipt.dateTime)}</p>
                    </div>
                    <div className="space-y-1 text-left">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">المبلغ الإجمالي</p>
                        <p className="text-2xl font-black text-success">{formatCurrency(receipt.amount, db.settings?.currency)}</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="font-bold border-b pb-1 text-primary">بيانات المستلم منه</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">المستأجر</p>
                            <p className="font-bold">{tenant?.name}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">العقار / الوحدة</p>
                            <p className="font-bold">{property?.name} - {unit?.name}</p>
                        </div>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">البيان / الوصف</p>
                        <p className="font-bold">{receipt.notes}</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="font-bold border-b pb-1 text-primary">طريقة الدفع</h3>
                    <div className="p-4 border rounded-lg flex justify-between items-center">
                        <span className="font-bold">{receipt.channel}</span>
                        <span className="text-xs text-muted-foreground">رقم المرجع: {receipt.ref || 'N/A'}</span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-12 pt-16">
                    <div className="text-center space-y-12">
                        <p className="font-bold">توقيع المحاسب</p>
                        <div className="border-b border-dashed w-48 mx-auto"></div>
                    </div>
                    <div className="text-center space-y-12">
                        <p className="font-bold">توقيع المستلم منه</p>
                        <div className="border-b border-dashed w-48 mx-auto"></div>
                    </div>
                </div>
            </div>
        </PrintTemplate>
    );
};

export default ReceiptPrintable;
