import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { DEPRECIATION_QUEUE } from './depreciation.processor';

@Injectable()
export class DepreciationScheduler {
  private readonly logger = new Logger(DepreciationScheduler.name);

  constructor(
    @InjectQueue(DEPRECIATION_QUEUE)
    private readonly depreciationQueue: Queue,
  ) {}

  /**
   * Runs at 00:00 on the 1st of every month.
   */
  @Cron(CronExpression.EVERY_1ST_DAY_OF_MONTH_AT_MIDNIGHT)
  async handleMonthlyDepreciation(): Promise<void> {
    this.logger.log('Scheduling monthly depreciation job');

    await this.depreciationQueue.add(
      'monthly-depreciation',
      { triggeredAt: new Date().toISOString() },
      {
        removeOnComplete: 100,
        removeOnFail: 200,
        attempts: 3,
        backoff: { type: 'exponential', delay: 60_000 },
      },
    );

    this.logger.log('Monthly depreciation job enqueued');
  }
}
