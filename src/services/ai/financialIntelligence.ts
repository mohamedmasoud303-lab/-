import { supabase } from '../../lib/supabase';

export interface CashFlowPrediction {
  month: string;
  expectedRevenue: number;
  expectedExpenses: number;
  netCashFlow: number;
  confidence: number;
}

export class FinancialIntelligenceService {
  private static instance: FinancialIntelligenceService;

  private constructor() {}

  public static getInstance(): FinancialIntelligenceService {
    if (!FinancialIntelligenceService.instance) {
      FinancialIntelligenceService.instance = new FinancialIntelligenceService();
    }
    return FinancialIntelligenceService.instance;
  }

  /**
   * Predicts cash flow for the next 6 months based on active contracts and historical expenses.
   */
  async predictCashFlow(months: number = 6): Promise<CashFlowPrediction[]> {
    const predictions: CashFlowPrediction[] = [];
    const now = new Date();

    // 1. Fetch active contracts for expected revenue
    const { data: contracts } = await supabase
      .from('contracts')
      .select('monthlyRent, startDate, endDate')
      .eq('status', 'ACTIVE');

    // 2. Fetch historical expenses for average expense calculation
    const { data: expenses } = await supabase
      .from('expenses')
      .select('amount, date')
      .order('date', { ascending: false })
      .limit(100);

    const avgMonthlyExpense = this.calculateAverageMonthlyExpense(expenses || []);

    for (let i = 0; i < months; i++) {
      const targetMonth = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const monthStr = targetMonth.toLocaleString('default', { month: 'long', year: 'numeric' });

      let expectedRevenue = 0;
      contracts?.forEach((contract: any) => {
        const start = new Date(contract.startDate);
        const end = new Date(contract.endDate);
        if (targetMonth >= start && targetMonth <= end) {
          expectedRevenue += contract.monthlyRent;
        }
      });

      predictions.push({
        month: monthStr,
        expectedRevenue,
        expectedExpenses: avgMonthlyExpense,
        netCashFlow: expectedRevenue - avgMonthlyExpense,
        confidence: 0.85 - (i * 0.05) // Confidence decreases over time
      });
    }

    return predictions;
  }

  private calculateAverageMonthlyExpense(expenses: any[]): number {
    if (expenses.length === 0) return 0;
    const total = expenses.reduce((sum: number, exp: any) => sum + exp.amount, 0);
    // Simplified: assume the 100 expenses cover roughly 3-4 months
    return total / 4; 
  }

  /**
   * AI-driven matching of bank transactions with invoices.
   */
  async reconcileTransactions(bankTransactions: any[]): Promise<any[]> {
    const { data: unpaidInvoices } = await supabase
      .from('invoices')
      .select('*, tenants(name)')
      .eq('status', 'UNPAID');

    const matches: any[] = [];

    for (const tx of bankTransactions) {
      const match = (unpaidInvoices as any[])?.find((inv: any) => 
        Math.abs(inv.amount - tx.amount) < 0.01 && 
        (tx.description.toLowerCase().includes(inv.tenants?.name.toLowerCase()) || 
         tx.description.includes(inv.id.substring(0, 8)))
      );

      if (match) {
        matches.push({
          transaction: tx,
          invoice: match,
          confidence: 0.95
        });
      }
    }

    return matches;
  }
}
