
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Settings as SettingsIcon, Users as UsersIcon, Database, 
  SearchCheck, Activity, History 
} from 'lucide-react';

import PageHeader from '../../../components/ui/PageHeader';

// Lazy load sub-components for performance
const AuditLog = React.lazy(() => import('../../admin/pages/AuditLogPage'));
const DataIntegrityAudit = React.lazy(() => import('../../admin/pages/DataIntegrityAuditPage'));
const BackupManager = React.lazy(() => import('../../admin/pages/BackupPage'));
const Diagnostics = React.lazy(() => import('../../admin/pages/DiagnosticsPage'));
const CompanySettings = React.lazy(() => import('../components/CompanySettings'));
const FinancialSettings = React.lazy(() => import('../components/FinancialSettings'));
const UsersSettings = React.lazy(() => import('../components/UsersSettings'));

const Settings: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const queryParams = new URLSearchParams(location.search);
    const initialTab = queryParams.get('tab') || 'general';
    
    const [activeTab, setActiveTab] = useState<string>(initialTab);

    useEffect(() => {
        const tab = queryParams.get('tab');
        if (tab && tab !== activeTab) {
            setActiveTab(tab);
        }
    }, [location.search]);

    const handleTabChange = (id: string) => {
        setActiveTab(id);
        navigate(`/system?tab=${id}`, { replace: true });
    };
    
    return (
        <div className="space-y-6">
            <PageHeader 
                title="إعدادات النظام" 
                description="إدارة المستخدمين، السياسات المالية، وأدوات صيانة النظام." 
            />
            
            <div className="flex flex-col lg:flex-row gap-6">
                {/* Sidebar Tabs */}
                <div className="w-full lg:w-64 space-y-1">
                    <TabButton 
                        id="general" 
                        label="الإعدادات العامة" 
                        icon={<SettingsIcon size={18} />} 
                        active={activeTab === 'general'} 
                        onClick={handleTabChange} 
                    />
                    <TabButton 
                        id="users" 
                        label="المستخدمون والصلاحيات" 
                        icon={<UsersIcon size={18} />} 
                        active={activeTab === 'users'} 
                        onClick={handleTabChange} 
                    />
                    <div className="h-px bg-border my-4 mx-2"></div>
                    <TabButton 
                        id="backup" 
                        label="النسخ الاحتياطي" 
                        icon={<Database size={18} />} 
                        active={activeTab === 'backup'} 
                        onClick={handleTabChange} 
                    />
                    <TabButton 
                        id="integrity" 
                        label="سلامة البيانات" 
                        icon={<SearchCheck size={18} />} 
                        active={activeTab === 'integrity'} 
                        onClick={handleTabChange} 
                    />
                    <TabButton 
                        id="diagnostics" 
                        label="التشخيص والفحص" 
                        icon={<Activity size={18} />} 
                        active={activeTab === 'diagnostics'} 
                        onClick={handleTabChange} 
                    />
                    <TabButton 
                        id="audit" 
                        label="سجل التدقيق" 
                        icon={<History size={18} />} 
                        active={activeTab === 'audit'} 
                        onClick={handleTabChange} 
                    />
                </div>

                {/* Content Area */}
                <div className="flex-1 min-w-0">
                    <React.Suspense fallback={
                        <div className="flex-1 flex items-center justify-center p-20">
                            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        </div>
                    }>
                        {activeTab === 'general' && (
                            <div className="space-y-6 animate-in fade-in duration-300">
                                <CompanySettings />
                                <FinancialSettings />
                            </div>
                        )}
                        {activeTab === 'users' && <UsersSettings />}
                        {activeTab === 'backup' && <BackupManager />}
                        {activeTab === 'integrity' && <DataIntegrityAudit />}
                        {activeTab === 'diagnostics' && <Diagnostics />}
                        {activeTab === 'audit' && <AuditLog />}
                    </React.Suspense>
                </div>
            </div>
        </div>
    );
};

const TabButton: React.FC<{ id: string; label: string; icon: React.ReactNode; active: boolean; onClick: (id: string) => void }> = ({ id, label, icon, active, onClick }) => (
    <button 
        onClick={() => onClick(id)}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${
            active 
            ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20' 
            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
        }`}
    >
        {icon}
        <span>{label}</span>
    </button>
);

export default Settings;
