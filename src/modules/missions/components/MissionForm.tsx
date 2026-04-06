import React, { useState, useEffect } from 'react';
import { useApp } from '../../../contexts/AppContext';
import { Mission, Lead, Owner } from '../../../types';
import Modal from '../../../components/ui/Modal';
import { toast } from 'react-hot-toast';

interface MissionFormProps {
    isOpen: boolean;
    onClose: () => void;
    mission: Mission | null;
}

const MissionForm: React.FC<MissionFormProps> = ({ isOpen, onClose, mission }) => {
    const { db, dataService } = useApp();
    const [data, setData] = useState<Partial<Mission>>({});
    
    const { leads, owners } = db;

    useEffect(() => {
        if (mission) {
            setData(mission);
        } else {
            setData({ 
                title: '', 
                date: new Date().toISOString().slice(0, 10), 
                time: '10:00', 
                status: 'PLANNED', 
                leadId: null, 
                ownerId: null, 
                resultSummary: '' 
            });
        }
    }, [mission, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setData((prev: Partial<Mission>) => ({ 
            ...prev, 
            [name]: value === 'null' ? null : value 
        }));
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!data.title) {
            toast.error("العنوان مطلوب.");
            return;
        }
        
        if (mission) {
            dataService.update('missions', mission.id, data);
            toast.success("تم تحديث المهمة بنجاح");
        } else {
            dataService.add('missions', data as any);
            toast.success("تم إضافة المهمة بنجاح");
        }
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={mission ? 'تعديل المهمة' : 'إضافة مهمة جديدة'}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="text-sm font-medium block mb-1">عنوان المهمة</label>
                    <input 
                        name="title" 
                        value={data.title || ''} 
                        onChange={handleChange} 
                        placeholder="مثال: زيارة صيانة، معاينة وحدة" 
                        required 
                        className="w-full p-2 border rounded-md"
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm font-medium block mb-1">التاريخ</label>
                        <input 
                            type="date" 
                            name="date" 
                            value={data.date || ''} 
                            onChange={handleChange} 
                            required 
                            className="w-full p-2 border rounded-md"
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium block mb-1">الوقت</label>
                        <input 
                            type="time" 
                            name="time" 
                            value={data.time || ''} 
                            onChange={handleChange} 
                            required 
                            className="w-full p-2 border rounded-md"
                        />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm font-medium block mb-1">ربط بعميل محتمل</label>
                        <select 
                            name="leadId" 
                            value={data.leadId || 'null'} 
                            onChange={handleChange}
                            className="w-full p-2 border rounded-md"
                        >
                            <option value="null">-- لا يوجد --</option>
                            {leads?.map((l: Lead) => (
                                <option key={l.id} value={l.id}>{l.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="text-sm font-medium block mb-1">ربط بمالك</label>
                        <select 
                            name="ownerId" 
                            value={data.ownerId || 'null'} 
                            onChange={handleChange}
                            className="w-full p-2 border rounded-md"
                        >
                            <option value="null">-- لا يوجد --</option>
                            {owners?.map((o: Owner) => (
                                <option key={o.id} value={o.id}>{o.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <div>
                    <label className="text-sm font-medium block mb-1">الحالة</label>
                    <select 
                        name="status" 
                        value={data.status || 'PLANNED'} 
                        onChange={handleChange}
                        className="w-full p-2 border rounded-md"
                    >
                        <option value="PLANNED">مخطط لها</option>
                        <option value="COMPLETED">مكتملة</option>
                        <option value="CANCELLED">ملغاة</option>
                    </select>
                </div>
                {(data.status === 'COMPLETED') && (
                    <div>
                        <label className="text-sm font-medium block mb-1">ملخص النتائج</label>
                        <textarea 
                            name="resultSummary" 
                            value={data.resultSummary || ''} 
                            onChange={handleChange} 
                            rows={2} 
                            placeholder="ماذا حدث خلال المهمة؟" 
                            className="w-full p-2 border rounded-md"
                        />
                    </div>
                )}
                <div className="flex justify-end gap-2 pt-4 border-t">
                    <button type="button" onClick={onClose} className="btn btn-ghost">إلغاء</button>
                    <button type="submit" className="btn btn-primary">حفظ المهمة</button>
                </div>
            </form>
        </Modal>
    );
};

export default MissionForm;
