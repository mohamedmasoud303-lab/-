export interface Tool {
  name: string;
  description: string;
  parameters?: any;
  execute: (args: any) => Promise<any>;
}

export interface Agent {
  name: string;
  role: string;
  goals: string[];
  tools: Tool[];
}

export interface AgentResult {
  thought: string;
  toolCalls?: {
    tool: string;
    args: any;
    result: any;
  }[];
  response: string;
  status: 'success' | 'error';
}

export interface SystemContext {
  total_units: number;
  active_contracts: number;
  tenants_count: number;
  overdue_invoices: number;
  monthly_revenue: number;
  timestamp: string;
}
