import { runRentrixAgent } from '../../ai/runtime/engine';

export class PiAgentService {
  private static instance: PiAgentService;

  private constructor() {}

  public static getInstance(): PiAgentService {
    if (!PiAgentService.instance) {
      PiAgentService.instance = new PiAgentService();
    }
    return PiAgentService.instance;
  }

  async chat(message: string) {
    try {
      const result = await runRentrixAgent(message);
      return result.response;
    } catch (error) {
      console.error('Pi Agent Runtime Error:', error);
      return "I encountered an error while processing your request.";
    }
  }
}
