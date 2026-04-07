import { detectOverdueInvoicesTool, sendReminderTool, generateReportTool } from '../tools';
import { supabase } from '../../lib/supabase';

export const runDailyOperations = async () => {
  console.log('Starting daily autonomous operations...');

  try {
    // 1. Detect overdue invoices
    const overdueInvoices = await detectOverdueInvoicesTool.execute({});
    console.log(`Detected ${overdueInvoices.length} overdue invoices.`);

    // 2. Send reminders for each overdue invoice
    let remindersSent = 0;
    for (const invoice of overdueInvoices) {
      if (invoice.tenants?.phone) {
        try {
          await sendReminderTool.execute({
            tenantId: invoice.tenantId,
            invoiceId: invoice.id,
            message: `Dear ${invoice.tenants.name}, your invoice for ${invoice.amount} is overdue. Please pay as soon as possible.`
          });
          remindersSent += 1;
        } catch (sendError) {
          console.error(`Failed to send reminder for invoice ${invoice.id}:`, sendError);
        }
      }
    }

    // 3. Generate a daily performance report
    const today = new Date().toISOString().split('T')[0];
    const report = await generateReportTool.execute({
      startDate: today,
      endDate: today
    });

    // 4. Log the autonomous task completion
    const { error: auditInsertError } = await supabase.from('auditLog').insert([{
      action: 'DAILY_CRON',
      tableName: 'system',
      recordId: 'daily-ops',
      details: `Autonomous daily operations completed. Reminders sent: ${remindersSent}. Daily revenue: ${report.totalRevenue}`,
      timestamp: Date.now()
    }]);
    if (auditInsertError) {
      throw auditInsertError;
    }

    console.log('Daily autonomous operations completed successfully.');
  } catch (error) {
    console.error('Daily autonomous operations failed:', error);
  }
};
