
import React from 'react';
import PrintTemplate from './PrintTemplate';
import { Invoice } from '../../types';
import { useApp } from '../../contexts/AppContext';
import { formatCurrency, formatDate } from '../../utils/helpers';

interface InvoicePrintableProps {
    invoice: Invoice;
}

const InvoicePrintable: React.FC<InvoicePrintableProps> = ({ invoice }) => {
    const { db } = useApp();
    const contract = db.contracts.find(c => c.id === invoice.contractId);
    const tenant = db.tenants.find(t => t.id === contract?.tenantId);
    const unit = db.units.find(u => u.id === contract?.unitId);
    const property = db.properties.find(p => p.id === unit?.propertyId);

    return (
        <PrintTemplate title="فاتورة إيجار" subtitle={`رقم الفاتورة: ${invoice.no}`}>
            <div className="space-y-8 text-sm leading-relaxed">
                <div className="flex justify-between items-start">
                    <div className="space-y-4">
                        <h3 className="font-bold border-b pb-1 text-primary">بيانات المستأجر</h3>
                        <div className="space-y-1">
                            <p className="font-bold">{tenant?.name}</p>
                            <p className="text-xs text-muted-foreground">رقم الهاتف: {tenant?.phone}</p>
                        </div>
                    </div>
                    <div className="space-y-4 text-left">
                        <h3 className="font-bold border-b pb-1 text-primary">بيانات الفاتورة</h3>
                        <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">تاريخ الاستحقاق: {formatDate(invoice.dueDate)}</p>
                            <p className="text-xs text-muted-foreground">الحالة: {invoice.status}</p>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="font-bold border-b pb-1 text-primary">تفاصيل الرسوم</h3>
                    <table className="w-full text-xs">
                        <thead>
                            <tr className="bg-muted/30">
                                <th className="p-2 text-right">الوصف</th>
                                <th className="p-2 text-left">المبلغ</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="border-b">
                                <td className="p-2">إيجار شهر - {property?.name} - {unit?.name}</td>
                                <td className="p-2 text-left font-bold">{formatCurrency(invoice.amount, db.settings?.currency)}</td>
                            </tr>
                            {invoice.taxAmount && invoice.taxAmount > 0 && (
                                <tr className="border-b">
                                    <td className="p-2">ضريبة القيمة المضافة</td>
                                    <td className="p-2 text-left font-bold">{formatCurrency(invoice.taxAmount, db.settings?.currency)}</td>
                                </tr>
                            )}
                        </tbody>
                        <tfoot>
                            <tr className="bg-primary/5">
                                <td className="p-2 font-bold">الإجمالي المستحق</td>
                                <td className="p-2 text-left font-black text-primary text-lg">{formatCurrency(invoice.amount + (invoice.taxAmount || 0), db.settings?.currency)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                <div className="space-y-4">
                    <h3 className="font-bold border-b pb-1 text-primary">ملاحظات</h3>
                    <p className="text-xs text-muted-foreground">يرجى سداد الفاتورة قبل تاريخ الاستحقاق لتجنب أي غرامات تأخير.</p>
                </div>

                <div className="grid grid-cols-2 gap-12 pt-16">
                    <div className="text-center space-y-12">
                        <p className="font-bold">ختم الشركة</p>
                        <div className="w-32 h-32 border-2 border-dashed border-muted rounded-full mx-auto flex items-center justify-center opacity-20">
                            الختم هنا
                        </div>
                    </div>
                    <div className="text-center space-y-12">
                        <p className="font-bold">توقيع المحاسب</p>
                        <div className="border-b border-dashed w-48 mx-auto"></div>
                    </div>
                </div>
            </div>
        </PrintTemplate>
    );
};

export default InvoicePrintable;
