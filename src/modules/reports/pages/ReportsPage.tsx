
import React, { useState, useMemo } from 'react';
import { useApp } from '../../../contexts/AppContext';
import Card from '../../../components/ui/Card';
import { 
    TrendingUp, Wallet, Users, FileBarChart, 
    History, Calculator, Scale, ChevronLeft, Building2
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import PageHeader from '../../../components/ui/PageHeader';
import ReportCard from '../components/ReportCard';
import OwnerStatementView from '../components/OwnerStatementView';
import TenantStatementView from '../components/TenantStatementView';
import UnitLedgerView from '../components/UnitLedgerView';
import CollectionsReportView from '../components/CollectionsReportView';
import MaintenanceReportView from '../components/MaintenanceReportView';
import IncomeStatement from '../components/IncomeStatement';
import BalanceSheet from '../components/BalanceSheet';
import TrialBalance from '../components/TrialBalance';
import AgingReportView from '../components/AgingReportView';
import VacancyReportView from '../components/VacancyReportView';
import PropertyStatementView from '../components/PropertyStatementView';

type ReportTab = 'rent_roll' | 'owner' | 'tenant' | 'property' | 'income_statement' | 'trial_balance' | 'balance_sheet' | 'aging' | 'unit_ledger' | 'collections' | 'maintenance' | 'vacancy';

const Reports: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { db } = useApp();
    const queryParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
    const [activeTab, setActiveTab] = useState<ReportTab | null>(queryParams.get('tab') as ReportTab | null);

    if (!db) return null;

    const handleTabChange = (tab: ReportTab | null) => {
        setActiveTab(tab);
        if (tab) navigate(`/reports?tab=${tab}`);
        else navigate('/reports');
    };

    return (
        <div className="space-y-8">
            {!activeTab ? (
                <>
                    <PageHeader title="مركز التقارير والذكاء المالي" description="تقارير تحليلية شاملة للتدقيق والرقابة المالية." />
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <ReportCard title="كشف حساب مالك" subtitle="تفصيلي لحصص الملاك وصافي مستحقاتهم." icon={<Wallet />} onClick={() => handleTabChange('owner')} />
                        <ReportCard title="كشف حساب عقار" subtitle="تحليل مالي شامل للعقار (إيرادات، مصروفات، إشغال)." icon={<Building2 />} onClick={() => handleTabChange('property')} />
                        <ReportCard title="كشف حساب مستأجر" subtitle="تحليل مديونية المستأجر والتحصيلات." icon={<Users />} onClick={() => handleTabChange('tenant')} />
                        <ReportCard title="كشف حركة وحدة" subtitle="سجل تاريخي للإشغال والتحصيلات والمصاريف." icon={<Building2 />} onClick={() => handleTabChange('unit_ledger')} />
                        <ReportCard title="تقرير التحصيلات" subtitle="تحليل التدفقات النقدية والديون المتأخرة." icon={<TrendingUp />} onClick={() => handleTabChange('collections')} />
                        <ReportCard title="تقرير الصيانة" subtitle="تحليل تكاليف الصيانة حسب العقار والوحدة." icon={<FileBarChart />} onClick={() => handleTabChange('maintenance')} />
                        <ReportCard title="تقرير الوحدات الشاغرة" subtitle="تحليل الإشغال والوحدات المتاحة." icon={<Building2 />} onClick={() => handleTabChange('vacancy')} />
                        <ReportCard title="أعمار الذمم (Aging)" subtitle="تحليل ديون المستأجرين حسب مدة التأخير." icon={<History />} onClick={() => handleTabChange('aging')} />
                        <ReportCard title="الأرباح والخسائر" subtitle="صافي دخل المكتب والعمولات التشغيلية." icon={<TrendingUp />} onClick={() => handleTabChange('income_statement')} />
                        <ReportCard title="الميزانية العمومية" subtitle="تقرير الأصول والخصوم وحقوق الملكية." icon={<Scale />} onClick={() => handleTabChange('balance_sheet')} />
                        <ReportCard title="ميزان المراجعة" subtitle="توازن الحسابات المدينة والدائنة بالكامل." icon={<Calculator />} onClick={() => handleTabChange('trial_balance')} />
                    </div>
                </>
            ) : (
                <div className="space-y-6 animate-in slide-in-from-bottom-2">
                    <button onClick={() => handleTabChange(null)} className="flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-primary transition-colors uppercase tracking-widest">
                        <ChevronLeft className="w-4 h-4" /> العودة لمركز التقارير
                    </button>
                    <Card className="min-h-[600px] p-0 rounded-3xl shadow-sm overflow-hidden">
                        {activeTab === 'owner' && <OwnerStatementView />}
                        {activeTab === 'property' && <PropertyStatementView />}
                        {activeTab === 'tenant' && <TenantStatementView />}
                        {activeTab === 'unit_ledger' && <UnitLedgerView />}
                        {activeTab === 'collections' && <CollectionsReportView />}
                        {activeTab === 'maintenance' && <MaintenanceReportView />}
                        {activeTab === 'vacancy' && <VacancyReportView />}
                        {activeTab === 'income_statement' && <IncomeStatement />}
                        {activeTab === 'balance_sheet' && <BalanceSheet />}
                        {activeTab === 'trial_balance' && <TrialBalance />}
                        {activeTab === 'aging' && <AgingReportView />}
                    </Card>
                </div>
            )}
        </div>
    );
};

export default Reports;
