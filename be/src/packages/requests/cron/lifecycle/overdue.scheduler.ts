import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from 'src/core/database/prisma.service';
import { BorrowStatus } from '@prisma/client';

@Injectable()
export class OverdueScheduler {
  private readonly logger = new Logger(OverdueScheduler.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Runs every day at midnight.
   * Marks PROVIDED requests whose due_date has passed as OVERDUE.
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleOverdueRequests(): Promise<void> {
    this.logger.log('Starting midnight overdue lifecycle scan');

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const result = await this.prisma.borrowRequests.updateMany({
      where: {
        status: BorrowStatus.PROVIDED,
        due_date: { lt: now },
      },
      data: { status: BorrowStatus.OVERDUE },
    });

    if (result.count === 0) {
      this.logger.log('No overdue requests found');
    } else {
      this.logger.log(`Marked ${result.count} request(s) as OVERDUE`);
    }
  }
}
