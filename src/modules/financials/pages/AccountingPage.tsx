
import React, { useState } from 'react';
import Card from '../../../components/ui/Card';
import PageHeader from '../../../components/ui/PageHeader';
import Tabs from '../../../components/ui/Tabs';
import ChartOfAccountsView from '../components/accounting/ChartOfAccountsView';
import JournalEntriesView from '../components/accounting/JournalEntriesView';

const Accounting: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'chartOfAccounts' | 'journalEntries'>('chartOfAccounts');

    return (
        <div className="space-y-6">
            <PageHeader title="المحاسبة العامة" description="إدارة شجرة الحسابات، قيود اليومية، والعمليات المحاسبية المركزية." />
            <Card>
                 <Tabs 
                    tabs={[
                        { id: 'chartOfAccounts', label: 'دليل الحسابات' },
                        { id: 'journalEntries', label: 'قيود اليومية' }
                    ]}
                    activeTab={activeTab}
                    onTabClick={(id) => setActiveTab(id as any)}
                />
                <div className="pt-6">
                    {activeTab === 'chartOfAccounts' && <ChartOfAccountsView />}
                    {activeTab === 'journalEntries' && <JournalEntriesView />}
                </div>
            </Card>
        </div>
    );
};

export default Accounting;
