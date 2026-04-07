
import React, { useState } from 'react';
import Card from '../../../components/ui/Card';
import PageHeader from '../../../components/ui/PageHeader';
import Tabs from '../../../components/ui/Tabs';

// Lazy load views for performance
const ReceiptsViewLazy = React.lazy(() => import('../components/ReceiptsView'));
const ExpensesViewLazy = React.lazy(() => import('../components/ExpensesView'));
const DepositsViewLazy = React.lazy(() => import('../components/DepositsView'));
const OwnerSettlementsViewLazy = React.lazy(() => import('../components/OwnerSettlementsView'));
const UtilityServicesViewLazy = React.lazy(() => import('../components/UtilityServicesView'));

const Financials: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'receipts' | 'expenses' | 'deposits' | 'settlements' | 'utilities'>('receipts');
    
    return (
        <div className="space-y-8">
            <PageHeader title="الخزينة والمالية" description="إدارة السندات، المصروفات، والتحويلات المالية للملاك والمستأجرين." />
            <Card className="p-8 rounded-3xl shadow-sm">
                <Tabs 
                    tabs={[
                        { id: 'receipts', label: 'سندات القبض' },
                        { id: 'expenses', label: 'المصروفات' },
                        { id: 'utilities', label: 'الخدمات والمرافق' },
                        { id: 'deposits', label: 'الودائع والتأمين' },
                        { id: 'settlements', label: 'تسويات الملاك' }
                    ]}
                    activeTab={activeTab}
                    onTabClick={(id) => setActiveTab(id as any)}
                />
                <div className="pt-8">
                    <React.Suspense fallback={
                        <div className="flex-1 flex items-center justify-center p-20">
                            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        </div>
                    }>
                        {activeTab === 'receipts' && <ReceiptsViewLazy />}
                        {activeTab === 'expenses' && <ExpensesViewLazy />}
                        {activeTab === 'utilities' && <UtilityServicesViewLazy />}
                        {activeTab === 'deposits' && <DepositsViewLazy />}
                        {activeTab === 'settlements' && <OwnerSettlementsViewLazy />}
                    </React.Suspense>
                </div>
            </Card>
        </div>
    );
};

export default Financials;
