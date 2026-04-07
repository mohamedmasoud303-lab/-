
import React, { useMemo } from 'react';
import { useApp } from 'contexts/AppContext';
import { formatCurrency, toArabicDigits, formatDate } from 'utils/helpers';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, Users, FileText, Receipt, Wrench, 
  AlertCircle, TrendingUp, RefreshCw, 
  Plus, Calendar, Clock,
  LayoutDashboard, BarChart3, PieChart as PieChartIcon,
  Briefcase, DollarSign, Home
} from 'lucide-react';
import PageHeader from 'components/ui/PageHeader';
import Card from 'components/ui/Card';
import SummaryStatCard from 'components/ui/SummaryStatCard';
import PerformanceRankList from '../components/PerformanceRankList';
import RiskRadarItem from '../components/RiskRadarItem';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import QuickActionBtn from '../components/QuickActionBtn';

const Dashboard: React.FC = () => {
    const { db, currentUser, rebuildFinancials } = useApp();
    const navigate = useNavigate();
    
    const stats = useMemo(() => {
        if (!db.settings) return null;
        const { units, contracts, contractBalances, receipts, expenses: dbExpenses, maintenanceRecords, tenants, properties, owners } = db;
        
        const totalUnits = units.length;
        const activeContracts = contracts.filter(c => c.status === 'ACTIVE');
        const vacantUnits = totalUnits - activeContracts.length;
        const occupancyRate = totalUnits > 0 ? (activeContracts.length / totalUnits) * 100 : 0;
        
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
        const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getTime();
        
        const monthlyCollection = receipts
            .filter(r => r.status === 'POSTED' && r.createdAt >= firstDayOfMonth && r.createdAt <= lastDayOfMonth)
            .reduce((s, r) => s + r.amount, 0);
            
        const monthlyExpenses = dbExpenses
            .filter(e => e.status === 'POSTED' && new Date(e.dateTime).getTime() >= firstDayOfMonth && new Date(e.dateTime).getTime() <= lastDayOfMonth)
            .reduce((s, e) => s + e.amount, 0);

        const totalArrears = contractBalances.reduce((s, b) => s + (b.balance > 0 ? b.balance : 0), 0);
        const openMaintenance = maintenanceRecords.filter(m => m.status === 'NEW' || m.status === 'IN_PROGRESS').length;
        const ownersWithActiveProperties = owners.filter(o => 
            properties.some(p => p.ownerId === o.id && units.some(u => u.propertyId === p.id && activeContracts.some(c => c.unitId === u.id)))
        ).length;

        const getTenantName = (tenantId: string) => tenants.find(t => t.id === tenantId)?.name || 'غير معروف';
        const getUnitNumber = (unitId: string) => units.find(u => u.id === unitId)?.name || 'غير معروف';

        const upcomingExpirations = contracts
            .filter(c => {
                if (c.status !== 'ACTIVE') return false;
                const endTime = new Date(c.end).getTime();
                const thirtyDaysFromNow = now.getTime() + (30 * 24 * 60 * 60 * 1000);
                return endTime <= thirtyDaysFromNow && endTime >= now.getTime();
            })
            .sort((a, b) => new Date(a.end).getTime() - new Date(b.end).getTime())
            .slice(0, 5)
            .map(c => ({ ...c, tenantName: getTenantName(c.tenantId), unitNumber: getUnitNumber(c.unitId) }));

        const overduePayments = contractBalances
            .filter(b => b.balance > 0)
            .sort((a, b) => b.balance - a.balance)
            .slice(0, 5)
            .map(b => ({ ...b, tenantName: getTenantName(b.tenantId), unitNumber: getUnitNumber(b.unitId) }));

        const cashflowData = Array.from({ length: 6 }).map((_, i) => {
            const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
            const monthStart = d.getTime();
            const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0).getTime();
            const monthName = d.toLocaleString('ar-EG', { month: 'short' });
            
            const income = receipts
                .filter(r => r.status === 'POSTED' && r.createdAt >= monthStart && r.createdAt <= monthEnd)
                .reduce((s, r) => s + r.amount, 0);
                
            const exp = dbExpenses
                .filter(e => e.status === 'POSTED' && new Date(e.dateTime).getTime() >= monthStart && new Date(e.dateTime).getTime() <= monthEnd)
                .reduce((s, e) => s + e.amount, 0);
                
            return { name: monthName, دخل: income, خرج: exp };
        });

        const topProperties = properties.map(p => {
            const pUnits = units.filter(u => u.propertyId === p.id);
            const pActive = pUnits.filter(u => activeContracts.some(c => c.unitId === u.id)).length;
            const rate = pUnits.length > 0 ? (pActive / pUnits.length) * 100 : 0;
            return {
                id: p.id,
                name: p.name,
                value: `%${toArabicDigits(Math.round(rate))}`,
                subValue: `${toArabicDigits(pUnits.length)} وحدة`,
                trend: rate > 90 ? 'up' : rate < 50 ? 'down' : 'neutral' as any
            };
        }).sort((a, b) => parseFloat(b.value.replace('%', '')) - parseFloat(a.value.replace('%', ''))).slice(0, 5);

        return { 
            totalUnits, vacantUnits, totalArrears, monthlyCollection, monthlyExpenses,
            occupancyRate, openMaintenance, ownersWithActiveProperties,
            upcomingExpirations, overduePayments, cashflowData,
            activeCount: activeContracts.length,
            topProperties
        };
    }, [db]);

    if (!stats) return (
        <div className="p-20 flex flex-col items-center justify-center gap-4 animate-pulse">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                <RefreshCw className="animate-spin text-muted-foreground" />
            </div>
            <p className="text-muted-foreground font-bold">جاري تحميل لوحة التحكم...</p>
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-700 pb-10">
            <PageHeader 
                title={`مرحباً، ${currentUser?.username}`} 
                description="إليك نظرة عامة على أداء محفظتك العقارية اليوم."
            >
                <button onClick={rebuildFinancials} className="btn btn-ghost flex items-center gap-2 text-xs">
                    <RefreshCw size={14} /> تحديث البيانات
                </button>
            </PageHeader>

            {/* 1. Executive KPI row */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <SummaryStatCard label="التحصيلات" value={formatCurrency(stats.monthlyCollection)} icon={<TrendingUp size={20}/>} color="success" />
                <SummaryStatCard label="المصروفات" value={formatCurrency(stats.monthlyExpenses)} icon={<Receipt size={20}/>} color="danger" />
                <SummaryStatCard label="نسبة الإشغال" value={`%${toArabicDigits(Math.round(stats.occupancyRate))}`} icon={<Building2 size={20}/>} color="info" />
                <SummaryStatCard label="وحدات شاغرة" value={toArabicDigits(stats.vacantUnits)} icon={<Home size={20}/>} color="warning" />
                <SummaryStatCard label="المتأخرات" value={formatCurrency(stats.totalArrears)} icon={<DollarSign size={20}/>} color="danger" />
                <SummaryStatCard label="عقود نشطة" value={toArabicDigits(stats.activeCount)} icon={<Briefcase size={20}/>} color="info" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* 2. Operational attention section */}
                <div className="lg:col-span-1 space-y-6">
                    <Card className="p-0 overflow-hidden">
                        <div className="p-4 bg-muted/50 border-b border-border flex items-center justify-between">
                            <h3 className="font-black text-xs uppercase tracking-widest flex items-center gap-2">
                                <AlertCircle size={14} className="text-primary" />
                                تنبيهات تشغيلية
                            </h3>
                        </div>
                        <div className="divide-y divide-border">
                            <div className="p-4 flex justify-between items-center hover:bg-muted/30 cursor-pointer" onClick={() => navigate('/contracts')}>
                                <span className="text-sm">عقود تنتهي قريباً</span>
                                <span className="font-black text-orange-600">{toArabicDigits(stats.upcomingExpirations.length)}</span>
                            </div>
                            <div className="p-4 flex justify-between items-center hover:bg-muted/30 cursor-pointer" onClick={() => navigate('/maintenance')}>
                                <span className="text-sm">طلبات صيانة مفتوحة</span>
                                <span className="font-black text-blue-600">{toArabicDigits(stats.openMaintenance)}</span>
                            </div>
                            <div className="p-4 flex justify-between items-center hover:bg-muted/30 cursor-pointer" onClick={() => navigate('/financials')}>
                                <span className="text-sm">جاهزية تصفية الملاك</span>
                                <span className="font-black text-green-600">{toArabicDigits(stats.ownersWithActiveProperties)}</span>
                            </div>
                        </div>
                    </Card>
                    
                    {/* 4. Quick actions */}
                    <Card className="p-6">
                        <h3 className="font-black mb-6 text-xs uppercase tracking-widest">إجراءات سريعة</h3>
                        <div className="grid grid-cols-2 gap-3">
                            <QuickActionBtn icon={<Plus size={18} />} label="عقد جديد" onClick={() => navigate('/contracts')} />
                            <QuickActionBtn icon={<Receipt size={18} />} label="سند قبض" onClick={() => navigate('/financials')} />
                            <QuickActionBtn icon={<Wrench size={18} />} label="طلب صيانة" onClick={() => navigate('/maintenance')} />
                            <QuickActionBtn icon={<BarChart3 size={18} />} label="التقارير" onClick={() => navigate('/reports')} />
                        </div>
                    </Card>
                </div>

                {/* 3. Performance insights */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="p-6">
                        <h3 className="font-black mb-6 text-xs uppercase tracking-widest flex items-center gap-2">
                            <BarChart3 size={16} className="text-primary" />
                            التدفق النقدي التاريخي
                        </h3>
                        <div className="h-[250px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={stats.cashflowData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} tickFormatter={(v) => toArabicDigits(v)} />
                                    <Tooltip contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '12px', fontSize: '12px' }} formatter={(v: any) => [formatCurrency(v), '']} />
                                    <Bar dataKey="دخل" fill="var(--primary)" radius={[4, 4, 0, 0]} barSize={24} />
                                    <Bar dataKey="خرج" fill="var(--muted-foreground)" opacity={0.2} radius={[4, 4, 0, 0]} barSize={24} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <PerformanceRankList 
                            title="أداء العقارات (نسبة الإشغال)" 
                            items={stats.topProperties} 
                            icon={<Building2 size={16} className="text-primary" />}
                            onItemClick={(item) => navigate(`/properties/${item.id}`)}
                        />
                        <Card className="p-0 overflow-hidden border-danger/20">
                            <div className="p-4 bg-danger/5 border-b border-danger/10 flex items-center justify-between">
                                <h3 className="font-black text-xs text-danger uppercase tracking-widest">متأخرات حرجة</h3>
                            </div>
                            <div className="divide-y divide-border">
                                {stats.overduePayments.map((p, i) => (
                                    <div key={i} className="p-4 flex justify-between items-center hover:bg-muted/50 cursor-pointer" onClick={() => navigate('/financials')}>
                                        <p className="font-bold text-sm truncate max-w-[150px]">{p.tenantName}</p>
                                        <span className="text-xs font-black text-danger">{formatCurrency(p.balance)}</span>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
