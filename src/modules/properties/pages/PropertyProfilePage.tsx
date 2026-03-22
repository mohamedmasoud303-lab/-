import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../../../contexts/AppContext';
import PageHeader from '../../../components/ui/PageHeader';
import Card from '../../../components/ui/Card';
import ExecutiveKpiCard from '../../../components/ui/ExecutiveKpiCard';
import { ArrowLeft, Building, Home, DollarSign, FileText, Wrench, AlertCircle } from 'lucide-react';
import { formatCurrency } from '../../../utils/helpers';
import StatusPill from '../../../components/ui/StatusPill';
import { motion } from 'motion/react';

const PropertyProfilePage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { db } = useApp();

    const property = useMemo(() => db.properties.find(p => p.id === id), [db.properties, id]);
    const units = useMemo(() => db.units.filter(u => u.propertyId === id), [db.units, id]);
    const contracts = useMemo(() => db.contracts.filter(c => units.some(u => u.id === c.unitId) && c.status === 'ACTIVE'), [db.contracts, units]);
    const income = useMemo(() => db.receipts.filter(r => contracts.some(c => c.id === r.contractId)).reduce((sum, r) => sum + r.amount, 0), [db.receipts, contracts]);
    const expenses = useMemo(() => db.expenses.filter(e => e.propertyId === id).reduce((sum, e) => sum + e.amount, 0), [db.expenses, id]);
    const maintenance = useMemo(() => db.maintenanceRecords.filter(m => units.some(u => u.id === m.unitId)), [db.maintenanceRecords, units]);
    const arrears = useMemo(() => contracts.reduce((sum, c) => sum + (db.contractBalances.find(cb => cb.contractId === c.id)?.balance || 0), 0), [contracts, db.contractBalances]);

    const stats = useMemo(() => {
        const totalUnits = units.length;
        const occupiedUnits = contracts.length;
        const occupancyRate = totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 0;
        
        return {
            totalUnits,
            occupiedUnits,
            occupancyRate,
            income,
            expenses,
            netIncome: income - expenses,
            arrears
        };
    }, [units, contracts, income, expenses, arrears]);

    if (!property) return (
        <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
            <AlertCircle size={48} className="mb-4 opacity-20" />
            <p>العقار غير موجود</p>
            <button onClick={() => navigate('/properties')} className="mt-4 text-primary hover:underline">العودة للعقارات</button>
        </div>
    );

    return (
        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8 pb-12"
        >
            <PageHeader 
                title={property.name} 
                description={property.location}
                icon={<Building className="text-primary" />}
            >
                <button 
                    onClick={() => navigate('/properties')} 
                    className="btn btn-secondary flex items-center gap-2 rounded-xl shadow-sm"
                >
                    <ArrowLeft size={16}/> العودة
                </button>
            </PageHeader>

            {/* Executive Summary Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <ExecutiveKpiCard
                    title="نسبة الإشغال"
                    value={`${stats.occupancyRate.toFixed(1)}%`}
                    icon={<Home size={20} />}
                    trend={{ value: `${stats.occupiedUnits}/${stats.totalUnits}`, isPositive: true }}
                    variant="indigo"
                />
                <ExecutiveKpiCard
                    title="إجمالي الإيرادات"
                    value={formatCurrency(stats.income)}
                    icon={<DollarSign size={20} />}
                    variant="emerald"
                />
                <ExecutiveKpiCard
                    title="إجمالي المصروفات"
                    value={formatCurrency(stats.expenses)}
                    icon={<FileText size={20} />}
                    variant="rose"
                />
                <ExecutiveKpiCard
                    title="المتأخرات"
                    value={formatCurrency(stats.arrears)}
                    icon={<AlertCircle size={20} />}
                    variant="amber"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Units Overview */}
                <Card className="lg:col-span-2 p-8 rounded-3xl shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="font-black text-xl tracking-tight flex items-center gap-3">
                            <Home size={22} className="text-primary" />
                            الوحدات السكنية
                        </h3>
                        <span className="text-xs font-bold text-muted-foreground bg-secondary px-4 py-1.5 rounded-full uppercase tracking-widest">
                            {units.length} وحدة
                        </span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border text-muted-foreground text-right">
                                    <th className="pb-4 font-bold uppercase tracking-widest text-[11px]">الوحدة</th>
                                    <th className="pb-4 font-bold uppercase tracking-widest text-[11px]">النوع</th>
                                    <th className="pb-4 font-bold uppercase tracking-widest text-[11px]">الحالة</th>
                                    <th className="pb-4 font-bold uppercase tracking-widest text-[11px] text-left">الإيجار</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {units.map(u => {
                                    const isOccupied = contracts.some(c => c.unitId === u.id);
                                    return (
                                        <tr key={u.id} className="hover:bg-muted/50 transition-colors">
                                            <td className="py-5 font-bold text-heading">{u.name}</td>
                                            <td className="py-5 text-muted-foreground">{u.type}</td>
                                            <td className="py-5">
                                                <StatusPill status={isOccupied ? 'OCCUPIED' : 'AVAILABLE'}>
                                                    {isOccupied ? 'مؤجرة' : 'شاغرة'}
                                                </StatusPill>
                                            </td>
                                            <td className="py-5 text-left font-mono font-bold text-heading">{formatCurrency(u.rentDefault)}</td>
                                        </tr>
                                    );
                                })}
                                {units.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="py-12 text-center text-muted-foreground italic">لا توجد وحدات مضافة لهذا العقار</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>

                {/* Sidebar Info */}
                <div className="space-y-8">
                    {/* Maintenance Summary */}
                    <Card className="p-8 rounded-3xl shadow-sm">
                        <h3 className="font-black text-xl tracking-tight mb-6 flex items-center gap-3">
                            <Wrench size={20} className="text-amber-500" />
                            سجل الصيانة
                        </h3>
                        <div className="space-y-6">
                            {maintenance.length > 0 ? (
                                <ul className="space-y-5">
                                    {maintenance.slice(0, 5).map(m => (
                                        <li key={m.id} className="flex items-start gap-3 border-b border-dashed border-border pb-4 last:border-0 last:pb-0">
                                            <div className="w-2 h-2 rounded-full bg-amber-500 mt-2 shrink-0" />
                                            <div className="flex-1 truncate">
                                                <p className="truncate font-bold text-heading">{m.description}</p>
                                                <div className="flex justify-between items-center mt-1.5">
                                                    <p className="text-[11px] text-muted-foreground">{m.requestDate}</p>
                                                    <p className="text-[11px] font-black text-amber-600">{formatCurrency(m.cost)}</p>
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-center py-4 text-muted-foreground italic text-sm">لا توجد سجلات صيانة</p>
                            )}
                        </div>
                    </Card>

                    {/* Financial Summary Card */}
                    <Card className="bg-primary text-primary-foreground p-8 rounded-3xl shadow-brand">
                        <h3 className="font-black text-xl tracking-tight mb-6">صافي الدخل</h3>
                        <div className="space-y-4">
                            <div className="flex justify-between text-sm opacity-80 font-medium">
                                <span>الإيرادات</span>
                                <span>{formatCurrency(stats.income)}</span>
                            </div>
                            <div className="flex justify-between text-sm opacity-80 font-medium">
                                <span>المصروفات</span>
                                <span>-{formatCurrency(stats.expenses)}</span>
                            </div>
                            <div className="border-t border-primary-foreground/20 pt-4 mt-4 flex justify-between items-end">
                                <span className="text-sm font-bold">الصافي</span>
                                <span className="text-3xl font-black">{formatCurrency(stats.netIncome)}</span>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </motion.div>
    );
};

export default PropertyProfilePage;
