
import React from 'react';
import PrintTemplate from './PrintTemplate';
import { Expense } from '../../core/types';
import { useApp } from '../../contexts/AppContext';
import { formatCurrency, formatDate } from '../../utils/helpers';

interface ExpensePrintableProps {
    expense: Expense;
}

const ExpensePrintable: React.FC<ExpensePrintableProps> = ({ expense }) => {
    const { db } = useApp();
    const property = db.properties.find(p => p.id === expense.propertyId);

    return (
        <PrintTemplate title="سند صرف" subtitle={`رقم السند: ${expense.no}`}>
            <div className="space-y-8 text-sm leading-relaxed">
                <div className="flex justify-between items-center p-6 bg-muted/20 rounded-lg">
                    <div className="space-y-1">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">تاريخ السند</p>
                        <p className="font-bold">{formatDate(expense.dateTime)}</p>
                    </div>
                    <div className="space-y-1 text-left">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">المبلغ الإجمالي</p>
                        <p className="text-2xl font-black text-danger">{formatCurrency(expense.amount, db.settings?.currency)}</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="font-bold border-b pb-1 text-primary">تفاصيل الصرف</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">الفئة</p>
                            <p className="font-bold">{expense.category}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">العقار</p>
                            <p className="font-bold">{property?.name || 'عام'}</p>
                        </div>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">البيان / الوصف</p>
                        <p className="font-bold">{expense.notes}</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="font-bold border-b pb-1 text-primary">طريقة الدفع</h3>
                    <div className="p-4 border rounded-lg flex justify-between items-center">
                        <span className="font-bold">{expense.ref}</span>
                        <span className="text-xs text-muted-foreground">رقم المرجع: {expense.ref || 'N/A'}</span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-12 pt-16">
                    <div className="text-center space-y-12">
                        <p className="font-bold">توقيع المحاسب</p>
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

export default ExpensePrintable;
