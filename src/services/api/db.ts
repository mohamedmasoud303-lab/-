import { supabase } from '../../lib/supabase';
import { Database } from '../../types';
import { logger } from '../../lib/logger';

// Helper functions for snake_case <-> camelCase conversion
function toSnakeCase(str: string): string {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, g => g[1].toUpperCase());
}

function transformKeys(obj: any, transformer: (s: string) => string): any {
  if (obj === null || typeof obj !== 'object' || obj instanceof Date) return obj;
  if (Array.isArray(obj)) return obj.map(v => transformKeys(v, transformer));
  
  const newObj: any = {};
  for (const [key, value] of Object.entries(obj)) {
    // Don't transform keys that look like IDs or are already transformed
    const newKey = transformer(key);
    newObj[newKey] = transformKeys(value, transformer);
  }
  return newObj;
}

class SupabaseTableWrapper {
  constructor(public tableName: string) {}

  async get(id: any) {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) return null;
    return transformKeys(data, toCamelCase);
  }

  async toArray() {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*');
    if (error) return [];
    return transformKeys(data || [], toCamelCase);
  }

  async add(item: any) {
    const snakeItem = transformKeys(item, toSnakeCase);
    const { data, error } = await supabase
      .from(this.tableName)
      .insert(snakeItem)
      .select()
      .single();
    if (error) throw error;
    return data.id;
  }

  async bulkAdd(items: any[]) {
    const snakeItems = items.map(item => transformKeys(item, toSnakeCase));
    const { data, error } = await supabase
      .from(this.tableName)
      .insert(snakeItems)
      .select();
    if (error) throw error;
    return transformKeys(data, toCamelCase);
  }

  async bulkGet(ids: any[]) {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .in('id', ids);
    if (error) return [];
    return transformKeys(data || [], toCamelCase);
  }

  async put(item: any) {
    const snakeItem = transformKeys(item, toSnakeCase);
    const { data, error } = await supabase
      .from(this.tableName)
      .upsert(snakeItem)
      .select()
      .single();
    if (error) throw error;
    return data.id;
  }

  async bulkPut(items: any[]) {
    const snakeItems = items.map(item => transformKeys(item, toSnakeCase));
    const { data, error } = await supabase
      .from(this.tableName)
      .upsert(snakeItems)
      .select();
    if (error) throw error;
    return transformKeys(data, toCamelCase);
  }

  async update(id: any, updates: any) {
    const snakeUpdates = transformKeys(updates, toSnakeCase);
    const { data, error } = await supabase
      .from(this.tableName)
      .update(snakeUpdates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return transformKeys(data, toCamelCase);
  }

  async delete(id: any) {
    const { error } = await supabase
      .from(this.tableName)
      .delete()
      .eq('id', id);
    if (error) throw error;
  }

  async bulkDelete(ids: any[]) {
    const { error } = await supabase
      .from(this.tableName)
      .delete()
      .in('id', ids);
    if (error) throw error;
  }

  async deleteWhere(field: string, value: any) {
    const { error } = await supabase
      .from(this.tableName)
      .delete()
      .eq(field, value);
    if (error) throw error;
  }

  async clear() {
    // A more robust way to delete all rows in Supabase/Postgres
    // is to use a filter that is always true.
    const { error } = await supabase
      .from(this.tableName)
      .delete()
      .not('id', 'is', null); 
    if (error) throw error;
  }

  async count() {
    const { count, error } = await supabase
      .from(this.tableName)
      .select('*', { count: 'exact', head: true });
    if (error) return 0;
    return count || 0;
  }

  where(field: string | Record<string, any>) {
    if (typeof field === 'string') {
      const snakeField = toSnakeCase(field);
      return {
        equals: (value: any) => ({
          first: async () => {
            const { data, error } = await supabase
              .from(this.tableName)
              .select('*')
              .eq(snakeField, value)
              .maybeSingle();
            if (error) return null;
            return transformKeys(data, toCamelCase);
          },
          toArray: async () => {
            const { data, error } = await supabase
              .from(this.tableName)
              .select('*')
              .eq(snakeField, value);
            if (error) return [];
            return transformKeys(data || [], toCamelCase);
          }
        })
      };
    } else {
      // Handle object-based where: where({ field1: val1, field2: val2 })
      const snakeField = transformKeys(field, toSnakeCase);
      return {
        first: async () => {
          let query = supabase.from(this.tableName).select('*');
          for (const [key, val] of Object.entries(snakeField)) {
            query = query.eq(key, val);
          }
          const { data, error } = await query.maybeSingle();
          if (error) return null;
          return transformKeys(data, toCamelCase);
        },
        toArray: async () => {
          let query = supabase.from(this.tableName).select('*');
          for (const [key, val] of Object.entries(snakeField)) {
            query = query.eq(key, val);
          }
          const { data, error } = await query;
          if (error) return [];
          return transformKeys(data || [], toCamelCase);
        },
        filter: (callback: (item: any) => boolean) => {
          return {
            first: async () => {
              let query = supabase.from(this.tableName).select('*');
              for (const [key, val] of Object.entries(snakeField)) {
                query = query.eq(key, val);
              }
              const { data, error } = await query;
              if (error || !data) return null;
              const camelData = transformKeys(data, toCamelCase);
              return camelData.find(callback) || null;
            },
            toArray: async () => {
              let query = supabase.from(this.tableName).select('*');
              for (const [key, val] of Object.entries(snakeField)) {
                query = query.eq(key, val);
              }
              const { data, error } = await query;
              if (error || !data) return [];
              const camelData = transformKeys(data, toCamelCase);
              return camelData.filter(callback);
            }
          };
        }
      };
    }
  }
}

const tablesMap: Record<string, SupabaseTableWrapper> = {
  settings: new SupabaseTableWrapper('settings'),
  users: new SupabaseTableWrapper('users'),
  owners: new SupabaseTableWrapper('owners'),
  properties: new SupabaseTableWrapper('properties'),
  units: new SupabaseTableWrapper('units'),
  tenants: new SupabaseTableWrapper('tenants'),
  contracts: new SupabaseTableWrapper('contracts'),
  invoices: new SupabaseTableWrapper('invoices'),
  receipts: new SupabaseTableWrapper('receipts'),
  receiptAllocations: new SupabaseTableWrapper('receipt_allocations'),
  expenses: new SupabaseTableWrapper('expenses'),
  maintenanceRecords: new SupabaseTableWrapper('maintenance_records'),
  depositTxs: new SupabaseTableWrapper('deposit_transactions'),
  auditLog: new SupabaseTableWrapper('audit_logs'),
  governance: new SupabaseTableWrapper('governance'),
  ownerSettlements: new SupabaseTableWrapper('owner_settlements'),
  serials: new SupabaseTableWrapper('serials'),
  snapshots: new SupabaseTableWrapper('snapshots'),
  accounts: new SupabaseTableWrapper('accounts'),
  journalEntries: new SupabaseTableWrapper('journal_entries'),
  autoBackups: new SupabaseTableWrapper('auto_backups'),
  ownerBalances: new SupabaseTableWrapper('owner_balances'),
  accountBalances: new SupabaseTableWrapper('account_balances'),
  kpiSnapshots: new SupabaseTableWrapper('kpi_snapshots'),
  contractBalances: new SupabaseTableWrapper('contract_balances'),
  tenantBalances: new SupabaseTableWrapper('tenant_balances'),
  notificationTemplates: new SupabaseTableWrapper('notification_templates'),
  outgoingNotifications: new SupabaseTableWrapper('outgoing_notifications'),
  appNotifications: new SupabaseTableWrapper('app_notifications'),
  leads: new SupabaseTableWrapper('leads'),
  lands: new SupabaseTableWrapper('lands'),
  commissions: new SupabaseTableWrapper('commissions'),
  missions: new SupabaseTableWrapper('missions'),
  budgets: new SupabaseTableWrapper('budgets'),
  attachments: new SupabaseTableWrapper('attachments'),
  utilityServices: new SupabaseTableWrapper('utility_services'),
  // Views (Read-only)
  viewPropertiesFull: new SupabaseTableWrapper('view_properties_full'),
  viewUnitsFull: new SupabaseTableWrapper('view_units_full'),
  viewTenantsFull: new SupabaseTableWrapper('view_tenants_full'),
  viewAccountBalancesFull: new SupabaseTableWrapper('view_account_balances_full'),
};

export const dbEngine: any = {
  ...tablesMap,
  tables: Object.values(tablesMap).map(t => ({
    name: (t as any).tableName,
    ...t
  })),

  transaction: async (type: string, tables: any[], callback: (tx: any) => Promise<any>) => {
    // Supabase doesn't support client-side transactions across multiple tables easily.
    // For now, we'll just execute the callback. In a real production app, 
    // we would use a Postgres function (RPC) for atomicity.
    const txMock = {
      table: (name: string) => (dbEngine as any)[name]
    };
    return await callback(txMock);
  },

  getAllData: async (): Promise<Database> => {
    const data: any = {};
    const tableNames = Object.keys(dbEngine).filter(k => dbEngine[k] instanceof SupabaseTableWrapper);
    
    await Promise.all(tableNames.map(async (name) => {
      if (['settings', 'governance', 'serials'].includes(name)) {
        data[name] = await dbEngine[name].get(1);
      } else if (name === 'users') {
        data.auth = { users: await dbEngine[name].toArray() };
      } else {
        data[name] = await dbEngine[name].toArray();
      }
    }));
    
    return data as Database;
  },

  wipeData: async () => {
    const mutableTableNames: Array<keyof typeof tablesMap> = [
      'settings',
      'users',
      'owners',
      'properties',
      'units',
      'tenants',
      'contracts',
      'invoices',
      'receipts',
      'receiptAllocations',
      'expenses',
      'maintenanceRecords',
      'depositTxs',
      'auditLog',
      'governance',
      'ownerSettlements',
      'serials',
      'snapshots',
      'accounts',
      'journalEntries',
      'autoBackups',
      'ownerBalances',
      'accountBalances',
      'kpiSnapshots',
      'contractBalances',
      'tenantBalances',
      'notificationTemplates',
      'outgoingNotifications',
      'appNotifications',
      'leads',
      'lands',
      'commissions',
      'missions',
      'budgets',
      'attachments',
      'utilityServices',
    ];

    for (const tableName of mutableTableNames) {
      try {
        await dbEngine[tableName].clear();
      } catch (error: any) {
        throw new Error(`Failed to wipe table "${tableName}": ${error?.message || 'Unknown error'}`);
      }
    }
    await dbEngine.initialize();
  },

  initialize: async () => {
    logger.debug("dbEngine.initialize started");
    try {
      const settingsCount = await dbEngine.settings.count();
      logger.debug("dbEngine.settings.count completed, count:", settingsCount);
      if (settingsCount === 0) {
        logger.info('Seeding initial data to Supabase...');
        
        await dbEngine.settings.add({
          id: 1, theme: 'light', currency: 'OMR', contractAlertDays: 30, taxRate: 0,
          company: { name: 'مشاريع جودة الإنطلاقة', address: 'سلطنة عمان', phone: '+968' },
          appearance: { primaryColor: '#2563eb' },
          maintenance: { defaultChargedTo: 'OWNER' },
          lateFee: { isEnabled: false, graceDays: 5, type: 'FIXED_AMOUNT', value: 0 },
          accountMappings: {
            accountsReceivable: '1201', ownersPayable: '2101',
            revenue: { RENT: '4101', OFFICE_COMMISSION: '4102' },
            paymentMethods: { CASH: '1101', BANK: '1102', POS: '1103' },
            expenseCategories: { default: '5101' }
          }
        });

        await dbEngine.governance.add({ id: 1, isLocked: false, financialLockDate: '2000-01-01' });

        await dbEngine.serials.add({
          id: 1, receipt: 1000, expense: 1000, invoice: 1000, 
          ownerSettlement: 1000, maintenance: 1000, journalEntry: 1000, 
          lead: 1000, mission: 1000
        });

        await dbEngine.accounts.bulkAdd([
          { id: '1101', no: '1101', name: 'الصندوق (نقدي)', type: 'ASSET', isParent: false, parentId: null },
          { id: '1102', no: '1102', name: 'البنك', type: 'ASSET', isParent: false, parentId: null },
          { id: '1201', no: '1201', name: 'ذمم المستأجرين', type: 'ASSET', isParent: false, parentId: null },
          { id: '2101', no: '2101', name: 'ذمم الملاك (دائنون)', type: 'LIABILITY', isParent: false, parentId: null },
          { id: '2141', no: '2141', name: 'تأمينات مستأجرين', type: 'LIABILITY', isParent: false, parentId: null },
          { id: '4101', no: '4101', name: 'إيرادات إيجارات', type: 'REVENUE', isParent: false, parentId: null },
          { id: '4102', no: '4102', name: 'عمولات إدارية', type: 'REVENUE', isParent: false, parentId: null },
          { id: '5101', no: '5101', name: 'مصاريف صيانة عمومية', type: 'EXPENSE', isParent: false, parentId: null }
        ]);
        
        logger.info('Seeding completed.');
      }
      logger.debug("dbEngine.initialize completed successfully");
    } catch (error) {
      logger.error('Error during Supabase initialization/seeding:', error);
    }
  }
};
