
import { toast } from 'react-hot-toast';
import { dbEngine } from '../../services/api/db';
import { Database, JournalEntry, Receipt, Invoice, User, Settings, Commission, Expense, OwnerSettlement } from '../../core/types';
import { dataService } from '../../services/api/dataService';
import { postJournalEntry, rebuildSnapshotsFromJournal } from './financialEngine';
import { formatCurrency, getLocalISODate, getLocalISOMonth } from '../../utils/helpers';

const STATIC_ID = 1;

/**
 * إنشاء قيد عكسي لأي حركة مالية ملغاة
 */
const createReversingJE = async (tx: any, sourceId: string) => {
    const entries: JournalEntry[] = await tx.table('journalEntries').where('sourceId').equals(sourceId).toArray();
    if (entries.length === 0) return;
    
    const governance = await tx.table('governance').get(STATIC_ID);
    const lockDate = governance?.financialLockDate ? new Date(governance.financialLockDate) : null;
    const today = new Date();

    if (lockDate && today <= lockDate) {
        throw new Error(`لا يمكن الإلغاء لأن الفترة المالية الحالية مقفلة.`);
    }

    const reversalDate = getLocalISODate(today);

    const groups = entries.reduce((acc, entry) => {
        if (!acc[entry.no]) acc[entry.no] = [];
        acc[entry.no].push(entry);
        return acc;
    }, {} as Record<string, JournalEntry[]>);

    for (const entryNo in groups) {
        const group = groups[entryNo];
        const debit = group.find(e => e.type === 'DEBIT');
        const credit = group.find(e => e.type === 'CREDIT');
        
        if (debit && credit) {
            await postJournalEntry(tx, { 
                dr: credit.accountId, 
                cr: debit.accountId, 
                amount: debit.amount, 
                ref: `${sourceId}-VOID`,
                date: reversalDate
            });
        }
    }
};

import { supabase } from '../../lib/supabase';

const voidReceipt = async (id: string, user: User | null | undefined): Promise<void> => {
    try {
        const { error } = await supabase.rpc('void_receipt', { p_receipt_id: id, p_user_id: user?.id });
        if (error) throw error;
        
        toast.success('تم إلغاء السند وتحديث القيود المحاسبية.');
        await rebuildSnapshotsFromJournal();
    } catch (e: any) {
        toast.error(e.message || "فشل إلغاء السند.");
        console.error(e);
    }
};

const voidExpense = async (id: string, user: User | null | undefined): Promise<void> => {
    try {
        const { error } = await supabase.rpc('void_expense', { p_expense_id: id, p_user_id: user?.id });
        if (error) throw error;

        toast.success('تم إلغاء المصروف.');
        await rebuildSnapshotsFromJournal();
    } catch (e: any) { 
        toast.error(e.message || "فشل الإلغاء."); 
        console.error(e);
    }
};

const voidInvoice = async (id: string, user: User | null | undefined): Promise<void> => {
    try {
        const { error } = await supabase.rpc('void_invoice', { p_invoice_id: id, p_user_id: user?.id });
        if (error) throw error;

        toast.success('تم إلغاء الفاتورة.');
        await rebuildSnapshotsFromJournal();
    } catch (e: any) { 
        toast.error(e.message || "فشل إلغاء الفاتورة."); 
        console.error(e);
    }
};

// ... other functions remain unchanged
const addReceiptWithAllocations = async (receiptData: Omit<Receipt, 'id' | 'createdAt' | 'no' | 'status'>, allocations: { invoiceId: string, amount: number }[], user: User | null | undefined, settings: Settings): Promise<void> => {
    let newReceiptNo = '';
    await dbEngine.transaction('rw', [dbEngine.governance, dbEngine.receipts, dbEngine.receiptAllocations, dbEngine.invoices, dbEngine.journalEntries, dbEngine.auditLog, dbEngine.serials], async (tx: any) => {
        const governance = await tx.table('governance').get(STATIC_ID);
        const lockDate = governance?.financialLockDate ? new Date(governance.financialLockDate) : null;
        const entryDate = new Date(receiptData.dateTime.slice(0,10));
        if (lockDate && entryDate <= lockDate) {
            throw new Error(`الفترة المالية مغلقة حتى تاريخ ${lockDate.toLocaleDateString()}.`);
        }
        
        const s = await tx.table('serials').get(STATIC_ID);
        if (s) { s.receipt++; newReceiptNo = String(s.receipt); await tx.table('serials').put(s); }

        const newReceipt: Receipt = { ...receiptData, id: crypto.randomUUID(), createdAt: Date.now(), no: newReceiptNo, status: 'POSTED' as const };
        await tx.table('receipts').add(newReceipt);
        const newAllocations = allocations.map(a => ({ id: crypto.randomUUID(), receiptId: newReceipt.id, ...a, createdAt: Date.now() }));
        await tx.table('receiptAllocations').bulkAdd(newAllocations);
        const invoicesToUpdate = await tx.table('invoices').bulkGet(allocations.map(a => a.invoiceId));
        for (const invoice of invoicesToUpdate) {
            if (!invoice) continue;
            const allocation = allocations.find(a => a.invoiceId === invoice.id); if (!allocation) continue;
            invoice.paidAmount += allocation.amount;
            invoice.status = (invoice.paidAmount >= (invoice.amount + (invoice.taxAmount || 0)) - 0.001) ? 'PAID' : 'PARTIALLY_PAID';
        }
        await tx.table('invoices').bulkPut(invoicesToUpdate as Invoice[]);
        const mappings = settings.accountMappings;
        await postJournalEntry(tx, { dr: mappings.paymentMethods[newReceipt.channel], cr: mappings.accountsReceivable, amount: newReceipt.amount, ref: newReceipt.id, entityType: 'CONTRACT', entityId: newReceipt.contractId, date: newReceipt.dateTime });
        await dataService.audit(user, 'CREATE', 'receipts', newReceipt.id, `إصدار سند قبض رقم ${newReceiptNo}`);
    });
    toast.success('تم تسجيل السند بنجاح.');
    await rebuildSnapshotsFromJournal();
};

export const financeService = {
    addReceiptWithAllocations,
    voidReceipt,
    voidExpense,
    voidInvoice,
    voidDepositTx: async (id: string, user: User | null | undefined) => {
        await dbEngine.transaction('rw', [dbEngine.governance, dbEngine.depositTxs, dbEngine.auditLog, dbEngine.journalEntries, dbEngine.serials], async (tx: any) => {
            await createReversingJE(tx, id);
            await tx.table('depositTxs').update(id, { status: 'VOID' });
        });
        toast.success("تم إلغاء حركة التأمين.");
        await rebuildSnapshotsFromJournal();
    },
    generateMonthlyInvoices: async (user: User | null | undefined, settings: Settings): Promise<number> => {
        const today = new Date();
        const todayStr = getLocalISODate(today);
        const currentMonthYm = getLocalISOMonth(today);
        
        let count = 0;
        await dbEngine.transaction('rw', [dbEngine.governance, dbEngine.contracts, dbEngine.invoices, dbEngine.auditLog, dbEngine.serials, dbEngine.journalEntries], async (tx: any) => {
            // 1. Generate missing invoices for active contracts (if any)
            const activeContracts = await tx.table('contracts').where('status').equals('ACTIVE').toArray();
            for (const c of activeContracts) {
                const dueDate = `${currentMonthYm}-${String(c.dueDay).padStart(2, '0')}`;
                const exists = await tx.table('invoices').where('contractId').equals(c.id).toArray();
                const alreadyExists = exists.some((inv: any) => inv.dueDate === dueDate);
                if (!alreadyExists) {
                    const tax = (c.rent * settings.taxRate) / 100;
                    await dataService.add('invoices', { contractId: c.id, dueDate, amount: c.rent, taxAmount: tax, paidAmount: 0, status: 'UNPAID', type: 'RENT', notes: `إيجار شهر ${today.getMonth() + 1}` }, user, settings);
                    count++;
                }
            }

            // 2. Update status to OVERDUE for unpaid invoices past due date
            const unpaid = await tx.table('invoices').toArray();
            for (const inv of unpaid) {
                if ((inv.status === 'UNPAID' || inv.status === 'PARTIALLY_PAID') && inv.dueDate < todayStr) {
                    await tx.table('invoices').update(inv.id, { status: 'OVERDUE' });
                    count++;
                }
            }
            
            await dataService.audit(user, 'SYSTEM', 'engine', 'all', 'توليد فواتير شهرية وتحديث المتأخرات');
        });
        
        return count;
    },
    generateNotifications: async (user: User | null | undefined, settings: Settings): Promise<number> => {
        const today = new Date();
        const alertThreshold = new Date();
        alertThreshold.setDate(today.getDate() + (settings.contractAlertDays || 30));
        
        let count = 0;
        
        // 1. تنبيهات العقود المنتهية أو التي قاربت على الانتهاء
        const contracts = await dbEngine.contracts.where('status').equals('ACTIVE').toArray();
        for (const c of contracts) {
            const endDate = new Date(c.end);
            if (endDate <= alertThreshold) {
                const tenant = await dbEngine.tenants.get(c.tenantId);
                const unit = await dbEngine.units.get(c.unitId);
                const exists = await dbEngine.outgoingNotifications.where({ 
                    recipientContact: tenant?.phone || '', 
                    type: 'CONTRACT_EXPIRY',
                    refId: c.id 
                }).first();
                
                if (!exists && tenant) {
                    const message = `عزيزي ${tenant.name}، نود تذكيركم بأن عقد إيجار الوحدة (${unit?.name}) سينتهي بتاريخ ${c.end}. يرجى التواصل معنا للتجديد.`;
                    await dataService.add('outgoingNotifications', {
                        recipientName: tenant.name,
                        recipientContact: tenant.phone,
                        message,
                        type: 'CONTRACT_EXPIRY',
                        status: 'PENDING',
                        refId: c.id
                    }, user, settings);
                    count++;
                }
            }
        }
        
        // 2. تنبيهات الفواتير المتأخرة
        const overdueInvoices = await dbEngine.invoices.where('status').equals('OVERDUE').toArray();
        for (const inv of overdueInvoices) {
            const contract = await dbEngine.contracts.get(inv.contractId);
            const tenant = contract ? await dbEngine.tenants.get(contract.tenantId) : null;
            const unit = contract ? await dbEngine.units.get(contract.unitId) : null;
            
            const exists = await dbEngine.outgoingNotifications.where({ 
                recipientContact: tenant?.phone || '', 
                type: 'INVOICE_OVERDUE',
                refId: inv.id 
            }).first();
            
            if (!exists && tenant) {
                const balance = inv.amount + (inv.taxAmount || 0) - inv.paidAmount;
                const message = `عزيزي ${tenant.name}، نود تذكيركم بوجود فاتورة مستحقة للوحدة (${unit?.name}) بمبلغ ${formatCurrency(balance)}، استحقت بتاريخ ${inv.dueDate}. يرجى السداد في أقرب وقت.`;
                await dataService.add('outgoingNotifications', {
                    recipientName: tenant.name,
                    recipientContact: tenant.phone,
                    message,
                    type: 'INVOICE_OVERDUE',
                    status: 'PENDING',
                    refId: inv.id
                }, user, settings);
                count++;
            }
        }
        
        return count;
    },
    createContract: async (contractData: any, user: User | null | undefined): Promise<any> => {
        let result;
        // Idempotency check: prevent duplicate contracts for same unit/tenant in same period
        const existing = await dbEngine.contracts
            .where({ unitId: contractData.unitId, tenantId: contractData.tenantId })
            .filter((c: any) => c.start === contractData.start && c.status === 'ACTIVE')
            .first();
        if (existing) {
            toast.error("هذا العقد موجود بالفعل.");
            return existing;
        }

        await dbEngine.transaction('rw', [dbEngine.governance, dbEngine.contracts, dbEngine.units, dbEngine.invoices, dbEngine.auditLog, dbEngine.serials], async (tx: any) => {
            const { unitId, tenantId, start, end, rent: totalAmount, paymentCycle = 'Monthly' } = contractData;
            
            // 1) Check unit status
            const unit = await tx.table('units').get(unitId);
            if (!unit) throw new Error('الوحدة غير موجودة');
            if (unit.status !== 'AVAILABLE') throw new Error('الوحدة غير متاحة للتأجير');

            // 2) Insert contract
            const contractId = crypto.randomUUID();
            const contract = { ...contractData, id: contractId, status: 'ACTIVE', createdAt: Date.now() };
            await tx.table('contracts').add(contract);

            // 3) Update unit status -> "OCCUPIED"
            await tx.table('units').update(unitId, { status: 'OCCUPIED' });

            // 4) Auto-generate installments
            const startDate = new Date(start);
            const endDate = new Date(end);
            let months = (endDate.getFullYear() - startDate.getFullYear()) * 12 + (endDate.getMonth() - startDate.getMonth());
            if (endDate.getDate() >= startDate.getDate()) months++;
            
            let count = 1;
            if (paymentCycle === 'Monthly') count = months;
            else if (paymentCycle === 'Quarterly') count = Math.ceil(months / 3);
            else if (paymentCycle === 'Annual') count = Math.ceil(months / 12);
            
            if (count <= 0) count = 1;

            const base = Math.floor((totalAmount / count) * 100) / 100;
            let sum = 0;
            
            for (let i = 0; i < count; i++) {
                let amount = base;
                if (i === count - 1) {
                    amount = Math.round((totalAmount - sum) * 100) / 100;
                }
                sum += amount;
                
                const dueDate = new Date(startDate);
                if (paymentCycle === 'Monthly') dueDate.setMonth(startDate.getMonth() + i);
                else if (paymentCycle === 'Quarterly') dueDate.setMonth(startDate.getMonth() + (i * 3));
                else if (paymentCycle === 'Annual') dueDate.setFullYear(startDate.getFullYear() + i);
                
                const invoiceId = crypto.randomUUID();
                let newInvoiceNo = '';
                const s = await tx.table('serials').get(STATIC_ID);
                if (s) { s.invoice++; newInvoiceNo = String(s.invoice); await tx.table('serials').put(s); }

                const invoice = {
                    id: invoiceId,
                    contractId,
                    no: newInvoiceNo,
                    type: 'RENT',
                    amount,
                    paidAmount: 0,
                    dueDate: getLocalISODate(dueDate),
                    status: 'UNPAID',
                    notes: `دفعة إيجار رقم ${i + 1}`,
                    createdAt: Date.now()
                };
                await tx.table('invoices').add(invoice);
            }

            // 5) Write audit log
            await dataService.audit(user, 'CREATE', 'contracts', contractId, 'تم إنشاء عقد جديد');
            result = contract;
        });
        toast.success('تم إنشاء العقد وتوليد الفواتير بنجاح.');
        return result;
    },
    payInstallment: async (invoiceId: string, paymentDate: string, user: User | null | undefined, settings: Settings, receiptNo?: string, amount?: number): Promise<any> => {
        let resultReceipt;
        // Idempotency: check if invoice is already paid
        const invCheck = await dbEngine.invoices.get(invoiceId);
        if (invCheck?.status === 'PAID') {
            toast.error("هذه الفاتورة مدفوعة مسبقاً.");
            return null;
        }

        await dbEngine.transaction('rw', [dbEngine.governance, dbEngine.receipts, dbEngine.receiptAllocations, dbEngine.invoices, dbEngine.journalEntries, dbEngine.auditLog, dbEngine.serials], async (tx: any) => {
            const invoice = await tx.table('invoices').get(invoiceId);
            if (!invoice) throw new Error('الفاتورة غير موجودة');
            if (invoice.status === 'PAID') throw new Error('الفاتورة مدفوعة مسبقاً');
            
            // 1) Get Serial
            let newReceiptNo = receiptNo;
            if (!newReceiptNo) {
                const s = await tx.table('serials').get(STATIC_ID);
                if (s) { s.receipt++; newReceiptNo = String(s.receipt); await tx.table('serials').put(s); }
            }

            // 2) Insert receipt
            const receiptId = crypto.randomUUID();
            const receipt: Receipt = {
                id: receiptId,
                no: newReceiptNo!,
                contractId: invoice.contractId,
                dateTime: paymentDate + 'T12:00:00',
                amount: amount || (invoice.amount + (invoice.taxAmount || 0) - invoice.paidAmount),
                channel: 'CASH',
                status: 'POSTED',
                createdAt: Date.now(),
                notes: `سداد فاتورة رقم ${invoice.no || ''}`,
                ref: ''
            };
            await tx.table('receipts').add(receipt);

            // 3) Create Allocation
            const allocId = crypto.randomUUID();
            await tx.table('receiptAllocations').add({
                id: allocId,
                receiptId,
                invoiceId,
                amount: receipt.amount,
                createdAt: Date.now()
            });

            // 4) Update Invoice
            invoice.paidAmount += receipt.amount;
            invoice.status = (invoice.paidAmount >= (invoice.amount + (invoice.taxAmount || 0)) - 0.001) ? 'PAID' : 'PARTIALLY_PAID';
            await tx.table('invoices').put(invoice);

            // 5) Journal Entry
            const mappings = settings.accountMappings;
            await postJournalEntry(tx, { 
                dr: mappings.paymentMethods[receipt.channel], 
                cr: mappings.accountsReceivable, 
                amount: receipt.amount, 
                ref: receipt.id, 
                entityType: 'CONTRACT', 
                entityId: receipt.contractId, 
                date: receipt.dateTime 
            });

            // 6) Audit
            await dataService.audit(user, 'CREATE', 'receipts', receiptId, `تحصيل فاتورة رقم ${invoice.no || ''}`);
            resultReceipt = receipt;
        });
        toast.success('تم تسجيل الدفعة بنجاح.');
        await rebuildSnapshotsFromJournal();
        return resultReceipt;
    },
    addManualJournalVoucher: async (data: any, user: User | null | undefined): Promise<void> => {
        await dbEngine.transaction('rw', [dbEngine.governance, dbEngine.journalEntries, dbEngine.auditLog, dbEngine.serials], async (tx: any) => {
            const { dr, cr, amount, date, notes } = data;
            await postJournalEntry(tx, { dr, cr, amount, ref: 'MANUAL', date, entityType: undefined, entityId: undefined });
            await dataService.audit(user, 'CREATE', 'journalEntries', 'MANUAL', `قيد يدوي: ${notes}`);
        });
        toast.success('تم إضافة القيد المحاسبي بنجاح.');
        await rebuildSnapshotsFromJournal();
    },
    payoutCommission: async (id: string, user: User | null | undefined) => {
        await dbEngine.transaction('rw', [dbEngine.commissions, dbEngine.auditLog], async (tx: any) => {
            const comm = await tx.table('commissions').get(id);
            if (!comm) throw new Error('العمولة غير موجودة');
            if (comm.status === 'PAID') throw new Error('العمولة مدفوعة مسبقاً');
            
            await tx.table('commissions').update(id, { status: 'PAID', paidAt: Date.now() });
            await dataService.audit(user, 'UPDATE', 'commissions', id, 'صرف عمولة');
        });
        toast.success('تم صرف العمولة بنجاح.');
    },
    voidOwnerSettlement: async (id: string, user: User | null | undefined): Promise<void> => {
        await dbEngine.transaction('rw', [dbEngine.ownerSettlements, dbEngine.journalEntries, dbEngine.auditLog], async (tx: any) => {
            const settlement = await tx.table('ownerSettlements').get(id);
            if (!settlement || settlement.status === 'VOID') throw new Error('التسوية غير موجودة أو ملغاة مسبقاً');

            // Void Journal Entries
            if (settlement.journalEntryIds) {
                await tx.table('journalEntries').bulkDelete(settlement.journalEntryIds);
            } else {
                // Fallback for older settlements
                await tx.table('journalEntries').deleteWhere('sourceId', id);
            }

            await tx.table('ownerSettlements').update(id, { status: 'VOID' });
            await dataService.audit(user, 'VOID', 'ownerSettlements', id, 'إلغاء تسوية مالك');
        });
        await rebuildSnapshotsFromJournal();
    },
    processMaintenanceCompletion: async (recordId: string, user: User | null | undefined, settings: Settings): Promise<void> => {
        await dbEngine.transaction('rw', [
            dbEngine.maintenanceRecords, dbEngine.expenses, dbEngine.invoices, 
            dbEngine.journalEntries, dbEngine.serials, dbEngine.auditLog, dbEngine.governance,
            dbEngine.units, dbEngine.contracts, dbEngine.owners, dbEngine.properties
        ], async (tx: any) => {
            const record = await tx.table('maintenanceRecords').get(recordId);
            if (!record || record.status !== 'COMPLETED' || record.financialStatus === 'PROCESSED') return;

            const unit = await tx.table('units').get(record.unitId);
            const activeContract = await tx.table('contracts').where('unitId').equals(record.unitId).toArray();
            const activeC = activeContract.find((c: any) => c.status === 'ACTIVE');

            if (record.cost > 0) {
                if (record.chargedTo === 'OWNER' || record.chargedTo === 'OFFICE') {
                    // Create Expense
                    const expenseId = crypto.randomUUID();
                    let expenseNo = '';
                    const s = await tx.table('serials').get(STATIC_ID);
                    if (s) { s.expense++; expenseNo = String(s.expense); await tx.table('serials').put(s); }

                    const expense: Expense = {
                        id: expenseId,
                        no: expenseNo,
                        contractId: activeC?.id || null,
                        propertyId: unit?.propertyId || null,
                        dateTime: getLocalISODate(),
                        category: 'MAINTENANCE',
                        amount: record.cost,
                        status: 'POSTED',
                        chargedTo: record.chargedTo,
                        ref: record.id,
                        notes: `تكلفة صيانة طلب رقم ${record.no}: ${record.description}`
                    };
                    await tx.table('expenses').add(expense);
                    
                    // Accounting for Expense
                    const m = settings.accountMappings;
                    const payAcc = m.paymentMethods.CASH;
                    if (record.chargedTo === 'OWNER') {
                        await postJournalEntry(tx, { dr: m.ownersPayable, cr: payAcc, amount: record.cost, ref: expenseId, date: expense.dateTime });
                    } else {
                        const expAcc = m.expenseCategories.MAINTENANCE || m.expenseCategories.default;
                        await postJournalEntry(tx, { dr: expAcc, cr: payAcc, amount: record.cost, ref: expenseId, date: expense.dateTime });
                    }

                    await tx.table('maintenanceRecords').update(recordId, { expenseId, financialStatus: 'PROCESSED' });
                } else if (record.chargedTo === 'TENANT') {
                    if (!activeC) throw new Error("لا يوجد عقد نشط لتحميل التكلفة على المستأجر.");

                    // Create Invoice
                    const invoiceId = crypto.randomUUID();
                    let invoiceNo = '';
                    const s = await tx.table('serials').get(STATIC_ID);
                    if (s) { s.invoice++; invoiceNo = String(s.invoice); await tx.table('serials').put(s); }

                    const invoice: Invoice = {
                        id: invoiceId,
                        contractId: activeC.id,
                        no: invoiceNo,
                        type: 'MAINTENANCE',
                        amount: record.cost,
                        paidAmount: 0,
                        dueDate: getLocalISODate(),
                        status: 'UNPAID',
                        notes: `تكلفة صيانة طلب رقم ${record.no}`,
                        createdAt: Date.now()
                    };
                    await tx.table('invoices').add(invoice);

                    // Accounting for Invoice (AR)
                    const m = settings.accountMappings;
                    await postJournalEntry(tx, { 
                        dr: m.accountsReceivable, 
                        cr: m.ownersPayable, 
                        amount: record.cost, 
                        ref: invoiceId, 
                        entityType: 'CONTRACT', 
                        entityId: activeC.id, 
                        date: invoice.dueDate 
                    });

                    await tx.table('maintenanceRecords').update(recordId, { invoiceId, financialStatus: 'PROCESSED' });
                }
            } else {
                await tx.table('maintenanceRecords').update(recordId, { financialStatus: 'SKIPPED' });
            }

            await dataService.audit(user, 'PROCESS_FINANCIAL', 'maintenanceRecords', recordId, 'معالجة التكاليف المالية للصيانة');
        });
        await rebuildSnapshotsFromJournal();
    }
};
