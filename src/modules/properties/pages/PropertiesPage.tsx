
import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from 'contexts/AppContext';
import { Property, Unit, Owner } from 'core/types';
import { selectPropertiesWithDetails } from 'services/selectors';
import Card from 'components/ui/Card';
import PageHeader from 'components/ui/PageHeader';
import { PlusCircle, ArrowLeft, Lock, Building, Home } from 'lucide-react';
import ActionsMenu, { EditAction, DeleteAction } from 'components/shared/ActionsMenu';
import { ConfirmDialog } from 'components/ui';
import { formatCurrency } from 'utils/helpers';
import StatusPill from 'components/ui/StatusPill';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import TableControls from '../../../components/shared/TableControls';

// Lazy load forms for performance
const PropertyForm = React.lazy(() => import('../components/PropertyForm'));
const UnitForm = React.lazy(() => import('../components/UnitForm'));

const PropertiesPage: React.FC = () => {
    const { db, canAccess, dataService } = useApp();
    const [isPropModalOpen, setIsPropModalOpen] = useState(false);
    const [editingProp, setEditingProp] = useState<Property | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [confirmDelete, setConfirmDelete] = useState<{ id: string, name: string } | null>(null);
    const navigate = useNavigate();

    const propertiesWithStats = useMemo(() => {
        const detailed = selectPropertiesWithDetails(db);
        return detailed.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.location.toLowerCase().includes(searchTerm.toLowerCase()))
          .sort((a,b) => a.name.localeCompare(b.name));
    }, [db, searchTerm]);
    
    const handleOpenModal = (p: Property | null) => {
        setEditingProp(p);
        setIsPropModalOpen(true);
    };

    return (
        <div className="space-y-6">
            <PageHeader title="قائمة العقارات" description="عرض وإدارة جميع العقارات والوحدات التابعة لها." />
            
            <div className="mb-6">
                <TableControls
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    onAdd={canAccess('MANAGE_PROPERTIES') ? () => handleOpenModal(null) : undefined}
                    addLabel="إضافة عقار"
                    onPrint={() => window.print()}
                />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {propertiesWithStats.length > 0 ? (
                    propertiesWithStats.map(p => (
                        <Card key={p.id} className="flex flex-col !p-0 overflow-hidden">
                            <div className="p-5">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="font-bold text-xl text-heading">{p.name}</h3>
                                        <p className="text-sm text-muted-foreground">{p.location}</p>
                                    </div>
                                    {canAccess('MANAGE_PROPERTIES') && (
                                        <ActionsMenu items={[ 
                                            EditAction(() => handleOpenModal(p)), 
                                            DeleteAction(() => setConfirmDelete({ id: p.id, name: p.name })) 
                                        ]} />
                                    )}
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-3 bg-background rounded-xl text-center">
                                        <p className="text-xs text-muted-foreground">الوحدات</p>
                                        <p className="text-lg font-bold">{p.unitCount}</p>
                                    </div>
                                    <div className="p-3 bg-success-foreground rounded-xl text-center">
                                        <p className="text-xs text-muted-foreground">مؤجرة</p>
                                        <p className="text-lg font-bold text-success">{p.occupiedCount}</p>
                                    </div>
                                </div>
                            </div>
                            <button onClick={() => navigate(`/properties/${p.id}`)} className="w-full mt-4 btn btn-secondary rounded-t-none">
                                 إدارة الوحدات
                            </button>
                        </Card>
                    ))
                ) : (
                    <div className="col-span-full py-12 text-center bg-card rounded-2xl border border-dashed border-border">
                        <Building className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-20" />
                        <p className="text-muted-foreground">لا توجد عقارات حالياً.</p>
                        {canAccess('MANAGE_PROPERTIES') && (
                            <button onClick={() => handleOpenModal(null)} className="mt-4 btn btn-primary btn-sm">إضافة أول عقار</button>
                        )}
                    </div>
                )}
            </div>
            <React.Suspense fallback={null}>
                {isPropModalOpen && <PropertyForm isOpen={isPropModalOpen} onClose={() => setIsPropModalOpen(false)} property={editingProp} />}
            </React.Suspense>
            
            <ConfirmDialog
                isOpen={!!confirmDelete}
                onClose={() => setConfirmDelete(null)}
                onConfirm={() => confirmDelete && dataService.remove('properties', confirmDelete.id)}
                title="تأكيد حذف العقار"
                message={`هل أنت متأكد من حذف العقار "${confirmDelete?.name}"؟ سيتم حذف جميع الوحدات التابعة له أيضاً.`}
            />
        </div>
    );
};


export default PropertiesPage;
