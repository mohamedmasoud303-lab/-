
import React, { useState, useMemo } from 'react';
import { useApp } from 'contexts/AppContext';
import { Owner, Tenant } from 'core/types';
import Card from 'components/ui/Card';
import ActionsMenu, { EditAction, DeleteAction } from 'components/shared/ActionsMenu';
import { MessageCircle, Users, BookOpen, Link as LinkIcon, PlusCircle } from 'lucide-react';
import { ConfirmDialog } from 'components/ui';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import StatusPill from 'components/ui/StatusPill';
import PageHeader from 'components/ui/PageHeader';
import Tabs from 'components/ui/Tabs';
import TableControls from 'components/shared/TableControls';

// Lazy load forms and modals for performance
const TenantForm = React.lazy(() => import('../components/TenantForm'));
const OwnerForm = React.lazy(() => import('../components/OwnerForm'));
const WhatsAppComposerModal = React.lazy(() => import('components/shared/WhatsAppComposerModal'));

const People: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'tenants' | 'owners'>('tenants');
    
    return (
        <div className="space-y-8">
            <PageHeader title="إدارة الأشخاص" description="إدارة بيانات الملاك والمستأجرين والتواصل معهم."/>
            <Card className="p-8 rounded-3xl shadow-sm">
                <Tabs 
                    tabs={[{id: 'tenants', label: 'المستأجرون'}, {id: 'owners', label: 'الملاك'}]}
                    activeTab={activeTab}
                    onTabClick={(id) => setActiveTab(id as any)}
                />
                <div className="pt-8">
                    {activeTab === 'tenants' && <TenantsView />}
                    {activeTab === 'owners' && <OwnersView />}
                </div>
            </Card>
        </div>
    );
};

// Tenants Component
const TenantsView: React.FC = () => {
    const { db, dataService } = useApp();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
    const [whatsAppContext, setWhatsAppContext] = useState<any | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [confirmDelete, setConfirmDelete] = useState<{ id: string, name: string } | null>(null);

    const { tenants, contracts } = db;

    const filteredTenants = useMemo(() => {
        return tenants.filter(t => {
            const matchesSearch = t.name.includes(searchTerm) || t.phone.includes(searchTerm) || t.idNo.includes(searchTerm);
            const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [tenants, searchTerm, statusFilter]);

    const handleOpenModal = (tenant: Tenant | null = null) => {
        setEditingTenant(tenant);
        setIsModalOpen(true);
    };

    const handleOpenWhatsAppModal = (person: Tenant) => {
        if (!person.phone) {
            toast.error('لا يوجد رقم هاتف لهذا الشخص.');
            return;
        }
        setWhatsAppContext({
            recipient: { name: person.name, phone: person.phone },
            type: 'tenant',
            data: { tenant: person }
        });
    };

    const handleCloseModals = () => {
        setIsModalOpen(false);
        setWhatsAppContext(null);
    };

    const handleDelete = (id: string) => {
        if (contracts.some(c => c.tenantId === id)) {
            toast.error("لا يمكن حذف المستأجر لأنه مرتبط بعقود. يرجى حذف العقود أولاً.");
            return;
        }
        dataService.remove('tenants', id);
    };
    
    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-xl font-black text-heading tracking-tight">قائمة المستأجرين</h2>
            </div>

            <TableControls
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                onAdd={() => handleOpenModal()}
                addLabel="إضافة مستأجر"
                onPrint={() => window.print()}
                filterOptions={[
                    { value: 'ALL', label: 'الكل' },
                    { value: 'ACTIVE', label: 'نشط' },
                    { value: 'INACTIVE', label: 'غير نشط' },
                    { value: 'BLACKLIST', label: 'قائمة سوداء' }
                ]}
                activeFilter={statusFilter}
                onFilterChange={setStatusFilter}
            />

            <div className="overflow-x-auto mt-8">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-border text-muted-foreground text-right">
                            <th className="pb-4 font-bold uppercase tracking-widest text-[11px]">الاسم</th>
                            <th className="pb-4 font-bold uppercase tracking-widest text-[11px]">الهاتف</th>
                            <th className="pb-4 font-bold uppercase tracking-widest text-[11px]">رقم الهوية</th>
                            <th className="pb-4 font-bold uppercase tracking-widest text-[11px]">الحالة</th>
                            <th className="pb-4 font-bold uppercase tracking-widest text-[11px] text-left">إجراءات</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {filteredTenants.map(t => (
                            <tr key={t.id} className="group hover:bg-muted/50 transition-colors">
                                <td className="py-5 font-bold text-heading">{t.name}</td>
                                <td className="py-5 text-muted-foreground font-medium">{t.phone}</td>
                                <td className="py-5 font-mono font-bold text-heading">{t.idNo}</td>
                                <td className="py-5">
                                    <StatusPill status={t.status}>
                                        {t.status === 'ACTIVE' ? 'نشط' : (t.status === 'BLACKLIST' ? 'قائمة سوداء' : 'غير نشط')}
                                    </StatusPill>
                                </td>
                                <td className="py-5 action-cell">
                                    <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                    <ActionsMenu items={[
                                        EditAction(() => handleOpenModal(t)),
                                        { label: 'مراسلة واتساب', icon: <MessageCircle size={16} />, onClick: () => handleOpenWhatsAppModal(t) },
                                        DeleteAction(() => setConfirmDelete({ id: t.id, name: t.name })),
                                    ]} />
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredTenants.length === 0 && <div className="text-center py-16 text-muted-foreground font-bold italic">لا يوجد مستأجرون مطابقون للبحث.</div>}
            </div>

            <React.Suspense fallback={null}>
                <TenantForm isOpen={isModalOpen} onClose={handleCloseModals} tenant={editingTenant} />
                <WhatsAppComposerModal isOpen={!!whatsAppContext} onClose={() => setWhatsAppContext(null)} context={whatsAppContext} />
            </React.Suspense>
            
            <ConfirmDialog
                isOpen={!!confirmDelete}
                onClose={() => setConfirmDelete(null)}
                onConfirm={() => confirmDelete && handleDelete(confirmDelete.id)}
                title="تأكيد حذف المستأجر"
                message={`هل أنت متأكد من حذف المستأجر "${confirmDelete?.name}"؟`}
            />
        </div>
    );
};

// Owners Component
const OwnersView: React.FC = () => {
    const { db, dataService, generateOwnerPortalLink } = useApp();
    const navigate = useNavigate();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingOwner, setEditingOwner] = useState<Owner | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [confirmDelete, setConfirmDelete] = useState<{ id: string, name: string } | null>(null);

    const { owners, properties } = db;

    const filteredOwners = useMemo(() => {
        return owners.filter(o => o.name.includes(searchTerm) || o.phone.includes(searchTerm));
    }, [owners, searchTerm]);

    const handleOpenModal = (owner: Owner | null = null) => {
        setEditingOwner(owner);
        setIsModalOpen(true);
    };

    const handleCloseModals = () => {
        setIsModalOpen(false);
    };
    
    const handleDelete = (id: string) => {
        if (properties.some(p => p.ownerId === id)) {
            toast.error("لا يمكن حذف المالك لأنه يمتلك عقارات مسجلة. يرجى تغيير ملكية العقارات أولاً.");
            return;
        }
        dataService.remove('owners', id);
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-xl font-black text-heading tracking-tight">قائمة الملاك</h2>
            </div>

            <TableControls
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                onAdd={() => handleOpenModal()}
                addLabel="إضافة مالك"
                onPrint={() => window.print()}
            />

            <div className="overflow-x-auto mt-8">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-border text-muted-foreground text-right">
                            <th className="pb-4 font-bold uppercase tracking-widest text-[11px]">الاسم</th>
                            <th className="pb-4 font-bold uppercase tracking-widest text-[11px]">الهاتف</th>
                            <th className="pb-4 font-bold uppercase tracking-widest text-[11px] text-center">عدد العقارات</th>
                            <th className="pb-4 font-bold uppercase tracking-widest text-[11px] text-left">إجراءات</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {filteredOwners.map(owner => (
                            <tr key={owner.id} className="group hover:bg-muted/50 transition-colors">
                                <td className="py-5 font-bold text-heading cursor-pointer" onClick={() => navigate(`/people/owners/${owner.id}`)}>{owner.name}</td>
                                <td className="py-5 text-muted-foreground font-medium">{owner.phone}</td>
                                <td className="py-5 text-center font-mono font-bold text-heading">{properties.filter(p => p.ownerId === owner.id).length}</td>
                                <td className="py-5 action-cell">
                                    <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity items-center gap-2">
                                        <button 
                                            onClick={async () => {
                                                const link = await generateOwnerPortalLink(owner.id);
                                                navigator.clipboard.writeText(link);
                                                toast.success("تم نسخ رابط المالك!");
                                            }}
                                            className="btn btn-sm btn-secondary flex items-center gap-1 rounded-xl text-[10px]"
                                        >
                                            <LinkIcon size={12} /> رابط المالك
                                        </button>
                                        <ActionsMenu items={[
                                            EditAction(() => handleOpenModal(owner)),
                                            { label: 'كشف حساب', icon: <BookOpen size={16} />, onClick: () => navigate(`/reports?tab=owner&ownerId=${owner.id}`) },
                                            DeleteAction(() => setConfirmDelete({ id: owner.id, name: owner.name }))
                                        ]} />
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredOwners.length === 0 && <div className="text-center py-16 text-muted-foreground font-bold italic">لا يوجد ملاك مطابقون للبحث.</div>}
            </div>
            <React.Suspense fallback={null}>
                <OwnerForm isOpen={isModalOpen} onClose={handleCloseModals} owner={editingOwner} />
            </React.Suspense>
            
            <ConfirmDialog
                isOpen={!!confirmDelete}
                onClose={() => setConfirmDelete(null)}
                onConfirm={() => confirmDelete && handleDelete(confirmDelete.id)}
                title="تأكيد حذف المالك"
                message={`هل أنت متأكد من حذف المالك "${confirmDelete?.name}"؟`}
            />
        </div>
    );
};

export default People;
