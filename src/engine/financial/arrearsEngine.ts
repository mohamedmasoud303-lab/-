
import { Database, ContractBalance, TenantBalance, AgedDebt } from '../../core/types';

/**
 * Centralized engine for calculating tenant arrears and aging.
 */
export const arrearsEngine = {
  /**
   * Calculates contract-level arrears.
   * Arrears = Total Invoiced - Total Paid (represented by the balance in Accounts Receivable)
   */
  getContractArrears: (contractId: string, contractBalances: Record<string, ContractBalance>): number => {
    return contractBalances[contractId]?.balance || 0;
  },

  /**
   * Calculates tenant-level arrears across all their contracts.
   */
  getTenantArrears: (tenantId: string, contractBalances: Record<string, ContractBalance>): number => {
    return Object.values(contractBalances)
      .filter(cb => cb.tenantId === tenantId)
      .reduce((sum, cb) => sum + cb.balance, 0);
  },

  /**
   * Calculates property-level arrears across all units in the property.
   */
  getPropertyArrears: (propertyId: string, db: Database, contractBalances: Record<string, ContractBalance>): number => {
    const propertyUnitIds = new Set(db.units.filter(u => u.propertyId === propertyId).map(u => u.id));
    return Object.values(contractBalances)
      .filter(cb => propertyUnitIds.has(cb.unitId))
      .reduce((sum, cb) => sum + cb.balance, 0);
  },

  /**
   * Calculates aging buckets for a specific contract or tenant.
   * This requires looking at individual unpaid invoices.
   */
  calculateAging: (db: Database, tenantId?: string): AgedDebt[] => {
    const now = new Date();
    const results: AgedDebt[] = [];

    const tenants = tenantId 
      ? db.tenants.filter(t => t.id === tenantId)
      : db.tenants;

    tenants.forEach(tenant => {
      const tenantInvoices = db.invoices.filter(inv => {
        const contract = db.contracts.find(c => c.id === inv.contractId);
        return contract?.tenantId === tenant.id && inv.status !== 'PAID' && inv.status !== 'VOID';
      });

      const aged: AgedDebt = {
        tenantName: tenant.name,
        totalDue: 0,
        current: 0,
        thirtyPlus: 0,
        sixtyPlus: 0,
        ninetyPlus: 0
      };

      tenantInvoices.forEach(inv => {
        const dueDate = new Date(inv.dueDate);
        const diffDays = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
        const remainingAmount = inv.amount - (inv.paidAmount || 0);

        if (remainingAmount <= 0) return;

        aged.totalDue += remainingAmount;

        if (diffDays <= 0) {
          // Not yet due, but we might want to track it as current if it's due today or in the future?
          // Usually "Current" means 0-30 days past due.
          aged.current += remainingAmount;
        } else if (diffDays <= 30) {
          aged.current += remainingAmount;
        } else if (diffDays <= 60) {
          aged.thirtyPlus += remainingAmount;
        } else if (diffDays <= 90) {
          aged.sixtyPlus += remainingAmount;
        } else {
          aged.ninetyPlus += remainingAmount;
        }
      });

      if (aged.totalDue > 0) {
        results.push(aged);
      }
    });

    return results;
  }
};
