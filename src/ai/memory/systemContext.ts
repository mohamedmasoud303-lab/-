import { supabase } from '../../lib/supabase';
import { SystemContext } from '../../core/types';

export const fetchSystemContext = async (): Promise<SystemContext> => {
  const today = new Date().toISOString().split('T')[0];
  const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

  const [
    units,
    contracts,
    tenants,
    overdueInvoices,
    monthlyRevenue
  ] = await Promise.all([
    supabase.from('units').select('*', { count: 'exact', head: true }),
    supabase.from('contracts').select('*', { count: 'exact', head: true }).eq('status', 'ACTIVE'),
    supabase.from('tenants').select('*', { count: 'exact', head: true }),
    supabase.from('invoices').select('*', { count: 'exact', head: true })
      .lt('due_date', today)
      .neq('status', 'PAID')
      .neq('status', 'VOID'),
    supabase.from('invoices').select('paid_amount')
      .gte('due_date', firstDayOfMonth)
      .lte('due_date', today)
      .eq('status', 'PAID')
  ]);

  const totalRevenue = monthlyRevenue.data?.reduce((sum: number, inv: any) => sum + (inv.paid_amount || 0), 0) || 0;

  return {
    total_units: units.count || 0,
    active_contracts: contracts.count || 0,
    tenants_count: tenants.count || 0,
    overdue_invoices: overdueInvoices.count || 0,
    monthly_revenue: totalRevenue,
    timestamp: new Date().toISOString()
  };
};
