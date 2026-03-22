
import { Database, Account, AgedDebt, JournalEntry, Invoice, Contract, Tenant } from '../../types';
import { differenceInDays } from 'date-fns';

const n = (val: any) => typeof val === 'number' && isFinite(val) ? val : 0;

const getAccountBalance = (accountId: string, balances: Map<string, number>, childrenMap: Map<string, string[]>) => {
    let total = balances.get(accountId) || 0;
    const children = childrenMap.get(accountId);
    if (children) {
        children.forEach(childId => {
            total += getAccountBalance(childId, balances, childrenMap);
        });
    }
    return total;
};

export const calculateIncomeStatementData = (db: Database, startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const balances = new Map<string, number>();

    db.accounts.forEach((acc: Account) => balances.set(acc.id, 0));
    
    db.journalEntries
      .filter((je: JournalEntry) => { const d = new Date(je.date); return d >= start && d <= end; })
      .forEach((je: JournalEntry) => {
        const currentBalance = balances.get(je.accountId) || 0;
        const amount = je.type === 'DEBIT' ? je.amount : -je.amount;
        balances.set(je.accountId, currentBalance + amount);
    });

    const revenues = db.accounts.filter((acc: Account) => acc.type === 'REVENUE').map((acc: Account) => ({ no: acc.no, name: acc.name, balance: -n(balances.get(acc.id)) })).filter((r: any) => r.balance !== 0);
    const expenses = db.accounts.filter((acc: Account) => acc.type === 'EXPENSE').map((acc: Account) => ({ no: acc.no, name: acc.name, balance: n(balances.get(acc.id)) })).filter((e: any) => e.balance !== 0);

    const totalRevenue = revenues.reduce((sum: number, item: any) => sum + item.balance, 0);
    const totalExpense = expenses.reduce((sum: number, item: any) => sum + item.balance, 0);
    
    return { revenues, expenses, totalRevenue, totalExpense, netIncome: totalRevenue - totalExpense };
};

export const calculateBalanceSheetData = (db: Database, asOfDate: string) => {
    const end = new Date(asOfDate);
    const balances = new Map<string, number>();
    db.accounts.forEach((acc: Account) => balances.set(acc.id, 0));

    db.journalEntries.filter((je: JournalEntry) => new Date(je.date) <= end).forEach((je: JournalEntry) => {
        const currentBalance = balances.get(je.accountId) || 0;
        const amount = je.type === 'DEBIT' ? je.amount : -je.amount;
        balances.set(je.accountId, currentBalance + amount);
    });

    const childrenMap = new Map<string, string[]>();
    db.accounts.forEach((acc: Account) => {
        if (acc.parentId) {
            if (!childrenMap.has(acc.parentId)) childrenMap.set(acc.parentId, []);
            childrenMap.get(acc.parentId)!.push(acc.id);
        }
    });

    const buildHierarchy = (type: Account['type']): any[] => {
        return db.accounts.filter((a: Account) => a.type === type && !a.parentId).map((acc: Account) => ({
            no: acc.no,
            name: acc.name,
            balance: getAccountBalance(acc.id, balances, childrenMap)
        })).filter((a: any) => a.balance !== 0);
    };

    const assets = buildHierarchy('ASSET');
    const liabilities = buildHierarchy('LIABILITY');
    const equity = buildHierarchy('EQUITY');

    return {
        assets, liabilities, equity,
        totalAssets: assets.reduce((s: number, a: any) => s + a.balance, 0),
        totalLiabilities: liabilities.reduce((s: number, l: any) => s + Math.abs(l.balance), 0),
        totalEquity: equity.reduce((s: number, e: any) => s + Math.abs(e.balance), 0)
    };
};

export const calculateAgingReport = (db: Database): AgedDebt[] => {
    const today = new Date();
    const debts = new Map<string, AgedDebt>();

    db.invoices.filter((inv: Invoice) => ['UNPAID', 'PARTIALLY_PAID', 'OVERDUE'].includes(inv.status)).forEach((inv: Invoice) => {
        const contract = db.contracts.find((c: Contract) => c.id === inv.contractId);
        const tenant = db.tenants.find((t: Tenant) => t.id === contract?.tenantId);
        if (!tenant) return;

        if (!debts.has(tenant.id)) {
            debts.set(tenant.id, { tenantName: tenant.name, totalDue: 0, current: 0, thirtyPlus: 0, sixtyPlus: 0, ninetyPlus: 0 });
        }

        const debt = debts.get(tenant.id)!;
        const amount = (inv.amount + (inv.taxAmount || 0)) - inv.paidAmount;
        const daysOverdue = differenceInDays(today, new Date(inv.dueDate));

        debt.totalDue += amount;
        if (daysOverdue <= 0) debt.current += amount;
        else if (daysOverdue <= 30) debt.thirtyPlus += amount;
        else if (daysOverdue <= 90) debt.sixtyPlus += amount;
        else debt.ninetyPlus += amount;
    });

    return Array.from(debts.values()).sort((a, b) => b.totalDue - a.totalDue);
};
