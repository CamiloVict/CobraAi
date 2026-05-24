import { Module } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";
import { SchedulerService } from "./scheduler.service";
import { WorkflowsModule } from "../workflows/workflows.module";

@Module({
  imports: [ScheduleModule.forRoot(), WorkflowsModule],
  providers: [SchedulerService]
})
export class SchedulerModule {}
