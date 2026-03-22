import React, { useMemo, useState } from 'react';
import { useApp } from '../../../contexts/AppContext';
import { formatCurrency } from '../../../utils/helpers';
import StatusPill from '../../../components/ui/StatusPill';

const VacancyReportView: React.FC = () => {
    const { db } = useApp();
    const [propertyFilter, setPropertyFilter] = useState('ALL');

    const vacancyData = useMemo(() => {
        const { units, properties, contracts, tenants } = db;
        
        return units
            .filter(u => {
                const isVacant = !contracts.some(c => c.unitId === u.id && c.status === 'ACTIVE');
                const matchesProperty = propertyFilter === 'ALL' || u.propertyId === propertyFilter;
                return isVacant && matchesProperty;
            })
            .map(u => {
                const property = properties.find(p => p.id === u.propertyId);
                const lastContract = contracts
                    .filter(c => c.unitId === u.id)
                    .sort((a, b) => new Date(b.end).getTime() - new Date(a.end).getTime())[0];
                const lastTenant = lastContract ? tenants.find(t => t.id === lastContract.tenantId) : null;
                
                const daysVacant = lastContract ? Math.floor((new Date().getTime() - new Date(lastContract.end).getTime()) / (1000 * 60 * 60 * 24)) : 0;

                return {
                    id: u.id,
                    propertyName: property?.name || 'غير معروف',
                    unitName: u.name,
                    rent: u.rentDefault,
                    lastTenant: lastTenant?.name || '—',
                    vacantSince: lastContract ? lastContract.end : '—',
                    daysVacant: lastContract ? daysVacant : 0
                };
            });
    }, [db, propertyFilter]);

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">تقرير الوحدات الشاغرة</h2>
                <select 
                    className="input" 
                    value={propertyFilter} 
                    onChange={(e) => setPropertyFilter(e.target.value)}
                >
                    <option value="ALL">كل العقارات</option>
                    {db.properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full responsive-table">
                    <thead>
                        <tr>
                            <th>العقار</th>
                            <th>الوحدة</th>
                            <th>الحالة</th>
                            <th>المستأجر السابق</th>
                            <th>الإيجار</th>
                            <th>شاغرة منذ</th>
                            <th>عدد الأيام</th>
                        </tr>
                    </thead>
                    <tbody>
                        {vacancyData.map(v => (
                            <tr key={v.id}>
                                <td data-label="العقار">{v.propertyName}</td>
                                <td data-label="الوحدة" className="font-bold">{v.unitName}</td>
                                <td data-label="الحالة"><StatusPill status="AVAILABLE">شاغرة</StatusPill></td>
                                <td data-label="المستأجر السابق">{v.lastTenant}</td>
                                <td data-label="الإيجار">{formatCurrency(v.rent)}</td>
                                <td data-label="شاغرة منذ">{v.vacantSince}</td>
                                <td data-label="عدد الأيام">{v.daysVacant}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {vacancyData.length === 0 && <p className="text-center py-12 text-muted-foreground">لا توجد وحدات شاغرة.</p>}
            </div>
        </div>
    );
};

export default VacancyReportView;
