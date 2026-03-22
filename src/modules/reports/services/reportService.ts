
import { Database, JournalEntry, Invoice, Receipt, Expense, OwnerSettlement, Property, Unit, Contract, Tenant } from '../../../types';
import { differenceInDays, isBefore, isAfter, parseISO, startOfDay } from 'date-fns';

export interface StatementTransaction {
    id: string;
    date: string;
    type: string;
    description: string;
    ref: string;
    debit: number;
    credit: number;
    balance: number;
    status?: string;
}

export const getOwnerStatement = (
    db: Database,
    ownerId: string,
    startDate: string,
    endDate: string,
    propertyId?: string,
    unitId?: string,
    includeVoided: boolean = false
) => {
    const start = startOfDay(parseISO(startDate));
    const end = startOfDay(parseISO(endDate));
    
    // Get all properties for this owner
    const ownerProperties = db.properties.filter((p: Property) => p.ownerId === ownerId && (!propertyId || p.id === propertyId));
    const ownerPropertyIds = ownerProperties.map((p: Property) => p.id);
    
    // Get all units for these properties
    const ownerUnits = db.units.filter((u: Unit) => ownerPropertyIds.includes(u.propertyId) && (!unitId || u.id === unitId));
    const ownerUnitIds = ownerUnits.map((u: Unit) => u.id);
    
    // Get all contracts for these units
    const ownerContracts = db.contracts.filter((c: Contract) => ownerUnitIds.includes(c.unitId));
    const ownerContractIds = ownerContracts.map((c: Contract) => c.id);

    // Mappings for accounts
    const mappings = db.settings.accountMappings;
    const ownersPayableAcc = mappings.ownersPayable;

    // Filter journal entries related to this owner's payable account
    // We need to find entries where the sourceId links to something belonging to this owner
    // Or entries that explicitly have entityId = ownerId (if we used that, but we mostly use sourceId mapping)
    
    // Helper to check if a sourceId belongs to this owner
    const belongsToOwner = (sourceId: string): boolean => {
        const receipt = db.receipts.find((r: Receipt) => r.id === sourceId);
        if (receipt) return ownerContractIds.includes(receipt.contractId);
        
        const expense = db.expenses.find((e: Expense) => e.id === sourceId);
        if (expense) {
            if (expense.contractId) return ownerContractIds.includes(expense.contractId);
            // If no contract, check if it's an owner expense directly (we might need propertyId on expense)
            // For now, if it's charged to OWNER and we have property/unit filters, it's tricky if expense doesn't have them.
            // Let's assume expenses without contractId are general and we only filter them if no property/unit filter is active
            if (expense.chargedTo === 'OWNER') return true; 
        }

        const settlement = db.ownerSettlements.find((s: OwnerSettlement) => s.id === sourceId);
        if (settlement) return settlement.ownerId === ownerId;

        const invoice = db.invoices.find((i: Invoice) => i.id === sourceId);
        if (invoice) return ownerContractIds.includes(invoice.contractId);

        return false;
    };

    const ownerEntries = db.journalEntries.filter((je: JournalEntry) => {
        if (je.accountId !== ownersPayableAcc) return false;
        return belongsToOwner(je.sourceId);
    });

    // Opening Balance
    let openingBalance = 0;
    ownerEntries.forEach((je: JournalEntry) => {
        if (isBefore(parseISO(je.date), start)) {
            // Owners Payable is a liability, so Credit increases it (we owe owner more)
            openingBalance += (je.type === 'CREDIT' ? je.amount : -je.amount);
        }
    });

    // Transactions in period
    const periodEntries = ownerEntries.filter((je: JournalEntry) => {
        const d = parseISO(je.date);
        return (isAfter(d, start) || je.date === startDate) && (isBefore(d, end) || je.date === endDate);
    }).sort((a: JournalEntry, b: JournalEntry) => a.date.localeCompare(b.date) || a.createdAt - b.createdAt);

    let runningBalance = openingBalance;
    const transactions: StatementTransaction[] = periodEntries.map((je: JournalEntry) => {
        const amt = je.type === 'CREDIT' ? je.amount : -je.amount;
        runningBalance += amt;

        let description = 'قيد محاسبي';
        let status = 'POSTED';

        const receipt = db.receipts.find((r: Receipt) => r.id === je.sourceId);
        if (receipt) {
            description = `تحصيل إيجار - سند رقم ${receipt.no}`;
            status = receipt.status;
        }
        const expense = db.expenses.find((e: Expense) => e.id === je.sourceId);
        if (expense) {
            description = `مصروف - ${expense.category} - رقم ${expense.no}`;
            status = expense.status;
        }
        const settlement = db.ownerSettlements.find((s: OwnerSettlement) => s.id === je.sourceId);
        if (settlement) {
            description = `صرف للمالك - رقم ${settlement.no}`;
            status = settlement.status;
        }
        const invoice = db.invoices.find((i: Invoice) => i.id === je.sourceId);
        if (invoice) {
            description = `فاتورة مستحقة - رقم ${invoice.no}`;
            status = invoice.status;
        }

        return {
            id: je.id,
            date: je.date,
            type: je.type,
            description,
            ref: je.no,
            debit: je.type === 'DEBIT' ? je.amount : 0,
            credit: je.type === 'CREDIT' ? je.amount : 0,
            balance: runningBalance,
            status
        };
    });

    const filteredTransactions = includeVoided ? transactions : transactions.filter((t: StatementTransaction) => t.status !== 'VOID');

    const summary = {
        openingBalance,
        totalBilled: filteredTransactions.reduce((s: number, t: StatementTransaction) => s + (t.description.includes('فاتورة') ? t.credit : 0), 0),
        totalCollected: filteredTransactions.reduce((s: number, t: StatementTransaction) => s + (t.description.includes('تحصيل') ? t.credit : 0), 0),
        totalExpenses: filteredTransactions.reduce((s: number, t: StatementTransaction) => s + t.debit, 0),
        closingBalance: runningBalance
    };

    return { transactions: filteredTransactions, summary };
};

export const getTenantStatement = (
    db: Database,
    tenantId: string,
    startDate: string,
    endDate: string,
    contractId?: string,
    includeVoided: boolean = false
) => {
    const start = startOfDay(parseISO(startDate));
    const end = startOfDay(parseISO(endDate));

    const tenantContracts = db.contracts.filter((c: Contract) => c.tenantId === tenantId && (!contractId || c.id === contractId));
    const contractIds = tenantContracts.map((c: Contract) => c.id);

    const mappings = db.settings.accountMappings;
    const arAcc = mappings.accountsReceivable;

    const tenantEntries = db.journalEntries.filter((je: JournalEntry) => {
        if (je.accountId !== arAcc) return false;
        if (je.entityType !== 'CONTRACT') return false;
        return contractIds.includes(je.entityId || '');
    });

    let openingBalance = 0;
    tenantEntries.forEach((je: JournalEntry) => {
        if (isBefore(parseISO(je.date), start)) {
            // AR is an asset, so Debit increases it
            openingBalance += (je.type === 'DEBIT' ? je.amount : -je.amount);
        }
    });

    const periodEntries = tenantEntries.filter((je: JournalEntry) => {
        const d = parseISO(je.date);
        return (isAfter(d, start) || je.date === startDate) && (isBefore(d, end) || je.date === endDate);
    }).sort((a: JournalEntry, b: JournalEntry) => a.date.localeCompare(b.date) || a.createdAt - b.createdAt);

    let runningBalance = openingBalance;
    const transactions: StatementTransaction[] = periodEntries.map((je: JournalEntry) => {
        const amt = je.type === 'DEBIT' ? je.amount : -je.amount;
        runningBalance += amt;

        let description = 'قيد محاسبي';
        let status = 'POSTED';

        const invoice = db.invoices.find((i: Invoice) => i.id === je.sourceId);
        if (invoice) {
            description = `فاتورة رقم ${invoice.no} - ${invoice.type}`;
            status = invoice.status;
        }
        const receipt = db.receipts.find((r: Receipt) => r.id === je.sourceId);
        if (receipt) {
            description = `سند قبض رقم ${receipt.no}`;
            status = receipt.status;
        }

        return {
            id: je.id,
            date: je.date,
            type: je.type,
            description,
            ref: je.no,
            debit: je.type === 'DEBIT' ? je.amount : 0,
            credit: je.type === 'CREDIT' ? je.amount : 0,
            balance: runningBalance,
            status
        };
    });

    const filteredTransactions = includeVoided ? transactions : transactions.filter((t: StatementTransaction) => t.status !== 'VOID');

    return {
        transactions: filteredTransactions,
        summary: {
            openingBalance,
            totalInvoiced: filteredTransactions.reduce((s: number, t: StatementTransaction) => s + t.debit, 0),
            totalPaid: filteredTransactions.reduce((s: number, t: StatementTransaction) => s + t.credit, 0),
            closingBalance: runningBalance
        }
    };
};

export const getUnitLedger = (db: Database, unitId: string, startDate: string, endDate: string) => {
    const start = startOfDay(parseISO(startDate));
    const end = startOfDay(parseISO(endDate));

    const unit = db.units.find((u: Unit) => u.id === unitId);
    const contracts = db.contracts.filter((c: Contract) => c.unitId === unitId).sort((a: Contract, b: Contract) => a.start.localeCompare(b.start));
    
    const timeline = contracts.map((c: Contract) => {
        const tenant = db.tenants.find((t: Tenant) => t.id === c.tenantId);
        return {
            period: `${c.start} إلى ${c.end}`,
            tenantName: tenant?.name || 'غير معروف',
            rent: c.rent,
            status: c.status
        };
    });

    const invoices = db.invoices.filter((i: Invoice) => {
        const contract = db.contracts.find((c: Contract) => c.id === i.contractId);
        if (contract?.unitId !== unitId) return false;
        const d = parseISO(i.dueDate);
        return (isAfter(d, start) || i.dueDate === startDate) && (isBefore(d, end) || i.dueDate === endDate);
    });

    const maintenance = db.maintenanceRecords.filter((m: any) => {
        if (m.unitId !== unitId) return false;
        const d = parseISO(m.requestDate);
        return (isAfter(d, start) || m.requestDate === startDate) && (isBefore(d, end) || m.requestDate === endDate);
    });

    return {
        unit,
        timeline,
        stats: {
            totalBilled: invoices.reduce((s: number, i: Invoice) => s + i.amount + (i.taxAmount || 0), 0),
            totalCollected: invoices.reduce((s: number, i: Invoice) => s + i.paidAmount, 0),
            maintenanceCost: maintenance.reduce((s: number, m: any) => s + m.cost, 0)
        },
        maintenance
    };
};

export const getCollectionsReport = (db: Database, startDate: string, endDate: string, groupBy: 'day' | 'month' = 'day') => {
    const start = startOfDay(parseISO(startDate));
    const end = startOfDay(parseISO(endDate));

    const receipts = db.receipts.filter((r: Receipt) => {
        if (r.status === 'VOID') return false;
        const d = parseISO(r.dateTime);
        return (isAfter(d, start) || r.dateTime.startsWith(startDate)) && (isBefore(d, end) || r.dateTime.startsWith(endDate));
    });

    const grouped = new Map<string, number>();
    receipts.forEach((r: Receipt) => {
        const dateKey = groupBy === 'day' ? r.dateTime.slice(0, 10) : r.dateTime.slice(0, 7);
        grouped.set(dateKey, (grouped.get(dateKey) || 0) + r.amount);
    });

    const chartData = Array.from(grouped.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a: any, b: any) => a.name.localeCompare(b.name));

    const overdueInvoices = db.invoices.filter((i: Invoice) => i.status !== 'PAID' && i.status !== 'VOID' && isBefore(parseISO(i.dueDate), new Date()));

    return {
        totalCollected: receipts.reduce((s: number, r: Receipt) => s + r.amount, 0),
        chartData,
        overdueCount: overdueInvoices.length,
        overdueTotal: overdueInvoices.reduce((s: number, i: Invoice) => s + (i.amount + (i.taxAmount || 0)) - i.paidAmount, 0)
    };
};

export const getMaintenanceReport = (db: Database, startDate: string, endDate: string, propertyId?: string) => {
    const start = startOfDay(parseISO(startDate));
    const end = startOfDay(parseISO(endDate));

    const records = db.maintenanceRecords.filter((m: any) => {
        const d = parseISO(m.requestDate);
        const inDate = (isAfter(d, start) || m.requestDate === startDate) && (isBefore(d, end) || m.requestDate === endDate);
        if (!inDate) return false;

        if (propertyId) {
            const unit = db.units.find((u: Unit) => u.id === m.unitId);
            return unit?.propertyId === propertyId;
        }
        return true;
    });

    const byStatus = {
        NEW: records.filter((r: any) => r.status === 'NEW').length,
        IN_PROGRESS: records.filter((r: any) => r.status === 'IN_PROGRESS').length,
        COMPLETED: records.filter((r: any) => r.status === 'COMPLETED').length,
        CLOSED: records.filter((r: any) => r.status === 'CLOSED').length,
    };

    return {
        records,
        totalCost: records.reduce((s: number, r: any) => s + r.cost, 0),
        byStatus
    };
};
