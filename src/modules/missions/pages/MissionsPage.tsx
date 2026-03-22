
import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../../contexts/AppContext';
import { Mission, Lead, Owner, User } from '../../../types';
import Card from '../../../components/ui/Card';
import ActionsMenu, { EditAction, DeleteAction } from '../../../components/shared/ActionsMenu';
import { formatCurrency, formatDate } from '../../../utils/helpers';
import { ClipboardList, PlusCircle, Calendar, Clock, CheckCircle2, Circle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import PageHeader from '../../../components/ui/PageHeader';
import StatusPill from '../../../components/ui/StatusPill';
import TableControls from '../../../components/shared/TableControls';
import MissionForm from '../components/MissionForm';

const Missions: React.FC = () => {
    const { db, dataService } = useApp();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingMission, setEditingMission] = useState<Mission | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');

    const { missions, leads, owners } = db;

    const leadsMap = useMemo(() => new Map(leads?.map((l: Lead) => [l.id, l.name])), [leads]);
    const ownersMap = useMemo(() => new Map(owners?.map((o: Owner) => [o.id, o.name])), [owners]);

    const handleOpenModal = (mission: Mission | null = null) => {
        setEditingMission(mission);
        setIsModalOpen(true);
    };

    const getStatusLabel = (status: Mission['status']) => {
        const map: Record<string, string> = { 'PLANNED': 'مخطط لها', 'COMPLETED': 'مكتملة', 'CANCELLED': 'ملغاة' };
        return map[status] || status;
    };

    const filteredMissions = useMemo(() => {
        return missions.filter((m: Mission) => {
            const matchesSearch = m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                  (m.leadId && leadsMap.get(m.leadId)?.toLowerCase().includes(searchTerm.toLowerCase())) ||
                                  (m.ownerId && ownersMap.get(m.ownerId)?.toLowerCase().includes(searchTerm.toLowerCase()));
            const matchesStatus = statusFilter === 'ALL' || m.status === statusFilter;
            return matchesSearch && matchesStatus;
        }).sort((a: Mission, b: Mission) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [missions, searchTerm, statusFilter, leadsMap, ownersMap]);

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="space-y-6">
            <PageHeader title="إدارة المهام والزيارات" description="جدولة المواعيد، المعاينات الميدانية، والمهام الإدارية للموظفين." />
            
            <Card>
                <TableControls
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    onAdd={() => handleOpenModal()}
                    addLabel="مهمة جديدة"
                    onPrint={handlePrint}
                    filterOptions={[
                        { value: 'ALL', label: 'الكل' },
                        { value: 'PLANNED', label: 'مخطط لها' },
                        { value: 'COMPLETED', label: 'مكتملة' },
                        { value: 'CANCELLED', label: 'ملغاة' }
                    ]}
                    activeFilter={statusFilter}
                    onFilterChange={setStatusFilter}
                />
                
                <div className="overflow-x-auto mt-4">
                    <table className="responsive-table">
                        <thead>
                            <tr>
                                <th>المهمة</th>
                                <th>الموعد</th>
                                <th>مرتبطة بـ</th>
                                <th>الحالة</th>
                                <th>إجراءات</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredMissions.map((mission: Mission) => {
                                const relatedTo = mission.leadId ? `عميل: ${leadsMap.get(mission.leadId)}` : mission.ownerId ? `مالك: ${ownersMap.get(mission.ownerId)}` : 'مهمة عامة';
                                return (
                                    <tr key={mission.id} className={`group ${mission.status === 'COMPLETED' ? 'opacity-60' : ''}`}>
                                        <td data-label="المهمة" className="font-bold text-heading">
                                            <div className="flex items-center gap-2">
                                                {mission.status === 'COMPLETED' ? <CheckCircle2 size={16} className="text-success" /> : <Circle size={16} className="text-muted-foreground" />}
                                                {mission.title}
                                            </div>
                                        </td>
                                        <td data-label="الموعد">
                                            <div className="text-xs">
                                                <div className="flex items-center gap-1 font-bold text-primary"><Calendar size={10}/> {formatDate(mission.date)}</div>
                                                <div className="flex items-center gap-1 text-muted-foreground"><Clock size={10}/> {mission.time}</div>
                                            </div>
                                        </td>
                                        <td data-label="الارتباط" className="text-xs font-medium">{relatedTo}</td>
                                        <td data-label="الحالة"><StatusPill status={mission.status}>{getStatusLabel(mission.status)}</StatusPill></td>
                                        <td data-label="إجراءات" className="action-cell">
                                            <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                                <ActionsMenu items={[ EditAction(() => handleOpenModal(mission)), DeleteAction(() => dataService.remove('missions', mission.id)) ]} />
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                     {filteredMissions.length === 0 && <div className="text-center py-12 text-muted-foreground">لا توجد مهام مطابقة للبحث.</div>}
                </div>
            </Card>
            {isModalOpen && <MissionForm isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} mission={editingMission} />}
        </div>
    );
};

export default Missions;
