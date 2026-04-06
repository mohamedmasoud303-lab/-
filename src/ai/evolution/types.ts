export interface CodeIssue {
  file: string;
  line?: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: 'bug' | 'security' | 'performance' | 'debt' | 'style';
  description: string;
  suggestion?: string;
}

export interface AuditResult {
  issues: CodeIssue[];
  score: number; // 0-100
  timestamp: string;
}

export interface EvolutionTask {
  id: string;
  type: 'audit' | 'refactor' | 'security_scan' | 'performance_check';
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  result?: any;
  createdAt: string;
  completedAt?: string;
}
