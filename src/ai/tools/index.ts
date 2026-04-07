import { supabase } from '../../lib/supabase';
import { Tool } from '../../core/types';

export const createInvoiceTool: Tool = {
  name: 'createInvoice',
  description: 'Creates a new invoice for a tenant based on contract details.',
  parameters: {
    type: 'object',
    properties: {
      contractId: { type: 'string' },
      amount: { type: 'number' },
      dueDate: { type: 'string' },
      description: { type: 'string' }
    },
    required: ['contractId', 'amount', 'dueDate', 'description']
  },
  execute: async (args: { contractId: string; amount: number; dueDate: string; description: string }) => {
    const { data, error } = await supabase
      .from('invoices')
      .insert([{
        contractId: args.contractId,
        amount: args.amount,
        dueDate: args.dueDate,
        description: args.description,
        status: 'UNPAID',
        createdAt: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};

export const sendReminderTool: Tool = {
  name: 'sendReminder',
  description: 'Sends a WhatsApp reminder to a tenant about an overdue invoice.',
  parameters: {
    type: 'object',
    properties: {
      tenantId: { type: 'string' },
      invoiceId: { type: 'string' },
      message: { type: 'string' }
    },
    required: ['tenantId', 'invoiceId', 'message']
  },
  execute: async (args: { tenantId: string; invoiceId: string; message: string }) => {
    // This would typically call a WhatsApp service
    // For now, we log the action and update the audit log
    const { data: tenant } = await supabase.from('tenants').select('*').eq('id', args.tenantId).single();
    
    const { error } = await supabase.from('auditLog').insert([{
      action: 'SEND_REMINDER',
      tableName: 'invoices',
      recordId: args.invoiceId,
      details: `Sent reminder to ${tenant?.name}: ${args.message}`,
      timestamp: Date.now()
    }]);

    if (error) throw error;
    return { status: 'sent', recipient: tenant?.name, phone: tenant?.phone };
  }
};

export const generateReportTool: Tool = {
  name: 'generateReport',
  description: 'Generates a financial performance report for a specific period.',
  parameters: {
    type: 'object',
    properties: {
      startDate: { type: 'string' },
      endDate: { type: 'string' }
    },
    required: ['startDate', 'endDate']
  },
  execute: async (args: { startDate: string; endDate: string }) => {
    const { data: invoices } = await supabase
      .from('invoices')
      .select('*')
      .gte('dueDate', args.startDate)
      .lte('dueDate', args.endDate);

    const totalRevenue = invoices?.reduce((sum: number, inv: any) => sum + (inv.paidAmount || 0), 0) || 0;
    const totalExpected = invoices?.reduce((sum: number, inv: any) => sum + inv.amount, 0) || 0;

    return {
      period: `${args.startDate} to ${args.endDate}`,
      totalRevenue,
      totalExpected,
      collectionRate: totalExpected > 0 ? (totalRevenue / totalExpected) * 100 : 0
    };
  }
};

export const fetchTenantDataTool: Tool = {
  name: 'fetchTenantData',
  description: 'Fetches detailed information about a tenant, including active contracts and payment history.',
  parameters: {
    type: 'object',
    properties: {
      tenantId: { type: 'string' }
    },
    required: ['tenantId']
  },
  execute: async (args: { tenantId: string }) => {
    const [tenant, contracts, invoices] = await Promise.all([
      supabase.from('tenants').select('*').eq('id', args.tenantId).single(),
      supabase.from('contracts').select('*').eq('tenantId', args.tenantId),
      supabase.from('invoices').select('*').eq('tenantId', args.tenantId)
    ]);

    return {
      profile: tenant.data,
      contracts: contracts.data,
      paymentHistory: invoices.data
    };
  }
};

export const detectOverdueInvoicesTool: Tool = {
  name: 'detectOverdueInvoices',
  description: 'Identifies all invoices that are past their due date and remain unpaid.',
  parameters: {
    type: 'object',
    properties: {},
    required: []
  },
  execute: async () => {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('invoices')
      .select('*, tenants(name, phone)')
      .lt('dueDate', today)
      .neq('status', 'PAID')
      .neq('status', 'VOID');

    if (error) throw error;
    return data;
  }
};
