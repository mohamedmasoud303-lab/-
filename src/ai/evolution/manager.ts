import { AutonomousTasks } from './tasks';
import { SelfHealingSystem } from './selfHealing';

export class SelfEvolutionManager {
  private tasks = new AutonomousTasks();
  private healer = new SelfHealingSystem();

  async startEvolutionCycle() {
    console.log('Starting full self-evolution cycle...');
    
    try {
      await this.tasks.runCodeHealthAudit();
      await this.tasks.runSecurityScan();
      await this.tasks.runPerformanceCheck();
      await this.tasks.runDependencyUpgrade();
      
      console.log('Full self-evolution cycle completed successfully.');
    } catch (error) {
      console.error('Evolution cycle failed. Triggering self-healing...');
      await this.healer.detectAndRepairBuildFailure(error instanceof Error ? error.message : String(error));
    }
  }
}
