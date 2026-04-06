import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  Database, 
  FileText, 
  History, 
  RefreshCw,
  ShieldCheck,
  Zap,
  LayoutList,
  ArrowRight,
  Sparkles,
  Search,
  Bot,
  Clock,
  Terminal
} from 'lucide-react';
import { useApp } from '../../../contexts/AppContext';
import { dbEngine } from '../../../services/api/db';
import { supabase } from '../../../lib/supabase';
import { formatDateTime } from '../../../utils/helpers';
import Card from '../../../components/ui/Card';
import PageHeader from '../../../components/ui/PageHeader';
import StatusPill from '../../../components/ui/StatusPill';
import { PiAgentService } from '../../../services/integrations/piAgentService';
import { SelfEvolutionManager } from '../../../ai/evolution/manager';

const Diagnostics: React.FC = () => {
  const { currentUser } = useApp();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [lastRebuild, setLastRebuild] = useState<string | null>(null);
  const [aiAuditResult, setAiAuditResult] = useState<string | null>(null);
  const [auditing, setAuditing] = useState(false);
  const [lastTasks, setLastTasks] = useState<any[]>([]);
  const [evolutionStatus, setEvolutionStatus] = useState<string>('IDLE');
  const [evolving, setEvolving] = useState(false);

  const runEvolution = async () => {
    setEvolving(true);
    setEvolutionStatus('EVOLVING');
    try {
      const manager = new SelfEvolutionManager();
      await manager.startEvolutionCycle();
      await fetchAiLogs();
      setEvolutionStatus('COMPLETED');
    } catch (error) {
      console.error('Evolution failed:', error);
      setEvolutionStatus('FAILED');
    } finally {
      setEvolving(false);
      setTimeout(() => setEvolutionStatus('IDLE'), 5000);
    }
  };

  const fetchAiLogs = async () => {
    const { data } = await supabase
      .from('auditLog')
      .select('*')
      .in('action', ['SEND_REMINDER', 'DAILY_CRON', 'EVOLUTION_CYCLE', 'CODE_HEALTH_AUDIT', 'SECURITY_SCAN', 'PERFORMANCE_CHECK', 'DEPENDENCY_UPGRADE', 'SELF_HEALING'])
      .order('timestamp', { ascending: false })
      .limit(10);
    setLastTasks(data || []);
  };

  useEffect(() => {
    fetchAiLogs();
  }, []);

  const runAiAudit = async () => {
    setAuditing(true);
    try {
      const piService = PiAgentService.getInstance();
      const result = await piService.chat(`
        Perform a high-level code audit of the Rentrix ERP project.
        Focus on:
        1. Financial transaction integrity (Supabase RPCs usage).
        2. Data fetching performance (React Query implementation).
        3. Security (RLS policies and authentication).
        4. Technical debt and code organization.
        
        Provide a concise summary with actionable recommendations.
      `);
      setAiAuditResult(result || null);
    } catch (error) {
      console.error('AI Audit failed:', error);
      setAiAuditResult('Failed to perform AI audit. Please check your connection.');
    } finally {
      setAuditing(false);
    }
  };

  const fetchStats = async () => {
    setLoading(true);
    try {
      const [
        invoices, 
        receipts, 
        expenses, 
        journals, 
        auditLogs,
        contracts,
        allocations
      ] = await Promise.all([
        dbEngine.invoices.count(),
        dbEngine.receipts.count(),
        dbEngine.expenses.count(),
        dbEngine.journalEntries.count(),
        dbEngine.auditLog.count(),
        dbEngine.contracts.count(),
        dbEngine.receiptAllocations.count()
      ]);

      // Orphan checks
      const allInvoices = await dbEngine.invoices.toArray();
      const allReceipts = await dbEngine.receipts.toArray();
      const allAllocations = await dbEngine.receiptAllocations.toArray();
      const allJournals = await dbEngine.journalEntries.toArray();
      const allAttachments = await dbEngine.attachments.toArray();
      
      const orphanedInvoices = allInvoices.filter((inv: any) => !inv.contractId).length;
      const orphanedAllocations = allAllocations.filter((alloc: any) => 
        !allReceipts.some((r: any) => r.id === alloc.receiptId) || 
        !allInvoices.some((i: any) => i.id === alloc.invoiceId)
      ).length;

      // Reconciliation checks
      const receiptsWithoutAllocations = allReceipts.filter((r: any) => 
        r.status === 'POSTED' && !allAllocations.some((a: any) => a.receiptId === r.id)
      ).length;

      const overAllocatedInvoices = allInvoices.filter((inv: any) => {
        const totalAllocated = allAllocations
          .filter((a: any) => a.invoiceId === inv.id)
          .reduce((sum: number, a: any) => sum + a.amount, 0);
        return totalAllocated > (inv.amount + (inv.taxAmount || 0)) + 0.01;
      }).length;

      const paidInvoicesNoReceipt = allInvoices.filter((inv: any) => 
        inv.status === 'PAID' && !allAllocations.some((a: any) => a.invoiceId === inv.id)
      ).length;

      const journalsMissingCounterpart = allJournals.filter((je: any) => {
        // Check if there's another journal entry with same 'no' but different 'type'
        return !allJournals.some((other: any) => other.no === je.no && other.type !== je.type);
      }).length;

      // Attachment checks (simulated for web, real check would be in Electron)
      const brokenAttachments = allAttachments.filter((att: any) => !att.dataUrl).length;

      setStats({
        counts: {
          invoices,
          receipts,
          expenses,
          journals,
          auditLogs,
          contracts
        },
        orphans: {
          invoices: orphanedInvoices,
          allocations: orphanedAllocations
        },
        reconciliation: {
          receiptsWithoutAllocations,
          overAllocatedInvoices,
          paidInvoicesNoReceipt,
          journalsMissingCounterpart,
          brokenAttachments
        },
        env: (window as any).electronAPI ? 'Electron (Desktop)' : 'Web Browser (Preview)'
      });

      const rebuildTime = localStorage.getItem('lastFinancialRebuild');
      setLastRebuild(rebuildTime);
    } catch (error) {
      console.error('Failed to fetch diagnostics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const checklist = [
    {
      id: 'createContract',
      title: 'إنشاء عقد (createContract)',
      steps: [
        'انتقل إلى "الوحدات" وتأكد من وجود وحدة بحالة "متاح".',
        'انتقل إلى "العقود" واضغط "عقد جديد".',
        'اختر الوحدة والمستأجر وحدد التواريخ والمبلغ.',
        'بعد الحفظ، تأكد من تحول حالة الوحدة إلى "مشغول".',
        'تأكد من توليد الفواتير (الأقساط) تلقائياً في صفحة "الفواتير".'
      ]
    },
    {
      id: 'payInstallment',
      title: 'تحصيل قسط (payInstallment)',
      steps: [
        'انتقل إلى "الفواتير" وابحث عن فاتورة "غير مدفوعة".',
        'اضغط على "تسجيل دفعة".',
        'أدخل المبلغ وتاريخ السداد.',
        'تأكد من صدور سند قبض وتخصيصه للفاتورة.',
        'تأكد من توليد قيود محاسبية (مدين: الصندوق، دائن: ذمم مستأجرين).',
        'جرب طباعة السند للتأكد من جاهزية الـ PDF.'
      ]
    },
    {
      id: 'generateInvoices',
      title: 'توليد الفواتير الشهرية',
      steps: [
        'انتقل إلى "المالية" واضغط "توليد فواتير الشهر".',
        'تأكد من إنشاء فواتير للعقود النشطة التي لم يصدر لها فاتورة لهذا الشهر.',
        'تأكد من تحول حالة الفواتير غير المدفوعة التي تجاوزت تاريخ استحقاقها إلى "متأخر".'
      ]
    },
    {
      id: 'voidOperations',
      title: 'عمليات الإلغاء (Void)',
      steps: [
        'جرب إلغاء سند قبض: تأكد من تحول حالته لـ "ملغي" وعكس القيود المحاسبية.',
        'جرب إلغاء فاتورة: تأكد من أنها غير مسددة أولاً.',
        'تأكد من ظهور عمليات الإلغاء في "سجل التدقيق".'
      ]
    },
    {
      id: 'reconciliation',
      title: 'مطابقة التقارير',
      steps: [
        'قارن إجمالي المحصل في "التقارير" مع رصيد الصندوق في "المحاسبة".',
        'تأكد من صحة حساب "صافي ربح المالك" بعد خصم المصاريف والعمولة.'
      ]
    },
    {
      id: 'hardening',
      title: 'اختبارات الحماية (Hardening)',
      steps: [
        'جرب استعادة نسخة احتياطية قديمة: تأكد من رفضها إذا كان الإصدار غير متوافق.',
        'جرب الضغط المزدوج على زر "حفظ": تأكد من عدم تكرار العملية (Idempotency).',
        'جرب حذف سجل في فترة مقفلة: تأكد من الرفض القاطع.',
        'تحقق من سرعة النظام أثناء إعادة بناء السجلات المالية الضخمة.'
      ]
    }
  ];

  return (
    <div className="space-y-6 pb-12">
      <PageHeader 
        title="تشخيص النظام والتحقق" 
        description="أدوات مراقبة صحة البيانات والتحقق من سير العمليات"
      >
        <button 
          onClick={fetchStats}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          تحديث البيانات
        </button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6 border-r-4 border-r-primary">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-xl text-primary">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">بيئة التشغيل</p>
              <p className="text-xl font-bold">{stats?.env || '...'}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 border-r-4 border-r-success">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-success/10 rounded-xl text-success">
              <History className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">آخر إعادة بناء مالي</p>
              <p className="text-xl font-bold">
                {lastRebuild ? formatDateTime(new Date(parseInt(lastRebuild)).toISOString()) : 'لم يتم بعد'}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6 border-r-4 border-r-warning">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-warning/10 rounded-xl text-warning">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">حالة النظام</p>
              <div className="flex items-center gap-2">
                <StatusPill status="ACTIVE">متصل ونشط</StatusPill>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6 border-r-4 border-r-indigo-500">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-500">
              <Bot className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">حالة العميل الذكي</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <StatusPill status="ACTIVE">مستعد</StatusPill>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Evolution: {evolutionStatus}</span>
                </div>
                <button 
                  onClick={runEvolution}
                  disabled={evolving}
                  className="p-1.5 bg-indigo-500/10 text-indigo-500 rounded hover:bg-indigo-500/20 disabled:opacity-50 transition-all"
                  title="تحفيز التطور الذاتي"
                >
                  <RefreshCw className={`w-4 h-4 ${evolving ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <h3 className="font-bold">تدقيق الكود بالذكاء الاصطناعي (AI Code Audit)</h3>
            </div>
            <button 
              onClick={runAiAudit}
              disabled={auditing}
              className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-all disabled:opacity-50"
            >
              {auditing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              {auditing ? 'جاري التدقيق...' : 'بدء التدقيق الشامل'}
            </button>
          </div>

          {aiAuditResult ? (
            <div className="p-6 bg-muted/30 rounded-xl border border-border whitespace-pre-wrap text-sm leading-relaxed">
              <div className="flex items-center gap-2 mb-4 text-primary font-bold">
                <ShieldCheck className="w-5 h-5" />
                تقرير التدقيق الذكي (Powered by pi-coding-agent)
              </div>
              {aiAuditResult}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Sparkles className="w-12 h-12 mb-4 opacity-20" />
              <p>استخدم محرك pi-coding-agent لتحليل جودة الكود واكتشاف الثغرات الأمنية.</p>
            </div>
          )}
        </Card>

        <Card className="lg:col-span-2">
          <div className="flex items-center gap-2 mb-6">
            <Terminal className="w-5 h-5 text-primary" />
            <h3 className="font-bold">سجل العمليات الذاتية والتطوير (Autonomous & Evolution Logs)</h3>
          </div>
          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
            {lastTasks.length > 0 ? lastTasks.map((task, idx) => (
              <div key={idx} className="p-4 bg-muted/30 rounded-lg border border-border flex items-start gap-4">
                <div className={`p-2 rounded ${
                  task.action.includes('EVOLUTION') || task.action.includes('AUDIT') || task.action.includes('SCAN') || task.action.includes('CHECK') || task.action.includes('UPGRADE') || task.action.includes('HEALING')
                    ? 'bg-indigo-500/10 text-indigo-500'
                    : 'bg-primary/10 text-primary'
                }`}>
                  {task.action === 'DAILY_CRON' ? <Clock className="w-4 h-4" /> : 
                   task.action.includes('HEALING') ? <Zap className="w-4 h-4" /> :
                   task.action.includes('SCAN') ? <ShieldCheck className="w-4 h-4" /> :
                   <Bot className="w-4 h-4" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs uppercase tracking-wider">{task.action.replace(/_/g, ' ')}</span>
                    <span className="text-[10px] text-muted-foreground">{formatDateTime(new Date(task.timestamp).toISOString())}</span>
                  </div>
                  <p className="text-sm">{task.details}</p>
                </div>
              </div>
            )) : (
              <div className="text-center py-8 text-muted-foreground italic">لا توجد عمليات مسجلة حالياً.</div>
            )}
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Database className="w-5 h-5 text-primary" />
            <h3 className="font-bold">إحصائيات السجلات</h3>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="p-4 bg-muted/30 rounded-lg flex justify-between items-center">
              <span className="text-muted-foreground flex items-center gap-2">
                <FileText className="w-4 h-4" /> الفواتير
              </span>
              <span className="font-bold text-lg">{stats?.counts.invoices || 0}</span>
            </div>
            <div className="p-4 bg-muted/30 rounded-lg flex justify-between items-center">
              <span className="text-muted-foreground flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> سندات القبض
              </span>
              <span className="font-bold text-lg">{stats?.counts.receipts || 0}</span>
            </div>
            <div className="p-4 bg-muted/30 rounded-lg flex justify-between items-center">
              <span className="text-muted-foreground flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> المصاريف
              </span>
              <span className="font-bold text-lg">{stats?.counts.expenses || 0}</span>
            </div>
            <div className="p-4 bg-muted/30 rounded-lg flex justify-between items-center">
              <span className="text-muted-foreground flex items-center gap-2">
                <LayoutList className="w-4 h-4" /> القيود المحاسبية
              </span>
              <span className="font-bold text-lg">{stats?.counts.journals || 0}</span>
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-bold mb-3 flex items-center gap-2 text-danger">
              <AlertTriangle className="w-4 h-4" /> فحص التناسق (Orphan Checks)
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm p-2 bg-danger/5 rounded border border-danger/10">
                <span>فواتير بدون عقد مرتبط:</span>
                <span className={(stats?.orphans.invoices || 0) > 0 ? 'text-danger font-bold' : 'text-success'}>
                  {stats?.orphans.invoices || 0}
                </span>
              </div>
              <div className="flex justify-between text-sm p-2 bg-danger/5 rounded border border-danger/10">
                <span>تخصيصات دفع يتيمة (Receipt Allocations):</span>
                <span className={(stats?.orphans.allocations || 0) > 0 ? 'text-danger font-bold' : 'text-success'}>
                  {stats?.orphans.allocations || 0}
                </span>
              </div>
            </div>

            <h4 className="text-sm font-bold mt-6 mb-3 flex items-center gap-2 text-warning">
              <Activity className="w-4 h-4" /> مطابقة البيانات (Reconciliation)
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm p-2 bg-muted/30 rounded">
                <span>سندات قبض غير مخصصة لفواتير:</span>
                <span className={(stats?.reconciliation.receiptsWithoutAllocations || 0) > 0 ? 'text-warning font-bold' : 'text-success'}>
                  {stats?.reconciliation.receiptsWithoutAllocations || 0}
                </span>
              </div>
              <div className="flex justify-between text-sm p-2 bg-muted/30 rounded">
                <span>فواتير تم تخصيص مبالغ أكبر من قيمتها:</span>
                <span className={(stats?.reconciliation.overAllocatedInvoices || 0) > 0 ? 'text-danger font-bold' : 'text-success'}>
                  {stats?.reconciliation.overAllocatedInvoices || 0}
                </span>
              </div>
              <div className="flex justify-between text-sm p-2 bg-muted/30 rounded">
                <span>فواتير "مدفوعة" بدون سندات مرتبطة:</span>
                <span className={(stats?.reconciliation.paidInvoicesNoReceipt || 0) > 0 ? 'text-danger font-bold' : 'text-success'}>
                  {stats?.reconciliation.paidInvoicesNoReceipt || 0}
                </span>
              </div>
              <div className="flex justify-between text-sm p-2 bg-muted/30 rounded">
                <span>قيود محاسبية بدون طرف مقابل (قيد مفرد):</span>
                <span className={(stats?.reconciliation.journalsMissingCounterpart || 0) > 0 ? 'text-danger font-bold' : 'text-success'}>
                  {stats?.reconciliation.journalsMissingCounterpart || 0}
                </span>
              </div>
              <div className="flex justify-between text-sm p-2 bg-muted/30 rounded">
                <span>مرفقات تالفة (سجل بدون ملف):</span>
                <span className={(stats?.reconciliation.brokenAttachments || 0) > 0 ? 'text-warning font-bold' : 'text-success'}>
                  {stats?.reconciliation.brokenAttachments || 0}
                </span>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 className="w-5 h-5 text-success" />
            <h3 className="font-bold">قائمة التحقق للاختبار (E2E Checklist)</h3>
          </div>
          <div className="space-y-6">
            {checklist.map((item) => (
              <div key={item.id} className="border-b border-border last:border-0 pb-4 last:pb-0">
                <h4 className="font-bold text-primary mb-2 flex items-center gap-2">
                  <ArrowRight className="w-4 h-4" /> {item.title}
                </h4>
                <ul className="space-y-1">
                  {item.steps.map((step, idx) => (
                    <li key={idx} className="text-sm text-muted-foreground flex gap-2">
                      <span className="text-primary font-mono">{idx + 1}.</span>
                      {step}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Diagnostics;
