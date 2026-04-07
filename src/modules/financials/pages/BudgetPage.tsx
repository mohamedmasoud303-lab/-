
import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from 'contexts/AppContext';
import { Budget, BudgetItem } from 'core/types';
import Card from 'components/ui/Card';
import { formatCurrency } from 'utils/helpers';
import { PieChart, PlusCircle, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

const MONTHS = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

const BudgetPage: React.FC = () => {
    const { db, dataService } = useApp();
    const [year, setYear] = useState(new Date().getFullYear());
    
    const budget = useMemo(() => db.budgets.find(b => b.year === year), [db.budgets, year]);
    const [items, setItems] = useState<BudgetItem[]>([]);

    useEffect(() => {
        setItems(budget?.items || []);
    }, [budget]);

    const handleItemChange = (itemId: string, monthIndex: number, value: string) => {
        setItems(prevItems => prevItems.map(item =>
            item.id === itemId
                ? { ...item, monthlyAmounts: item.monthlyAmounts.map((amount, i) => i === monthIndex ? parseFloat(value) || 0 : amount) }
                : item
        ));
    };

    const handleAddItem = (type: 'INCOME' | 'EXPENSE') => {
        const category = prompt(`أدخل اسم البند الجديد (${type === 'INCOME' ? 'إيراد' : 'مصروف'}):`);
        if (category) {
            const newItem: BudgetItem = {
                id: crypto.randomUUID(),
                category,
                type,
                monthlyAmounts: Array(12).fill(0)
            };
            setItems(prev => [...prev, newItem]);
        }
    };
    
    const handleRemoveItem = (itemId: string) => {
        if(window.confirm("هل أنت متأكد من حذف هذا البند؟")) {
            setItems(prev => prev.filter(item => item.id !== itemId));
        }
    };

    const handleSave = () => {
        if (budget) {
            dataService.update('budgets', budget.id, { items });
        } else {
            dataService.add('budgets', { year, items } as any);
        }
    };

    const totals = useMemo(() => {
        const monthlyTotals = { income: Array(12).fill(0), expense: Array(12).fill(0) };
        const yearlyTotals = { income: 0, expense: 0 };

        items.forEach(item => {
            item.monthlyAmounts.forEach((amount, i) => {
                if (item.type === 'INCOME') {
                    monthlyTotals.income[i] += amount;
                } else {
                    monthlyTotals.expense[i] += amount;
                }
            });
            const yearlyItemTotal = item.monthlyAmounts.reduce((sum, a) => sum + a, 0);
            if (item.type === 'INCOME') yearlyTotals.income += yearlyItemTotal;
            else yearlyTotals.expense += yearlyItemTotal;
        });

        const monthlyNet = monthlyTotals.income.map((inc, i) => inc - monthlyTotals.expense[i]);
        const yearlyNet = yearlyTotals.income - yearlyTotals.expense;

        return { monthlyTotals, yearlyTotals, monthlyNet, yearlyNet };
    }, [items]);

    const incomeItems = items.filter(i => i.type === 'INCOME');
    const expenseItems = items.filter(i => i.type === 'EXPENSE');

    return (
        <Card>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold flex items-center gap-2"><PieChart/> الموازنة التقديرية لعام {year}</h2>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <button onClick={() => setYear(y => y - 1)} className="btn btn-ghost">‹</button>
                        <span className="font-bold">{year}</span>
                        <button onClick={() => setYear(y => y + 1)} className="btn btn-ghost">›</button>
                    </div>
                    <button onClick={handleSave} className="btn btn-primary">حفظ الموازنة</button>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-right border-collapse">
                    <thead>
                        <tr className="bg-background">
                            <th className="sticky right-0 bg-background p-2 border border-border w-48">البند</th>
                            {MONTHS.map(m => <th key={m} className="p-2 border border-border min-w-[100px]">{m}</th>)}
                            <th className="p-2 border border-border min-w-[120px] font-black">الإجمالي السنوي</th>
                        </tr>
                    </thead>
                    <tbody>
                        {/* Income */}
                        <tr className="bg-green-50 dark:bg-green-900/30 font-bold"><td colSpan={14} className="p-2 border border-border">الإيرادات</td></tr>
                        {incomeItems.map(item => <BudgetItemRow key={item.id} item={item} onChange={handleItemChange} onRemove={handleRemoveItem}/>)}
                        <tr><td colSpan={14} className="p-2 border border-border"><button onClick={() => handleAddItem('INCOME')} className="text-green-600 flex items-center gap-1 text-xs font-bold"><PlusCircle size={14}/> إضافة إيراد</button></td></tr>
                        <tr className="font-bold bg-green-100 dark:bg-green-800/30">
                            <td className="sticky right-0 bg-green-100 dark:bg-green-800/30 p-2 border border-border">إجمالي الإيرادات</td>
                            {totals.monthlyTotals.income.map((total, i) => <td key={i} className="p-2 border border-border">{formatCurrency(total)}</td>)}
                            <td className="p-2 border border-border">{formatCurrency(totals.yearlyTotals.income)}</td>
                        </tr>

                        {/* Expenses */}
                        <tr className="bg-red-50 dark:bg-red-900/30 font-bold"><td colSpan={14} className="p-2 border border-border">المصروفات</td></tr>
                        {expenseItems.map(item => <BudgetItemRow key={item.id} item={item} onChange={handleItemChange} onRemove={handleRemoveItem}/>)}
                        <tr><td colSpan={14} className="p-2 border border-border"><button onClick={() => handleAddItem('EXPENSE')} className="text-red-600 flex items-center gap-1 text-xs font-bold"><PlusCircle size={14}/> إضافة مصروف</button></td></tr>
                        <tr className="font-bold bg-red-100 dark:bg-red-800/30">
                            <td className="sticky right-0 bg-red-100 dark:bg-red-800/30 p-2 border border-border">إجمالي المصروفات</td>
                            {totals.monthlyTotals.expense.map((total, i) => <td key={i} className="p-2 border border-border">{formatCurrency(total)}</td>)}
                            <td className="p-2 border border-border">{formatCurrency(totals.yearlyTotals.expense)}</td>
                        </tr>
                        
                        {/* Net */}
                        <tr className="font-black text-base bg-blue-100 dark:bg-blue-800/30">
                            <td className="sticky right-0 bg-blue-100 dark:bg-blue-800/30 p-2 border border-border">صافي الربح / (الخسارة)</td>
                            {totals.monthlyNet.map((net, i) => <td key={i} className={`p-2 border border-border ${net < 0 ? 'text-red-500' : ''}`}>{formatCurrency(net)}</td>)}
                            <td className={`p-2 border border-border ${totals.yearlyNet < 0 ? 'text-red-500' : ''}`}>{formatCurrency(totals.yearlyNet)}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </Card>
    );
};

const BudgetItemRow: React.FC<{item: BudgetItem, onChange: (id: string, month: number, val: string) => void, onRemove: (id: string) => void}> = ({ item, onChange, onRemove }) => {
    const total = useMemo(() => item.monthlyAmounts.reduce((sum, a) => sum + a, 0), [item.monthlyAmounts]);
    return (
        <tr>
            <td className="sticky right-0 bg-card p-2 border border-border w-48">
                <div className="flex items-center justify-between">
                    <span className="truncate">{item.category}</span>
                    <button onClick={() => onRemove(item.id)} className="text-text-muted hover:text-red-500 opacity-50 hover:opacity-100"><Trash2 size={12}/></button>
                </div>
            </td>
            {item.monthlyAmounts.map((amount, i) => (
                <td key={i} className="p-0 border border-border">
                    <input
                        type="number"
                        value={amount || ''}
                        onChange={e => onChange(item.id, i, e.target.value)}
                        className="w-full h-full bg-transparent border-none text-center focus:bg-background"
                        placeholder="0"
                    />
                </td>
            ))}
            <td className="p-2 border border-border bg-background font-bold">{formatCurrency(total)}</td>
        </tr>
    );
};

export default BudgetPage;
