import { supabase } from '../../lib/supabase';

export interface CommunicationChannel {
  id: string;
  type: 'WHATSAPP' | 'EMAIL' | 'SMS';
  status: 'ACTIVE' | 'INACTIVE';
}

export class CommunicationHubService {
  private static instance: CommunicationHubService;

  private constructor() {}

  public static getInstance(): CommunicationHubService {
    if (!CommunicationHubService.instance) {
      CommunicationHubService.instance = new CommunicationHubService();
    }
    return CommunicationHubService.instance;
  }

  /**
   * Sends automated multi-channel notifications to a tenant.
   */
  async sendAutomatedNotification(tenantId: string, message: string, channels: ('WHATSAPP' | 'EMAIL' | 'SMS')[] = ['WHATSAPP', 'EMAIL']) {
    const { data: tenant } = await supabase
      .from('tenants')
      .select('name, email, phone')
      .eq('id', tenantId)
      .single();

    if (!tenant) throw new Error('Tenant not found');

    const results: any[] = [];

    for (const channel of channels) {
      try {
        // Simulated sending logic
        console.log(`Sending ${channel} to ${tenant.name} (${tenant.email || tenant.phone}): ${message}`);
        
        // Log the communication in audit log
        await supabase.from('auditLog').insert([{
          action: `SEND_${channel}`,
          tableName: 'tenants',
          recordId: tenantId,
          details: `Sent ${channel} notification: ${message.substring(0, 50)}...`,
          timestamp: Date.now()
        }]);

        results.push({ channel, status: 'SUCCESS' });
      } catch (error) {
        console.error(`Failed to send ${channel} to ${tenant.name}:`, error);
        results.push({ channel, status: 'FAILED', error: error instanceof Error ? error.message : String(error) });
      }
    }

    return results;
  }

  /**
   * Analyzes tenant engagement based on communication history.
   */
  async analyzeEngagement(tenantId: string) {
    const { data: logs } = await supabase
      .from('auditLog')
      .select('*')
      .eq('recordId', tenantId)
      .like('action', 'SEND_%');

    const count = logs?.length || 0;
    let score = 'LOW';
    if (count > 10) score = 'HIGH';
    else if (count > 5) score = 'MEDIUM';

    return {
      tenantId,
      communicationCount: count,
      engagementScore: score,
      lastContact: logs?.[0]?.timestamp ? new Date(logs[0].timestamp).toISOString() : null
    };
  }
}
