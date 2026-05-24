import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { WorkflowsService } from "../workflows/workflows.service";

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(private readonly workflows: WorkflowsService) {}

  @Cron(CronExpression.EVERY_4_HOURS)
  async runScheduledCycle(): Promise<void> {
    this.logger.log("Iniciando ciclo programado de workflows");
    const result = await this.workflows.runSchedulerCycle();
    this.logger.log(
      `Ciclo completado: processed=${result.processed} contacts=${result.contacts}`
    );
  }
}
