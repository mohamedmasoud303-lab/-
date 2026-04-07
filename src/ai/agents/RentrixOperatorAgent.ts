import { Agent } from '../../core/types';
import { 
  createInvoiceTool, 
  sendReminderTool, 
  generateReportTool, 
  fetchTenantDataTool, 
  detectOverdueInvoicesTool 
} from '../tools';

export const RentrixOperatorAgent: Agent = {
  name: 'RentrixOperatorAgent',
  role: 'Autonomous Property Management Operator',
  goals: [
    'Collect rent payments efficiently',
    'Reduce overdue invoices through automated reminders',
    'Monitor property performance and generate insights',
    'Assist property managers with operational workflows',
    'Automate administrative tasks like invoice generation'
  ],
  tools: [
    createInvoiceTool,
    sendReminderTool,
    generateReportTool,
    fetchTenantDataTool,
    detectOverdueInvoicesTool
  ]
};
