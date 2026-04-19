import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CollectionTask } from './collection-task.entity';
import { TaskExecutionLog } from './task-execution-log.entity';
import { TaskMetric } from './task-metric.entity';
import { CollectionTasksService } from './collection-tasks.service';
import { CollectionTasksController } from './collection-tasks.controller';
import { TaskMonitoringService } from './task-monitoring.service';
import { TaskMonitoringController } from './task-monitoring.controller';
import { TaskEventsGateway } from './task-events.gateway';
import { TasksController } from './tasks.controller';

@Module({
  imports: [TypeOrmModule.forFeature([
    CollectionTask,
    TaskExecutionLog,
    TaskMetric,
  ])],
  controllers: [
    CollectionTasksController,
    TaskMonitoringController,
    TasksController,
  ],
  providers: [
    CollectionTasksService,
    TaskMonitoringService,
    TaskEventsGateway,
  ],
  exports: [
    CollectionTasksService,
    TaskMonitoringService,
    TaskEventsGateway,
  ],
})
export class TasksModule {}
