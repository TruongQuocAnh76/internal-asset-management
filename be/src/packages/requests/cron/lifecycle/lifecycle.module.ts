import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { DatabaseModule } from 'src/core/database/database.module';
import { OverdueScheduler } from './overdue.scheduler';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    DatabaseModule,
  ],
  providers: [OverdueScheduler],
})
export class LifecycleModule {}
