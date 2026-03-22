
import React, { useState, useMemo } from 'react';
import { useApp } from '../../../contexts/AppContext';
import { Lead } from '../../../types';
import Card from '../../../components/ui/Card';
import ActionsMenu, { EditAction, DeleteAction } from '../../../components/shared/ActionsMenu';
import { UserPlus, MessageCircle, Phone, Mail, UserCheck } from 'lucide-react';
import { WhatsAppComposerModal } from '../../../components/shared/WhatsAppComposerModal';
import { toast } from 'react-hot-toast';
import LeadForm from '../components/LeadForm';
import StatusPill from '../../../components/ui/StatusPill';
import PageHeader from '../../../components/ui/PageHeader';
import { useNavigate } from 'react-router-dom';
import TableControls from '../../../components/shared/TableControls';

const Leads: React.FC = () => {
    const { db, dataService } = useApp();
    const navigate = useNavigate();
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [editingLead, setEditingLead] = useState<Lead | null>(null);
    const [whatsAppContext, setWhatsAppContext] = useState<any | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');

    const handleConvertToTenant = async (lead: Lead) => {
        if (window.confirm(`هل تريد تحويل العميل "${lead.name}" إلى مستأجر دائم وإصدار عقد له؟`)) {
            const newTenant = await dataService.add('tenants', {
                name: lead.name,
                phone: lead.phone,
                idNo: '',
                status: 'ACTIVE',
                notes: `تم التحويل من عميل محتمل. الملاحظات السابقة: ${lead.notes}`
            });
            
            if (newTenant) {
                await dataService.update('leads', lead.id, { status: 'CLOSED' });
                toast.success("تم إنشاء ملف المستأجر بنجاح. جاري تحويلك لإنشاء العقد...");
                navigate(`/contracts?action=add&tenantId=${newTenant.id}`);
            }
        }
    };

    const getStatusLabel = (status: Lead['status']) => {
        const map = { 'NEW': 'جديد', 'CONTACTED': 'تم التواصل', 'INTERESTED': 'مهتم', 'NOT_INTERESTED': 'غير مهتم', 'CLOSED': 'مغلق' };
        return map[status] || status;
    };

    const filteredLeads = useMemo(() => {
        return db?.leads.filter(lead => {
            const matchesSearch = lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                  lead.phone.includes(searchTerm) ||
                                  (lead.email && lead.email.toLowerCase().includes(searchTerm.toLowerCase()));
            const matchesStatus = statusFilter === 'ALL' || lead.status === statusFilter;
            return matchesSearch && matchesStatus;
        }) || [];
    }, [db?.leads, searchTerm, statusFilter]);

    return (
        <div className="space-y-6">
            <PageHeader title="دورة مبيعات الأراضي والوحدات" description="تحويل العملاء المحتملين إلى مستأجرين أو ملاك عقارات." />
            
            <Card>
                <TableControls
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    onAdd={() => {setEditingLead(null); setIsFormModalOpen(true);}}
                    addLabel="إضافة طلب جديد"
                    onPrint={() => window.print()}
                    filterOptions={[
                        { value: 'ALL', label: 'الكل' },
                        { value: 'NEW', label: 'جديد' },
                        { value: 'CONTACTED', label: 'تم التواصل' },
                        { value: 'INTERESTED', label: 'مهتم' },
                        { value: 'NOT_INTERESTED', label: 'غير مهتم' },
                        { value: 'CLOSED', label: 'مغلق' }
                    ]}
                    activeFilter={statusFilter}
                    onFilterChange={setStatusFilter}
                />
                
                <div className="overflow-x-auto mt-4">
                    <table className="responsive-table">
                        <thead>
                            <tr>
                                <th>الاسم</th>
                                <th>الاتصال</th>
                                <th>الاهتمام</th>
                                <th>الحالة</th>
                                <th>إجراءات</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredLeads.map(lead => (
                                <tr key={lead.id} className="group">
                                    <td data-label="الاسم" className="font-bold text-heading">{lead.name}</td>
                                    <td data-label="الاتصال">
                                        <div className="flex flex-col gap-1 text-xs">
                                            <div className="flex items-center gap-1"><Phone size={10}/> {lead.phone}</div>
                                            {lead.email && <div className="flex items-center gap-1 opacity-60"><Mail size={10}/> {lead.email}</div>}
                                        </div>
                                    </td>
                                    <td data-label="الاهتمام" className="text-[10px] font-bold text-primary bg-primary/5 px-2 py-1 rounded-full w-fit">{lead.desiredUnitType || 'غير محدد'}</td>
                                    <td data-label="الحالة"><StatusPill status={lead.status}>{getStatusLabel(lead.status)}</StatusPill></td>
                                    <td data-label="إجراءات" className="action-cell">
                                      <div className="flex justify-end items-center gap-2">
                                        {lead.status !== 'CLOSED' && (
                                            <button onClick={() => handleConvertToTenant(lead)} className="btn btn-sm btn-success flex items-center gap-1 text-[10px]">
                                                <UserCheck size={12}/> تحويل لعقد
                                            </button>
                                        )}
                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                            <ActionsMenu items={[
                                                EditAction(() => {setEditingLead(lead); setIsFormModalOpen(true);}),
                                                { label: 'مراسلة واتساب', icon: <MessageCircle size={16} />, onClick: () => setWhatsAppContext({ recipient: lead, type: 'lead', data: { lead } }) },
                                                DeleteAction(() => dataService.remove('leads', lead.id)),
                                            ]} />
                                        </div>
                                      </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filteredLeads.length === 0 && <div className="text-center py-12 text-muted-foreground">لا توجد طلبات مطابقة للبحث.</div>}
                </div>
            </Card>
            {isFormModalOpen && <LeadForm isOpen={isFormModalOpen} onClose={() => setIsFormModalOpen(false)} lead={editingLead} />}
            {whatsAppContext && <WhatsAppComposerModal isOpen={!!whatsAppContext} onClose={() => setWhatsAppContext(null)} context={whatsAppContext} />}
        </div>
    );
};

export default Leads;
