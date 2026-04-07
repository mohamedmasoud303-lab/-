
import React, { useState } from 'react';
import { useApp } from 'contexts/AppContext';
import { UtilityService } from 'core/types';
import { formatCurrency, formatDate, getStatusBadgeClass } from 'utils/helpers';
import { Plus, Search, Filter, Edit2, Trash2, Zap, Droplets, Wifi, Building } from 'lucide-react';
import UtilityServiceForm from './UtilityServiceForm';
import StatusPill from 'components/ui/StatusPill';

const UtilityServicesView: React.FC = () => {
    const { db, dataService } = useApp();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedService, setSelectedService] = useState<UtilityService | undefined>(undefined);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<string>('ALL');

    const services = (db.utilityServices || []).filter(s => {
        const property = db.properties.find(p => p.id === s.propertyId);
        const matchesSearch = property?.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            s.serviceType.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = filterType === 'ALL' || s.serviceType === filterType;
        return matchesSearch && matchesType;
    });

    const handleDelete = async (id: string) => {
        if (window.confirm('هل أنت متأكد من حذف هذا السجل؟')) {
            await dataService.remove('utilityServices', id);
        }
    };

    const getServiceIcon = (type: string) => {
        switch (type) {
            case 'WATER': return <Droplets className="w-4 h-4 text-blue-500" />;
            case 'ELECTRICITY': return <Zap className="w-4 h-4 text-yellow-500" />;
            case 'INTERNET': return <Wifi className="w-4 h-4 text-purple-500" />;
            default: return <Building className="w-4 h-4 text-gray-500" />;
        }
    };

    const serviceTypeLabels: Record<string, string> = {
        WATER: 'مياه',
        ELECTRICITY: 'كهرباء',
        SEWAGE: 'صرف صحي',
        INTERNET: 'إنترنت',
        BUILDING_SERVICES: 'خدمات مبنى',
        OTHER: 'أخرى'
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-col md:flex-row justify-between gap-4">
                <div className="flex items-center gap-2 flex-1">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input 
                            type="text" 
                            placeholder="بحث في الخدمات..." 
                            className="w-full pr-10 pl-4 py-2 border rounded-md text-sm"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <select 
                        className="p-2 border rounded-md text-sm"
                        value={filterType}
                        onChange={e => setFilterType(e.target.value)}
                    >
                        <option value="ALL">كل الأنواع</option>
                        {Object.entries(serviceTypeLabels).map(([val, label]) => (
                            <option key={val} value={val}>{label}</option>
                        ))}
                    </select>
                </div>
                <button 
                    onClick={() => { setSelectedService(undefined); setIsFormOpen(true); }}
                    className="btn btn-primary gap-2"
                >
                    <Plus className="w-4 h-4" /> إضافة خدمة جديدة
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr>
                            <th>الخدمة</th>
                            <th>العقار / الوحدة</th>
                            <th>الفترة</th>
                            <th>تاريخ الاستحقاق</th>
                            <th>المبلغ</th>
                            <th>المسؤول</th>
                            <th>الحالة</th>
                            <th>الإجراءات</th>
                        </tr>
                    </thead>
                    <tbody>
                        {services.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="text-center py-8 text-muted-foreground">لا توجد خدمات مسجلة</td>
                            </tr>
                        ) : (
                            services.map(s => {
                                const property = db.properties.find(p => p.id === s.propertyId);
                                const unit = db.units.find(u => u.id === s.unitId);
                                return (
                                    <tr key={s.id}>
                                        <td>
                                            <div className="flex items-center gap-2">
                                                {getServiceIcon(s.serviceType)}
                                                <span className="font-bold">{serviceTypeLabels[s.serviceType]}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="text-xs">
                                                <div className="font-bold">{property?.name}</div>
                                                <div className="text-muted-foreground">{unit?.name || 'عام'}</div>
                                            </div>
                                        </td>
                                        <td>{s.billingPeriod}</td>
                                        <td>{formatDate(s.dueDate)}</td>
                                        <td className="font-bold">{formatCurrency(s.amount, db.settings?.currency)}</td>
                                        <td>
                                            <span className="text-xs px-2 py-0.5 bg-muted rounded-full">
                                                {s.responsibleParty === 'TENANT' ? 'المستأجر' : s.responsibleParty === 'OWNER' ? 'المالك' : 'المكتب'}
                                            </span>
                                        </td>
                                        <td>
                                            <StatusPill status={s.status}>
                                                {s.status === 'PAID' ? 'مدفوع' : s.status === 'PENDING' ? 'معلق' : 'متأخر'}
                                            </StatusPill>
                                        </td>
                                        <td>
                                            <div className="flex items-center gap-2">
                                                <button 
                                                    onClick={() => { setSelectedService(s); setIsFormOpen(true); }}
                                                    className="p-1 hover:bg-muted rounded text-primary"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(s.id)}
                                                    className="p-1 hover:bg-muted rounded text-danger"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            <UtilityServiceForm 
                isOpen={isFormOpen} 
                onClose={() => setIsFormOpen(false)} 
                initialData={selectedService} 
            />
        </div>
    );
};

export default UtilityServicesView;
