import React, { useState, useMemo } from 'react';
import { useApp } from '../../../contexts/AppContext';
import { calculateBalanceSheetData } from '../../../engine/financial/accountingService';
import { formatCurrency } from '../../../utils/helpers';
import ReportHeader from './ReportHeader';
import ExportButtons from './ExportButtons';
import PrintTemplate from '../../../components/print/PrintTemplate';
import { Calendar } from 'lucide-react';

const BalanceSheet: React.FC = () => {
    const { db } = useApp();
    const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
    
    const data = useMemo(() => {
        if (!db) return null;
        return calculateBalanceSheetData(db, date);
    }, [db, date]);

    const handlePrint = () => window.print();

    if (!data) return null;

    return (
        <div className="p-8 space-y-6">
            <div className="no-print bg-neutral/5 p-6 rounded-xl border border-border flex justify-center items-end gap-4">
                <div className="space-y-2">
                    <label className="text-xs font-bold flex items-center gap-2"><Calendar className="w-3 h-3"/> التاريخ</label>
                    <input type="date" value={date} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDate(e.target.value)} className="w-full p-2 border rounded-md" />
                </div>
            </div>

            {/* Screen View */}
            <div className="no-print space-y-8">
                <ReportHeader title="الميزانية العمومية (Balance Sheet)" subtitle={`كما في ${date}`} />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-card p-8 rounded-2xl border border-border">
                    {/* Assets */}
                    <section className="space-y-4">
                        <h3 className="text-primary font-black border-b-2 border-primary pb-2 text-lg">الأصول (Assets)</h3>
                        <div className="space-y-2">
                            {data.assets.map((a: any) => (
                                <div key={a.no} className="flex justify-between py-2 border-b border-border/30 text-sm hover:bg-neutral/5 px-2 rounded">
                                    <span>{a.name}</span>
                                    <span className="font-mono">{formatCurrency(Math.abs(a.balance))}</span>
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-between py-4 font-black bg-primary/10 px-4 rounded-lg text-primary-dark mt-4">
                            <span>إجمالي الأصول</span>
                            <span className="font-mono">{formatCurrency(data.totalAssets)}</span>
                        </div>
                    </section>

                    <div className="space-y-8">
                        {/* Liabilities */}
                        <section className="space-y-4">
                            <h3 className="text-danger font-black border-b-2 border-danger pb-2 text-lg">الالتزامات (Liabilities)</h3>
                            <div className="space-y-2">
                                {data.liabilities.map((l: any) => (
                                    <div key={l.no} className="flex justify-between py-2 border-b border-border/30 text-sm hover:bg-neutral/5 px-2 rounded">
                                        <span>{l.name}</span>
                                        <span className="font-mono">{formatCurrency(Math.abs(l.balance))}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="flex justify-between py-4 font-black bg-danger/10 px-4 rounded-lg text-danger-dark mt-4">
                                <span>إجمالي الالتزامات</span>
                                <span className="font-mono">{formatCurrency(data.totalLiabilities)}</span>
                            </div>
                        </section>
                        
                        {/* Equity */}
                        <section className="space-y-4">
                            <h3 className="text-indigo-600 font-black border-b-2 border-indigo-600 pb-2 text-lg">حقوق الملكية (Equity)</h3>
                            <div className="space-y-2">
                                {data.equity.map((e: any) => (
                                    <div key={e.no} className="flex justify-between py-2 border-b border-border/30 text-sm hover:bg-neutral/5 px-2 rounded">
                                        <span>{e.name}</span>
                                        <span className="font-mono">{formatCurrency(Math.abs(e.balance))}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="flex justify-between py-4 font-black bg-indigo-50 px-4 rounded-lg text-indigo-800 mt-4">
                                <span>إجمالي حقوق الملكية</span>
                                <span className="font-mono">{formatCurrency(data.totalEquity)}</span>
                            </div>
                        </section>

                        <div className="pt-4 border-t-2 border-heading">
                            <div className="flex justify-between items-center p-4 bg-heading/5 rounded-lg font-black">
                                <span>إجمالي الالتزامات وحقوق الملكية</span>
                                <span className="font-mono">{formatCurrency(data.totalLiabilities + data.totalEquity)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end">
                    <ExportButtons 
                        data={[...data.assets, ...data.liabilities, ...data.equity]} 
                        filename={`Balance_Sheet_${date}`} 
                        onPrint={handlePrint} 
                    />
                </div>
            </div>

            {/* Print View */}
            <div className="hidden print:block">
                <PrintTemplate title="الميزانية العمومية" subtitle={`كما في ${date}`}>
                    <div className="grid grid-cols-2 gap-8">
                        {/* Assets Column */}
                        <div>
                            <h3 className="font-bold border-b-2 border-gray-300 pb-1 mb-2 text-lg">الأصول</h3>
                            <table className="w-full text-sm mb-4">
                                <tbody>
                                    {data.assets.map((a: any) => (
                                        <tr key={a.no} className="border-b border-gray-100">
                                            <td className="py-1">{a.name}</td>
                                            <td className="py-1 text-left font-mono">{formatCurrency(Math.abs(a.balance))}</td>
                                        </tr>
                                    ))}
                                    <tr className="bg-gray-100 font-bold">
                                        <td className="py-2 px-2">إجمالي الأصول</td>
                                        <td className="py-2 px-2 text-left font-mono">{formatCurrency(data.totalAssets)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* Liabilities & Equity Column */}
                        <div className="space-y-8">
                            <div>
                                <h3 className="font-bold border-b-2 border-gray-300 pb-1 mb-2 text-lg">الالتزامات</h3>
                                <table className="w-full text-sm mb-4">
                                    <tbody>
                                        {data.liabilities.map((l: any) => (
                                            <tr key={l.no} className="border-b border-gray-100">
                                                <td className="py-1">{l.name}</td>
                                                <td className="py-1 text-left font-mono">{formatCurrency(Math.abs(l.balance))}</td>
                                            </tr>
                                        ))}
                                        <tr className="bg-gray-100 font-bold">
                                            <td className="py-2 px-2">إجمالي الالتزامات</td>
                                            <td className="py-2 px-2 text-left font-mono">{formatCurrency(data.totalLiabilities)}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            <div>
                                <h3 className="font-bold border-b-2 border-gray-300 pb-1 mb-2 text-lg">حقوق الملكية</h3>
                                <table className="w-full text-sm mb-4">
                                    <tbody>
                                        {data.equity.map((e: any) => (
                                            <tr key={e.no} className="border-b border-gray-100">
                                                <td className="py-1">{e.name}</td>
                                                <td className="py-1 text-left font-mono">{formatCurrency(Math.abs(e.balance))}</td>
                                            </tr>
                                        ))}
                                        <tr className="bg-gray-100 font-bold">
                                            <td className="py-2 px-2">إجمالي حقوق الملكية</td>
                                            <td className="py-2 px-2 text-left font-mono">{formatCurrency(data.totalEquity)}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            <div className="border-t-2 border-black pt-2">
                                <div className="flex justify-between font-black text-sm">
                                    <span>إجمالي الالتزامات وحقوق الملكية</span>
                                    <span className="font-mono">{formatCurrency(data.totalLiabilities + data.totalEquity)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </PrintTemplate>
            </div>
        </div>
    );
};

export default BalanceSheet;
