import React, { useState, useMemo } from 'react';
import { useApp } from '../../../contexts/AppContext';
import { calculateIncomeStatementData } from '../../../engine/financial/accountingService';
import { formatCurrency } from '../../../utils/helpers';
import ReportHeader from './ReportHeader';
import ExportButtons from './ExportButtons';
import PrintTemplate from '../../../components/print/PrintTemplate';
import { Calendar } from 'lucide-react';

const IncomeStatement: React.FC = () => {
    const { db } = useApp();
    const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10));
    const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10));
    
    const data = useMemo(() => {
        if (!db) return null;
        return calculateIncomeStatementData(db, startDate, endDate);
    }, [db, startDate, endDate]);

    const handlePrint = () => window.print();

    if (!data) return null;

    return (
        <div className="p-8 space-y-6">
            <div className="no-print bg-neutral/5 p-6 rounded-xl border border-border grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                <div className="space-y-2">
                    <label className="text-xs font-bold flex items-center gap-2"><Calendar className="w-3 h-3"/> من تاريخ</label>
                    <input type="date" value={startDate} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStartDate(e.target.value)} className="w-full p-2 border rounded-md" />
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-bold flex items-center gap-2"><Calendar className="w-3 h-3"/> إلى تاريخ</label>
                    <input type="date" value={endDate} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEndDate(e.target.value)} className="w-full p-2 border rounded-md" />
                </div>
            </div>

            {/* Screen View */}
            <div className="no-print space-y-8">
                <ReportHeader title="قائمة الأرباح والخسائر (P&L)" subtitle={`للفترة من ${startDate} إلى ${endDate}`} />

                <div className="space-y-12 bg-card p-8 rounded-2xl border border-border">
                    <section className="space-y-4">
                        <h3 className="text-success font-black border-b-2 border-success pb-2 text-lg">الإيرادات (Revenues)</h3>
                        {data.revenues.map((r: any) => (
                            <div key={r.no} className="flex justify-between py-3 border-b border-border/30 text-sm hover:bg-neutral/5 px-2 rounded">
                                <span>{r.name}</span>
                                <span className="font-mono">{formatCurrency(r.balance)}</span>
                            </div>
                        ))}
                        <div className="flex justify-between py-4 font-black bg-success/10 px-4 rounded-lg text-success-dark">
                            <span>إجمالي الإيرادات</span>
                            <span className="font-mono">{formatCurrency(data.totalRevenue)}</span>
                        </div>
                    </section>

                    <section className="space-y-4">
                        <h3 className="text-danger font-black border-b-2 border-danger pb-2 text-lg">المصاريف (Expenses)</h3>
                        {data.expenses.map((e: any) => (
                            <div key={e.no} className="flex justify-between py-3 border-b border-border/30 text-sm hover:bg-neutral/5 px-2 rounded">
                                <span>{e.name}</span>
                                <span className="font-mono">{formatCurrency(e.balance)}</span>
                            </div>
                        ))}
                        <div className="flex justify-between py-4 font-black bg-danger/10 px-4 rounded-lg text-danger-dark">
                            <span>إجمالي المصاريف</span>
                            <span className="font-mono">{formatCurrency(data.totalExpense)}</span>
                        </div>
                    </section>

                    <div className="pt-6 border-t-4 border-heading">
                        <div className="flex justify-between items-center p-6 bg-heading text-white rounded-2xl shadow-lg">
                            <span className="text-xl font-black">صافي الدخل (Net Income)</span>
                            <span className="text-3xl font-mono font-black" dir="ltr">{formatCurrency(data.netIncome)}</span>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end">
                    <ExportButtons 
                        data={[...data.revenues, ...data.expenses]} 
                        filename={`Income_Statement_${startDate}`} 
                        onPrint={handlePrint} 
                    />
                </div>
            </div>

            {/* Print View */}
            <div className="hidden print:block">
                <PrintTemplate title="قائمة الأرباح والخسائر" subtitle={`للفترة من ${startDate} إلى ${endDate}`}>
                    <div className="space-y-8">
                        <section>
                            <h3 className="font-bold border-b-2 border-gray-300 pb-1 mb-2">الإيرادات</h3>
                            <table className="w-full text-sm">
                                <tbody>
                                    {data.revenues.map((r: any) => (
                                        <tr key={r.no} className="border-b border-gray-100">
                                            <td className="py-1">{r.name}</td>
                                            <td className="py-1 text-left font-mono">{formatCurrency(r.balance)}</td>
                                        </tr>
                                    ))}
                                    <tr className="bg-gray-100 font-bold">
                                        <td className="py-2 px-2">إجمالي الإيرادات</td>
                                        <td className="py-2 px-2 text-left font-mono">{formatCurrency(data.totalRevenue)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </section>

                        <section>
                            <h3 className="font-bold border-b-2 border-gray-300 pb-1 mb-2">المصاريف</h3>
                            <table className="w-full text-sm">
                                <tbody>
                                    {data.expenses.map((e: any) => (
                                        <tr key={e.no} className="border-b border-gray-100">
                                            <td className="py-1">{e.name}</td>
                                            <td className="py-1 text-left font-mono">{formatCurrency(e.balance)}</td>
                                        </tr>
                                    ))}
                                    <tr className="bg-gray-100 font-bold">
                                        <td className="py-2 px-2">إجمالي المصاريف</td>
                                        <td className="py-2 px-2 text-left font-mono">{formatCurrency(data.totalExpense)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </section>

                        <div className="mt-8 pt-4 border-t-2 border-black">
                            <div className="flex justify-between items-center text-lg font-black">
                                <span>صافي الدخل</span>
                                <span className="font-mono" dir="ltr">{formatCurrency(data.netIncome)}</span>
                            </div>
                        </div>
                    </div>
                </PrintTemplate>
            </div>
        </div>
    );
};

export default IncomeStatement;
