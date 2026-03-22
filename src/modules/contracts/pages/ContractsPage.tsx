
import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../../contexts/AppContext';
import { Contract } from '../../../types';
import { selectContractsWithDetails } from '../../../services/selectors';
import Card from '../../../components/ui/Card';
import ActionsMenu, { EditAction, DeleteAction, PrintAction } from '../../../components/shared/ActionsMenu';
import { formatCurrency, toArabicDigits, formatDate } from '../../../utils/helpers';
import { FileText, PlusCircle, AlertTriangle, Clock, DollarSign, Repeat } from 'lucide-react';
import PrintPreviewModal from '../../../components/shared/PrintPreviewModal';
import { Table, TableHeader, TableHeaderCell, TableBody, TableRow, TableCell } from '../../../components/ui/Table';
import { ConfirmDialog } from '../../../components/ui';
import { useLocation, useNavigate } from 'react-router-dom';
import { exportContractToPdf } from '../../../services/files/pdfService';
import { toast } from 'react-hot-toast';
import SummaryStatCard from '../../../components/ui/SummaryStatCard';
import StatusPill from '../../../components/ui/StatusPill';
import ContractPrintable from '../../../components/print/ContractPrintable';
import PageHeader from '../../../components/ui/PageHeader';
import TableControls from '../../../components/shared/TableControls';
import ContractForm from '../components/ContractForm';

const Contracts: React.FC = () => {
    const { db, dataService, contractBalances, canAccess } = useApp();
    const location = useLocation();
    const navigate = useNavigate();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingContract, setEditingContract] = useState<Contract | null>(null);
    const [printingContract, setPrintingContract] = useState<Contract | null>(null);
    const [defaultUnitId, setDefaultUnitId] = useState<string | undefined>();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [confirmDelete, setConfirmDelete] = useState<{ id: string, name: string } | null>(null);

    const contractsData = useMemo(() => {
        if (!db.settings) return { contracts: [], stats: { active: 0, totalRent: 0, expiring: 0, overdueBalance: 0 }};

        const contracts = selectContractsWithDetails(db, contractBalances).filter(c => {
            const matchesSearch = (c.unitName.includes(searchTerm) || c.tenantName.includes(searchTerm));
            const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
            return matchesSearch && matchesStatus;
        }).sort((a,b) => {
            if (a.risk === 'high' && b.risk !== 'high') return -1;
            if (b.risk === 'high' && a.risk !== 'high') return 1;
            if (a.risk === 'medium' && b.risk === 'low') return -1;
            if (b.risk === 'medium' && a.risk === 'low') return 1;
            return new Date(a.end).getTime() - new Date(b.end).getTime();
        });

        const activeContracts = contracts.filter(c => c.status === 'ACTIVE');
        const stats = {
            active: activeContracts.length,
            totalRent: activeContracts.reduce((sum, c) => sum + c.rent, 0),
            expiring: activeContracts.filter(c => c.isExpiring).length,
            overdueBalance: activeContracts.reduce((sum, c) => sum + (c.balance > 0 ? c.balance : 0), 0)
        };

        return { contracts, stats };
    }, [db, contractBalances, searchTerm, statusFilter]);


    const handleOpenModal = (contract: Contract | null = null, unitIdForNew?: string) => {
        setEditingContract(contract);
        setDefaultUnitId(unitIdForNew);
        setIsModalOpen(true);
    };

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        if (params.get('action') === 'add' && params.get('unitId')) {
            handleOpenModal(null, params.get('unitId')!);
            navigate('/contracts', { replace: true });
        } else if (params.get('contractId')) {
            const contractToEdit = db.contracts.find(c => c.id === params.get('contractId'));
            if (contractToEdit) handleOpenModal(contractToEdit);
            navigate('/contracts', { replace: true });
        }
    }, [location, db.contracts, navigate]);

    const handleCloseModal = () => setIsModalOpen(false);
    const handleDelete = (id: string) => {
        if (db.receipts.some(r => r.contractId === id) || db.expenses.some(e => e.contractId === id)) {
            toast.error("لا يمكن حذف العقد لوجود حركات مالية مرتبطة به.");
            return;
        }
        dataService.remove('contracts', id);
    };
    const handlePrint = (id: string) => setPrintingContract(db.contracts.find(c => c.id === id) || null);
    
    const { contracts, stats } = contractsData;

    return (
        <div className="space-y-8">
            <PageHeader title="إدارة العقود" description="عرض وتعديل جميع عقود الإيجار في النظام." />
            
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <SummaryStatCard label="العقود النشطة" value={stats.active} icon={<FileText size={24}/>} color="info"/>
                <SummaryStatCard label="إجمالي الإيجارات الشهرية" value={formatCurrency(stats.totalRent)} icon={<DollarSign size={24}/>} color="success"/>
                <SummaryStatCard label="عقود تنتهي قريباً" value={stats.expiring} icon={<Clock size={24}/>} color={stats.expiring > 0 ? 'warning' : 'success'}/>
                <SummaryStatCard label="إجمالي المتأخرات" value={formatCurrency(stats.overdueBalance)} icon={<AlertTriangle size={24}/>} color={stats.overdueBalance > 0 ? 'danger' : 'success'}/>
            </div>

            <Card className="p-8 rounded-3xl shadow-sm">
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-xl font-black text-heading tracking-tight">قائمة العقود (مرتبة حسب الأولوية)</h2>
                </div>
                
                <TableControls
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    onAdd={() => handleOpenModal()}
                    addLabel="إضافة عقد"
                    onPrint={() => window.print()}
                    filterOptions={[
                        { value: 'ALL', label: 'الكل' },
                        { value: 'ACTIVE', label: 'نشط' },
                        { value: 'ENDED', label: 'منتهي' },
                        { value: 'SUSPENDED', label: 'معلق' }
                    ]}
                    activeFilter={statusFilter}
                    onFilterChange={setStatusFilter}
                />
                
                <div className="mt-8">
                    {contracts.length > 0 ? (
                        <>
                            {/* Desktop Table */}
                            <div className="hidden md:block overflow-x-auto">
                                <Table>
    <TableHeader>
        <TableHeaderCell>الوحدة / المستأجر</TableHeaderCell>
        <TableHeaderCell>الإيجار</TableHeaderCell>
        <TableHeaderCell>الفترة</TableHeaderCell>
        <TableHeaderCell>الرصيد المستحق</TableHeaderCell>
        <TableHeaderCell>الحالة</TableHeaderCell>
        <TableHeaderCell className="text-left">الإجراء السريع</TableHeaderCell>
    </TableHeader>
    <TableBody>
        {contracts.map(c => (
            <TableRow key={c.id} className={`${c.risk === 'high' ? 'bg-danger/5' : c.risk === 'medium' ? 'bg-warning/5' : ''}`}>
                <TableCell className="font-bold text-heading whitespace-nowrap">
                    <div>{c.unitName}</div>
                    <div className="text-xs text-muted-foreground font-medium">{c.tenantName}</div>
                </TableCell>
                <TableCell className="font-mono font-bold text-heading">{formatCurrency(c.rent, db.settings.currency)}</TableCell>
                <TableCell className="text-muted-foreground text-sm font-medium">{toArabicDigits(c.start)} ← {toArabicDigits(c.end)}</TableCell>
                <TableCell className={`font-black ${c.balance > 0 ? 'text-danger' : 'text-heading'}`}>{formatCurrency(c.balance, db.settings.currency)}</TableCell>
                <TableCell><StatusPill status={c.status}>{c.status === 'ACTIVE' ? 'نشط' : (c.status === 'ENDED' ? 'منتهي' : 'معلق')}</StatusPill></TableCell>
                <TableCell className="action-cell">
                    <div className="flex items-center justify-end gap-2">
                        {c.balance > 0 && <button onClick={() => navigate('/financials')} className="btn btn-danger btn-sm flex items-center gap-1 rounded-xl"><DollarSign size={14}/> تحصيل</button>}
                        {c.isExpiring && <button className="btn btn-warning btn-sm flex items-center gap-1 rounded-xl"><Repeat size={14}/> تجديد</button>}
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <ActionsMenu items={[ 
                                EditAction(() => handleOpenModal(c)), 
                                PrintAction(() => handlePrint(c.id)), 
                                DeleteAction(() => setConfirmDelete({ id: c.id, name: `${c.unitName} - ${c.tenantName}` })),
                            ]} />
                        </div>
                    </div>
                </TableCell>
            </TableRow>
        ))}
    </TableBody>
</Table>
                            </div>
                            {/* Mobile Cards */}
                            <div className="md:hidden space-y-4">
                                {contracts.map(c => (
                                    <Card key={c.id} className={`p-6 rounded-2xl ${c.risk === 'high' ? 'border-danger' : c.risk === 'medium' ? 'border-warning' : ''}`}>
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="font-black text-lg text-heading">{c.unitName}</div>
                                            <StatusPill status={c.status}>{c.status === 'ACTIVE' ? 'نشط' : (c.status === 'ENDED' ? 'منتهي' : 'معلق')}</StatusPill>
                                        </div>
                                        <div className="text-sm font-bold text-muted-foreground mb-6">{c.tenantName}</div>
                                        <div className="grid grid-cols-2 gap-4 text-sm mb-6">
                                            <div>
                                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">الإيجار</p>
                                                <p className="font-bold text-heading">{formatCurrency(c.rent, db.settings.currency)}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">الرصيد</p>
                                                <p className={`font-black ${c.balance > 0 ? 'text-danger' : 'text-heading'}`}>{formatCurrency(c.balance, db.settings.currency)}</p>
                                            </div>
                                        </div>
                                        <div className="flex justify-end gap-2">
                                            <ActionsMenu items={[ 
                                                EditAction(() => handleOpenModal(c)), 
                                                PrintAction(() => handlePrint(c.id)), 
                                                DeleteAction(() => setConfirmDelete({ id: c.id, name: `${c.unitName} - ${c.tenantName}` })),
                                            ]} />
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="py-16 text-center bg-muted/30 rounded-3xl border border-dashed border-border">
                            <FileText className="w-16 h-16 mx-auto text-muted-foreground mb-6 opacity-20" />
                            <p className="text-muted-foreground font-bold">لا توجد عقود حالياً.</p>
                            {canAccess('MANAGE_CONTRACTS') && (
                                <button onClick={() => handleOpenModal()} className="mt-6 btn btn-primary rounded-xl shadow-brand">إضافة أول عقد</button>
                            )}
                        </div>
                    )}
                </div>
            </Card>
            <ContractForm isOpen={isModalOpen} onClose={handleCloseModal} contract={editingContract} defaultUnitId={defaultUnitId} />
            
            <ConfirmDialog
                isOpen={!!confirmDelete}
                onClose={() => setConfirmDelete(null)}
                onConfirm={() => confirmDelete && handleDelete(confirmDelete.id)}
                title="تأكيد حذف العقد"
                message={`هل أنت متأكد من حذف العقد "${confirmDelete?.name}"؟`}
            />

            {printingContract && ( 
                <PrintPreviewModal 
                    isOpen={!!printingContract} 
                    onClose={() => setPrintingContract(null)} 
                    title={`معاينة طباعة العقد`}
                    onExportPdf={() => {
                        if (!db.settings || !printingContract) return;
                        const tenant = db.tenants.find(t => t.id === printingContract.tenantId);
                        const unit = db.units.find(u => u.id === printingContract.unitId);
                        const property = unit ? db.properties.find(p => p.id === unit.propertyId) : undefined;
                        const owner = property ? db.owners.find(o => o.id === property.ownerId) : undefined;
                        exportContractToPdf(printingContract, tenant, unit, property, owner, db.settings);
                    }}
                >
                    <ContractPrintable contract={printingContract} />
                </PrintPreviewModal>
            )}
        </div>
    );
};

export default Contracts;
