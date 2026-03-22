
import { Database, Contract, Unit, Tenant, Property, MaintenanceRecord, DerivedData, UtilityService } from '../types';

export const selectContractsWithDetails = (db: Database, contractBalances: DerivedData['contractBalances']) => {
  const alertDate = new Date();
  alertDate.setDate(alertDate.getDate() + (db.settings?.contractAlertDays || 30));

  return db.contracts.map(c => {
    const unit = db.units.find(u => u.id === c.unitId);
    const tenant = db.tenants.find(t => t.id === c.tenantId);
    const balance = contractBalances[c.id]?.balance || 0;
    const isExpiring = c.status === 'ACTIVE' && new Date(c.end) <= alertDate && new Date(c.end) >= new Date();
    
    let risk: 'high' | 'medium' | 'low' = 'low';
    if (balance > 0) risk = 'high';
    else if (isExpiring) risk = 'medium';

    return { 
      ...c, 
      unitName: unit?.name || 'N/A',
      tenantName: tenant?.name || 'N/A',
      balance, 
      isExpiring, 
      risk 
    };
  });
};

export const selectMaintenanceWithDetails = (db: Database) => {
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

  return db.maintenanceRecords.map(rec => {
    const unit = db.units.find(u => u.id === rec.unitId);
    const property = unit ? db.properties.find(p => p.id === unit.propertyId) : null;
    
    return {
      ...rec,
      unitName: unit?.name || 'N/A',
      propertyName: property?.name || 'N/A',
      isAging: rec.status === 'NEW' && new Date(rec.requestDate) < threeDaysAgo
    };
  });
};

export const selectPropertiesWithDetails = (db: Database) => {
  const rentedUnitIds = new Set(db.contracts.filter(c => c.status === 'ACTIVE').map(c => c.unitId));
  return db.properties.map(p => {
    const owner = db.owners.find(o => o.id === p.ownerId);
    const units = db.units.filter(u => u.propertyId === p.id);
    const occupiedCount = units.filter(u => rentedUnitIds.has(u.id)).length;
    
    return {
      ...p,
      ownerName: owner?.name || 'N/A',
      unitCount: units.length,
      occupiedCount,
      occupancyRate: units.length > 0 ? (occupiedCount / units.length) * 100 : 0
    };
  });
};

export const selectExpensesWithDetails = (db: Database) => {
  const { expenses, properties, contracts, units } = db;
  return expenses.map(e => {
    let relatedName = 'عام';
    if (e.propertyId) {
      const prop = properties.find(p => p.id === e.propertyId);
      relatedName = prop ? `عقار: ${prop.name}` : 'عقار غير معروف';
    } else if (e.contractId) {
      const contract = contracts.find(c => c.id === e.contractId);
      const unit = contract ? units.find(u => u.id === contract.unitId) : null;
      relatedName = unit ? `وحدة: ${unit.name}` : 'عقد غير معروف';
    }
    return {
      ...e,
      relatedName
    };
  });
};

export const selectPropertyFinancials = (db: Database, propertyId: string, contractBalances: DerivedData['contractBalances']) => {
  const property = db.properties.find(p => p.id === propertyId);
  const units = db.units.filter(u => u.propertyId === propertyId);
  const unitIds = new Set(units.map(u => u.id));
  const contracts = db.contracts.filter(c => unitIds.has(c.unitId));
  const contractIds = new Set(contracts.map(c => c.id));

  // 1. Total Rental Income (Invoiced RENT)
  const totalRentalIncome = db.invoices
    .filter(inv => contractIds.has(inv.contractId) && inv.type === 'RENT' && inv.status !== 'VOID')
    .reduce((sum, inv) => sum + inv.amount, 0);

  // 2. Total Property-level Expenses
  const propertyExpenses = db.expenses
    .filter(e => e.propertyId === propertyId && e.status === 'POSTED')
    .reduce((sum, e) => sum + e.amount, 0);

  // 3. Maintenance Costs
  const maintenanceCosts = db.maintenanceRecords
    .filter(m => unitIds.has(m.unitId) && m.status === 'COMPLETED')
    .reduce((sum, m) => sum + m.cost, 0);

  // 4. Service/Utility Costs
  const utilityCosts = (db.utilityServices || [])
    .filter(u => u.propertyId === propertyId && u.status === 'PAID')
    .reduce((sum, u) => sum + u.amount, 0);

  // 5. Current Arrears
  const currentArrears = Object.values(contractBalances)
    .filter(cb => unitIds.has(cb.unitId))
    .reduce((sum, cb) => sum + cb.balance, 0);

  // 6. Net Property Result
  const netResult = totalRentalIncome - propertyExpenses - maintenanceCosts - utilityCosts;

  // 7. Occupancy/Vacancy Summary
  const activeContracts = contracts.filter(c => c.status === 'ACTIVE');
  const occupiedCount = activeContracts.length;
  const vacancyCount = units.length - occupiedCount;

  return {
    property,
    totalRentalIncome,
    propertyExpenses,
    maintenanceCosts,
    utilityCosts,
    currentArrears,
    netResult,
    occupancySummary: {
      totalUnits: units.length,
      occupiedCount,
      vacancyCount,
      occupancyRate: units.length > 0 ? (occupiedCount / units.length) * 100 : 0
    }
  };
};
