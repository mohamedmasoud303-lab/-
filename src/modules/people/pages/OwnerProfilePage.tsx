import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../../../contexts/AppContext';
import PageHeader from '../../../components/ui/PageHeader';
import Card from '../../../components/ui/Card';
import ExecutiveKpiCard from '../../../components/ui/ExecutiveKpiCard';
import { ArrowLeft, Building, DollarSign, BookOpen, Link as LinkIcon, Users, Wallet, TrendingUp, AlertCircle } from 'lucide-react';
import { formatCurrency } from '../../../utils/helpers';
import StatusPill from '../../../components/ui/StatusPill';
import { toast } from 'react-hot-toast';
import { motion } from 'motion/react';

const OwnerProfilePage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { db, generateOwnerPortalLink } = useApp();

    const owner = useMemo(() => db.owners.find(o => o.id === id), [db.owners, id]);
    const properties = useMemo(() => db.properties.filter(p => p.ownerId === id), [db.properties, id]);
    const units = useMemo(() => db.units.filter(u => properties.some(p => p.id === u.propertyId)), [db.units, properties]);
    const contracts = useMemo(() => db.contracts.filter(c => units.some(u => u.id === c.unitId)), [db.contracts, units]);
    const receipts = useMemo(() => db.receipts.filter(r => contracts.some(c => c.id === r.contractId)), [db.receipts, contracts]);
    const expenses = useMemo(() => db.expenses.filter(e => properties.some(p => p.id === e.propertyId)), [db.expenses, properties]);

    const stats = useMemo(() => {
        const totalIncome = receipts.reduce((sum, r) => sum + r.amount, 0);
        const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
        const netIncome = totalIncome - totalExpenses;
        const totalProperties = properties.length;
        const totalUnits = units.length;
        const occupancyRate = totalUnits > 0 ? (units.filter(u => u.status === 'OCCUPIED').length / totalUnits) * 100 : 0;

        return {
            totalIncome,
            totalExpenses,
            netIncome,
            totalProperties,
            totalUnits,
            occupancyRate
        };
    }, [receipts, expenses, properties, units]);

    if (!owner) return (
        <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
            <AlertCircle size={48} className="mb-4 opacity-20" />
            <p>المالك غير موجود</p>
            <button onClick={() => navigate('/people')} className="mt-4 text-primary hover:underline">العودة للأشخاص</button>
        </div>
    );

    return (
        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8 pb-12"
        >
            <PageHeader title={owner.name} description={`هاتف: ${owner.phone}`} icon={<Users className="text-primary" />}>
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate('/people')} className="btn btn-secondary flex items-center gap-2 rounded-xl">
                        <ArrowLeft size={16}/> العودة
                    </button>
                    <button 
                        onClick={async () => {
                            const link = await generateOwnerPortalLink(owner.id);
                            navigator.clipboard.writeText(link);
                            toast.success("تم نسخ رابط المالك!");
                        }}
                        className="btn btn-primary flex items-center gap-2 rounded-xl shadow-brand"
                    >
                        <LinkIcon size={16} /> رابط المالك
                    </button>
                </div>
            </PageHeader>

            {/* Executive Summary Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <ExecutiveKpiCard
                    title="صافي المستحقات"
                    value={formatCurrency(stats.netIncome)}
                    icon={<Wallet size={20} />}
                    variant="indigo"
                />
                <ExecutiveKpiCard
                    title="إجمالي الإيرادات"
                    value={formatCurrency(stats.totalIncome)}
                    icon={<TrendingUp size={20} />}
                    variant="emerald"
                />
                <ExecutiveKpiCard
                    title="إجمالي المصروفات"
                    value={formatCurrency(stats.totalExpenses)}
                    icon={<DollarSign size={20} />}
                    variant="rose"
                />
                <ExecutiveKpiCard
                    title="نسبة الإشغال"
                    value={`${stats.occupancyRate.toFixed(1)}%`}
                    icon={<Building size={20} />}
                    trend={{ value: `${stats.totalProperties} عقار`, isPositive: true }}
                    variant="amber"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Properties List */}
                <Card className="lg:col-span-2 p-8 rounded-3xl shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-xl font-black text-heading tracking-tight flex items-center gap-3">
                            <Building size={22} className="text-primary" />
                            العقارات المملوكة
                        </h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border text-muted-foreground text-right">
                                    <th className="pb-4 font-bold uppercase tracking-widest text-[11px]">العقار</th>
                                    <th className="pb-4 font-bold uppercase tracking-widest text-[11px]">الموقع</th>
                                    <th className="pb-4 font-bold uppercase tracking-widest text-[11px] text-center">الوحدات</th>
                                    <th className="pb-4 font-bold uppercase tracking-widest text-[11px] text-left">الإيرادات</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {properties.map(p => {
                                    const propUnits = units.filter(u => u.propertyId === p.id);
                                    const propReceipts = receipts.filter(r => contracts.some(c => c.id === r.contractId && propUnits.some(u => u.id === c.unitId)));
                                    const propIncome = propReceipts.reduce((sum, r) => sum + r.amount, 0);
                                    
                                    return (
                                        <tr key={p.id} className="group hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => navigate(`/properties/${p.id}`)}>
                                            <td className="py-5 font-bold text-heading">{p.name}</td>
                                            <td className="py-5 text-muted-foreground font-medium">{p.location}</td>
                                            <td className="py-5 text-center font-mono font-bold text-heading">{propUnits.length}</td>
                                            <td className="py-5 text-left font-mono font-black text-emerald-600">{formatCurrency(propIncome)}</td>
                                        </tr>
                                    );
                                })}
                                {properties.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="py-12 text-center text-muted-foreground font-bold italic">لا توجد عقارات مرتبطة بهذا المالك</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>

                {/* Recent Activity / Settlements */}
                <Card className="p-8 rounded-3xl shadow-sm">
                    <h3 className="text-xl font-black text-heading tracking-tight mb-8 flex items-center gap-3">
                        <BookOpen size={22} className="text-primary" />
                        آخر التحصيلات
                    </h3>
                    <div className="space-y-6">
                        {receipts.slice(0, 8).map(r => (
                            <div key={r.id} className="flex justify-between items-center text-sm border-b border-border pb-4 last:border-0 last:pb-0">
                                <div className="flex flex-col gap-1">
                                    <span className="font-bold text-heading">تحصيل إيجار</span>
                                    <span className="text-[11px] font-medium text-muted-foreground tracking-widest uppercase">{r.dateTime}</span>
                                </div>
                                <span className="font-mono font-black text-emerald-600">{formatCurrency(r.amount)}</span>
                            </div>
                        ))}
                        {receipts.length === 0 && (
                            <p className="text-center py-8 text-sm text-muted-foreground font-bold italic">لا توجد تحصيلات مسجلة</p>
                        )}
                    </div>
                </Card>
            </div>
        </motion.div>
    );
};

export default OwnerProfilePage;
