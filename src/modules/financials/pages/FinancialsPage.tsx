
import React, { useState } from 'react';
import Card from '../../../components/ui/Card';
import PageHeader from '../../../components/ui/PageHeader';
import Tabs from '../../../components/ui/Tabs';
import ReceiptsView from '../components/ReceiptsView';
import ExpensesView from '../components/ExpensesView';
import DepositsView from '../components/DepositsView';
import OwnerSettlementsView from '../components/OwnerSettlementsView';
import UtilityServicesView from '../components/UtilityServicesView';

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
                    {activeTab === 'receipts' && <ReceiptsView />}
                    {activeTab === 'expenses' && <ExpensesView />}
                    {activeTab === 'utilities' && <UtilityServicesView />}
                    {activeTab === 'deposits' && <DepositsView />}
                    {activeTab === 'settlements' && <OwnerSettlementsView />}
                </div>
            </Card>
        </div>
    );
};

export default Financials;
