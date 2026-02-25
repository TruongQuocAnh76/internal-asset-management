import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ScheduleModule } from '@nestjs/schedule';
import { AssetsModule } from '../../packages/assets/assets.module';
import { DepreciationProcessor, DEPRECIATION_QUEUE } from './depreciation.processor';
import { DepreciationScheduler } from './depreciation.scheduler';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    BullModule.registerQueue({ name: DEPRECIATION_QUEUE }),
    AssetsModule,
  ],
  providers: [DepreciationProcessor, DepreciationScheduler],
})
export class DepreciationModule {}
