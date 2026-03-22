
import React, { useState, useMemo } from 'react';
import { useApp } from '../../../contexts/AppContext';
import { selectPropertyFinancials } from '../../../services/selectors';
import { formatCurrency } from '../../../utils/helpers';
import ReportHeader from './ReportHeader';
import { Printer, Download, Building2, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react';
import Card from '../../../components/ui/Card';
import { exportPropertyStatementToPdf } from '../../../services/files/pdfService';

const PropertyStatementView: React.FC = () => {
    const { db, contractBalances } = useApp();
    const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');

    const financials = useMemo(() => {
        if (!selectedPropertyId || !db) return null;
        return selectPropertyFinancials(db, selectedPropertyId, contractBalances);
    }, [db, selectedPropertyId, contractBalances]);

    if (!db) return null;

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center no-print">
                <div className="flex items-center gap-4">
                    <select 
                        className="p-2 border rounded-md text-sm min-w-[200px]"
                        value={selectedPropertyId}
                        onChange={e => setSelectedPropertyId(e.target.value)}
                    >
                        <option value="">اختر العقار...</option>
                        {db.properties.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => financials && exportPropertyStatementToPdf(financials, db.settings!)} className="btn btn-secondary gap-2">
                        <Download className="w-4 h-4" /> تحميل PDF
                    </button>
                    <button onClick={() => window.print()} className="btn btn-secondary gap-2">
                        <Printer className="w-4 h-4" /> طباعة
                    </button>
                </div>
            </div>

            {financials ? (
                <div className="space-y-6 print-area">
                    <ReportHeader 
                        title="كشف حساب عقار" 
                        subtitle={`تقرير مالي تفصيلي لعقار: ${financials.property?.name}`} 
                    />

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <Card className="p-4 border-r-4 border-r-primary">
                            <div className="text-xs font-bold text-muted-foreground mb-1">إجمالي إيرادات الإيجار</div>
                            <div className="text-xl font-black text-primary">{formatCurrency(financials.totalRentalIncome, db.settings?.currency)}</div>
                        </Card>
                        <Card className="p-4 border-r-4 border-r-danger">
                            <div className="text-xs font-bold text-muted-foreground mb-1">إجمالي المصروفات</div>
                            <div className="text-xl font-black text-danger">{formatCurrency(financials.propertyExpenses + financials.maintenanceCosts + financials.utilityCosts, db.settings?.currency)}</div>
                        </Card>
                        <Card className="p-4 border-r-4 border-r-warning">
                            <div className="text-xs font-bold text-muted-foreground mb-1">المتأخرات الحالية</div>
                            <div className="text-xl font-black text-warning">{formatCurrency(financials.currentArrears, db.settings?.currency)}</div>
                        </Card>
                        <Card className="p-4 border-r-4 border-r-success">
                            <div className="text-xs font-bold text-muted-foreground mb-1">صافي الربح التقديري</div>
                            <div className="text-xl font-black text-success">{formatCurrency(financials.netResult, db.settings?.currency)}</div>
                        </Card>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <h3 className="font-bold flex items-center gap-2">
                                <Building2 className="w-5 h-5 text-primary" /> ملخص الإشغال
                            </h3>
                            <div className="space-y-2">
                                <div className="flex justify-between p-3 bg-muted/30 rounded-lg">
                                    <span>إجمالي الوحدات</span>
                                    <span className="font-bold">{financials.occupancySummary.totalUnits}</span>
                                </div>
                                <div className="flex justify-between p-3 bg-success/10 rounded-lg text-success">
                                    <span>الوحدات المؤجرة</span>
                                    <span className="font-bold">{financials.occupancySummary.occupiedCount}</span>
                                </div>
                                <div className="flex justify-between p-3 bg-danger/10 rounded-lg text-danger">
                                    <span>الوحدات الشاغرة</span>
                                    <span className="font-bold">{financials.occupancySummary.vacancyCount}</span>
                                </div>
                                <div className="flex justify-between p-3 bg-primary/10 rounded-lg text-primary">
                                    <span>نسبة الإشغال</span>
                                    <span className="font-bold">{financials.occupancySummary.occupancyRate.toFixed(1)}%</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="font-bold flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-primary" /> تفاصيل المصروفات
                            </h3>
                            <div className="space-y-2">
                                <div className="flex justify-between p-3 border-b">
                                    <span>مصاريف تشغيلية</span>
                                    <span className="font-bold">{formatCurrency(financials.propertyExpenses, db.settings?.currency)}</span>
                                </div>
                                <div className="flex justify-between p-3 border-b">
                                    <span>تكاليف الصيانة</span>
                                    <span className="font-bold">{formatCurrency(financials.maintenanceCosts, db.settings?.currency)}</span>
                                </div>
                                <div className="flex justify-between p-3 border-b">
                                    <span>خدمات ومرافق (مدفوعة)</span>
                                    <span className="font-bold">{formatCurrency(financials.utilityCosts, db.settings?.currency)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 pt-8 border-t text-center text-xs text-muted-foreground">
                        طبع بواسطة: {db.settings?.company.name} | {new Date().toLocaleString('ar-EG')}
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                    <Building2 className="w-16 h-16 mb-4 opacity-20" />
                    <p>الرجاء اختيار عقار لعرض كشف الحساب</p>
                </div>
            )}
        </div>
    );
};

export default PropertyStatementView;
