
import React, { useState } from 'react';
import { useApp } from '../../../contexts/AppContext';
import { UtilityService } from '../../../types';
import { getLocalISODate } from '../../../utils/helpers';
import Modal from '../../../components/ui/Modal';

interface UtilityServiceFormProps {
    isOpen: boolean;
    onClose: () => void;
    initialData?: Partial<UtilityService>;
}

const UtilityServiceForm: React.FC<UtilityServiceFormProps> = ({ isOpen, onClose, initialData }) => {
    const { db, dataService } = useApp();
    const [formData, setFormData] = useState<Partial<UtilityService>>(initialData || {
        serviceType: 'WATER',
        billingPeriod: new Date().toISOString().slice(0, 7),
        dueDate: getLocalISODate(),
        amount: 0,
        status: 'PENDING',
        responsibleParty: 'TENANT',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.propertyId || !formData.amount) return;

        if (initialData?.id) {
            await dataService.update('utilityServices', initialData.id, formData);
        } else {
            await dataService.add('utilityServices', {
                ...formData,
                createdAt: Date.now(),
            });
        }
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={initialData?.id ? "تعديل خدمة/مرفق" : "إضافة خدمة/مرفق جديد"}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-xs font-bold">العقار</label>
                        <select 
                            className="w-full p-2 border rounded-md"
                            value={formData.propertyId || ''}
                            onChange={e => setFormData({ ...formData, propertyId: e.target.value })}
                            required
                        >
                            <option value="">اختر العقار</option>
                            {db.properties.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold">الوحدة (اختياري)</label>
                        <select 
                            className="w-full p-2 border rounded-md"
                            value={formData.unitId || ''}
                            onChange={e => setFormData({ ...formData, unitId: e.target.value })}
                        >
                            <option value="">عام للعقار</option>
                            {db.units.filter(u => u.propertyId === formData.propertyId).map(u => (
                                <option key={u.id} value={u.id}>{u.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-xs font-bold">نوع الخدمة</label>
                        <select 
                            className="w-full p-2 border rounded-md"
                            value={formData.serviceType}
                            onChange={e => setFormData({ ...formData, serviceType: e.target.value as any })}
                            required
                        >
                            <option value="WATER">مياه</option>
                            <option value="ELECTRICITY">كهرباء</option>
                            <option value="SEWAGE">صرف صحي</option>
                            <option value="INTERNET">إنترنت</option>
                            <option value="BUILDING_SERVICES">خدمات مبنى</option>
                            <option value="OTHER">أخرى</option>
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold">فترة الفاتورة (شهر/سنة)</label>
                        <input 
                            type="month"
                            className="w-full p-2 border rounded-md"
                            value={formData.billingPeriod}
                            onChange={e => setFormData({ ...formData, billingPeriod: e.target.value })}
                            required
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-xs font-bold">تاريخ الاستحقاق</label>
                        <input 
                            type="date"
                            className="w-full p-2 border rounded-md"
                            value={formData.dueDate}
                            onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                            required
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold">المبلغ</label>
                        <input 
                            type="number"
                            step="0.001"
                            className="w-full p-2 border rounded-md"
                            value={formData.amount}
                            onChange={e => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                            required
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-xs font-bold">الحالة</label>
                        <select 
                            className="w-full p-2 border rounded-md"
                            value={formData.status}
                            onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                            required
                        >
                            <option value="PENDING">معلق</option>
                            <option value="PAID">مدفوع</option>
                            <option value="OVERDUE">متأخر</option>
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold">الطرف المسؤول</label>
                        <select 
                            className="w-full p-2 border rounded-md"
                            value={formData.responsibleParty}
                            onChange={e => setFormData({ ...formData, responsibleParty: e.target.value as any })}
                            required
                        >
                            <option value="TENANT">المستأجر</option>
                            <option value="OWNER">المالك</option>
                            <option value="OFFICE">المكتب</option>
                        </select>
                    </div>
                </div>

                <div className="space-y-1">
                    <label className="text-xs font-bold">ملاحظات</label>
                    <textarea 
                        className="w-full p-2 border rounded-md"
                        value={formData.notes || ''}
                        onChange={e => setFormData({ ...formData, notes: e.target.value })}
                        rows={2}
                    />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                    <button type="button" onClick={onClose} className="btn btn-secondary">إلغاء</button>
                    <button type="submit" className="btn btn-primary">حفظ</button>
                </div>
            </form>
        </Modal>
    );
};

export default UtilityServiceForm;
