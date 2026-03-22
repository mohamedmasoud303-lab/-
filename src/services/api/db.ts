import { supabase } from '../../lib/supabase';
import { Database } from '../../types';

// This file now acts as a bridge to Supabase, mimicking the Dexie API
// to minimize changes in the rest of the application logic.

class SupabaseTableWrapper {
  constructor(public tableName: string) {}

  async get(id: any) {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) return null;
    return data;
  }

  async toArray() {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*');
    if (error) return [];
    return data || [];
  }

  async add(item: any) {
    const { data, error } = await supabase
      .from(this.tableName)
      .insert(item)
      .select()
      .single();
    if (error) throw error;
    return data.id;
  }

  async bulkAdd(items: any[]) {
    const { data, error } = await supabase
      .from(this.tableName)
      .insert(items)
      .select();
    if (error) throw error;
    return data;
  }

  async bulkGet(ids: any[]) {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .in('id', ids);
    if (error) return [];
    return data || [];
  }

  async put(item: any) {
    const { data, error } = await supabase
      .from(this.tableName)
      .upsert(item)
      .select()
      .single();
    if (error) throw error;
    return data.id;
  }

  async bulkPut(items: any[]) {
    const { data, error } = await supabase
      .from(this.tableName)
      .upsert(items)
      .select();
    if (error) throw error;
    return data;
  }

  async update(id: any, updates: any) {
    const { data, error } = await supabase
      .from(this.tableName)
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
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
      return {
        equals: (value: any) => ({
          first: async () => {
            const { data, error } = await supabase
              .from(this.tableName)
              .select('*')
              .eq(field, value)
              .maybeSingle();
            if (error) return null;
            return data;
          },
          toArray: async () => {
            const { data, error } = await supabase
              .from(this.tableName)
              .select('*')
              .eq(field, value);
            if (error) return [];
            return data || [];
          }
        })
      };
    } else {
      // Handle object-based where: where({ field1: val1, field2: val2 })
      return {
        first: async () => {
          let query = supabase.from(this.tableName).select('*');
          for (const [key, val] of Object.entries(field)) {
            query = query.eq(key, val);
          }
          const { data, error } = await query.maybeSingle();
          if (error) return null;
          return data;
        },
        toArray: async () => {
          let query = supabase.from(this.tableName).select('*');
          for (const [key, val] of Object.entries(field)) {
            query = query.eq(key, val);
          }
          const { data, error } = await query;
          if (error) return [];
          return data || [];
        },
        filter: (callback: (item: any) => boolean) => {
          // This is a bit tricky to do efficiently in Supabase, 
          // but for compatibility we can fetch and then filter.
          return {
            first: async () => {
              let query = supabase.from(this.tableName).select('*');
              for (const [key, val] of Object.entries(field)) {
                query = query.eq(key, val);
              }
              const { data, error } = await query;
              if (error || !data) return null;
              return data.find(callback) || null;
            },
            toArray: async () => {
              let query = supabase.from(this.tableName).select('*');
              for (const [key, val] of Object.entries(field)) {
                query = query.eq(key, val);
              }
              const { data, error } = await query;
              if (error || !data) return [];
              return data.filter(callback);
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
  receiptAllocations: new SupabaseTableWrapper('receiptAllocations'),
  expenses: new SupabaseTableWrapper('expenses'),
  maintenanceRecords: new SupabaseTableWrapper('maintenanceRecords'),
  depositTxs: new SupabaseTableWrapper('depositTxs'),
  auditLog: new SupabaseTableWrapper('auditLog'),
  governance: new SupabaseTableWrapper('governance'),
  ownerSettlements: new SupabaseTableWrapper('ownerSettlements'),
  serials: new SupabaseTableWrapper('serials'),
  snapshots: new SupabaseTableWrapper('snapshots'),
  accounts: new SupabaseTableWrapper('accounts'),
  journalEntries: new SupabaseTableWrapper('journalEntries'),
  autoBackups: new SupabaseTableWrapper('autoBackups'),
  ownerBalances: new SupabaseTableWrapper('ownerBalances'),
  accountBalances: new SupabaseTableWrapper('accountBalances'),
  kpiSnapshots: new SupabaseTableWrapper('kpiSnapshots'),
  contractBalances: new SupabaseTableWrapper('contractBalances'),
  tenantBalances: new SupabaseTableWrapper('tenantBalances'),
  notificationTemplates: new SupabaseTableWrapper('notificationTemplates'),
  outgoingNotifications: new SupabaseTableWrapper('outgoingNotifications'),
  appNotifications: new SupabaseTableWrapper('appNotifications'),
  leads: new SupabaseTableWrapper('leads'),
  lands: new SupabaseTableWrapper('lands'),
  commissions: new SupabaseTableWrapper('commissions'),
  missions: new SupabaseTableWrapper('missions'),
  budgets: new SupabaseTableWrapper('budgets'),
  attachments: new SupabaseTableWrapper('attachments'),
  utilityServices: new SupabaseTableWrapper('utilityServices'),
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
    const tableNames = Object.keys(dbEngine).filter(k => dbEngine[k] instanceof SupabaseTableWrapper);
    await Promise.all(tableNames.map(name => dbEngine[name].clear()));
    await dbEngine.initialize();
  },

  initialize: async () => {
    console.log("DEBUG: dbEngine.initialize started");
    try {
      const settingsCount = await dbEngine.settings.count();
      console.log("DEBUG: dbEngine.settings.count completed, count:", settingsCount);
      if (settingsCount === 0) {
        console.log('DEBUG: Seeding initial data to Supabase...');
        
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
        
        console.log('DEBUG: Seeding completed.');
      }
      console.log("DEBUG: dbEngine.initialize completed successfully");
    } catch (error) {
      console.error('DEBUG: Error during Supabase initialization/seeding:', error);
    }
  }
};
