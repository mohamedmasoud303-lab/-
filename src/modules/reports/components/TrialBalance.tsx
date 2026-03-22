import React, { useState, useMemo } from 'react';
import { useApp } from '../../../contexts/AppContext';
import { formatCurrency } from '../../../utils/helpers';
import ReportHeader from './ReportHeader';
import ExportButtons from './ExportButtons';
import PrintTemplate from '../../../components/print/PrintTemplate';
import { Calendar } from 'lucide-react';

const TrialBalance: React.FC = () => {
    const { db } = useApp();
    const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
    
    const data = useMemo(() => {
        if (!db) return [];
        const end = new Date(date);
        const balances = new Map<string, number>();
        
        // Initialize balances
        db.accounts.forEach((acc: any) => balances.set(acc.id, 0));

        // Calculate balances
        db.journalEntries.forEach((je: any) => {
            if (new Date(je.date) <= end) {
                const currentBalance = balances.get(je.accountId) || 0;
                const amount = je.type === 'DEBIT' ? je.amount : -je.amount;
                balances.set(je.accountId, currentBalance + amount);
            }
        });

        // Map to display format
        return db.accounts.map((acc: any) => {
            const balance = balances.get(acc.id) || 0;
            return {
                id: acc.id,
                no: acc.no,
                name: acc.name,
                debit: balance > 0 ? balance : 0,
                credit: balance < 0 ? Math.abs(balance) : 0,
            };
        }).filter((a: any) => a.debit !== 0 || a.credit !== 0);
    }, [db, date]);

    const handlePrint = () => window.print();

    const totalDebit = data.reduce((s: number, r: any) => s + r.debit, 0);
    const totalCredit = data.reduce((s: number, r: any) => s + r.credit, 0);

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
                <ReportHeader title="ميزان المراجعة (Trial Balance)" subtitle={`كما في ${date}`} />

                <div className="overflow-x-auto bg-card rounded-xl border border-border">
                    <table className="w-full text-sm border-collapse">
                        <thead>
                            <tr className="bg-neutral/5 border-b border-border">
                                <th className="p-3 text-right">رقم الحساب</th>
                                <th className="p-3 text-right">اسم الحساب</th>
                                <th className="p-3 text-right">مدين</th>
                                <th className="p-3 text-right">دائن</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((row: any, i: number) => (
                                <tr key={i} className="border-b border-border/50 hover:bg-neutral/5">
                                    <td className="p-3 font-mono">{row.no}</td>
                                    <td className="p-3 font-bold">{row.name}</td>
                                    <td className="p-3 font-mono text-danger">{row.debit > 0 ? formatCurrency(row.debit) : '-'}</td>
                                    <td className="p-3 font-mono text-success">{row.credit > 0 ? formatCurrency(row.credit) : '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="bg-neutral/5 font-black border-t-2 border-border">
                            <tr>
                                <td className="p-3" colSpan={2}>الإجمالي</td>
                                <td className="p-3 font-mono text-danger">{formatCurrency(totalDebit)}</td>
                                <td className="p-3 font-mono text-success">{formatCurrency(totalCredit)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                <div className="flex justify-end">
                    <ExportButtons 
                        data={data} 
                        filename={`Trial_Balance_${date}`} 
                        onPrint={handlePrint} 
                    />
                </div>
            </div>

            {/* Print View */}
            <div className="hidden print:block">
                <PrintTemplate title="ميزان المراجعة" subtitle={`كما في ${date}`}>
                    <table className="w-full text-xs border-collapse border border-gray-300">
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="border p-2">رقم الحساب</th>
                                <th className="border p-2">اسم الحساب</th>
                                <th className="border p-2">مدين</th>
                                <th className="border p-2">دائن</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((row: any, i: number) => (
                                <tr key={i}>
                                    <td className="border p-2 font-mono">{row.no}</td>
                                    <td className="border p-2">{row.name}</td>
                                    <td className="border p-2 font-mono">{row.debit > 0 ? formatCurrency(row.debit) : '-'}</td>
                                    <td className="border p-2 font-mono">{row.credit > 0 ? formatCurrency(row.credit) : '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="bg-gray-100 font-bold">
                            <tr>
                                <td className="border p-2" colSpan={2}>الإجمالي</td>
                                <td className="border p-2 font-mono">{formatCurrency(totalDebit)}</td>
                                <td className="border p-2 font-mono">{formatCurrency(totalCredit)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </PrintTemplate>
            </div>
        </div>
    );
};

export default TrialBalance;
