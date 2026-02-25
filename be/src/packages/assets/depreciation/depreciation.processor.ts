import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { AssetsService } from '../assets.service';
import { Job } from 'bullmq';

export const DEPRECIATION_QUEUE = 'depreciation';

@Processor(DEPRECIATION_QUEUE)
export class DepreciationProcessor extends WorkerHost {
  private readonly logger = new Logger(DepreciationProcessor.name);

  constructor(private readonly assetsService: AssetsService) {
    super();
  }

  async process(job: Job): Promise<void> {
    this.logger.log(`Processing depreciation job ${job.id} – ${job.name}`);

    if (job.name === 'monthly-depreciation') {
      const processed = await this.assetsService.applyMonthlyDepreciation();
      this.logger.log(
        `Monthly depreciation complete – ${processed} items evaluated`,
      );
    }
  }
}
