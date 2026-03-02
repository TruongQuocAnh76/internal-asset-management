import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from 'src/core/database/prisma.service';
import { BorrowMailContext } from 'src/core/mail/mail.service';
import { BorrowStatus } from '@prisma/client';
import { NOTIFICATION_QUEUE, NotificationJobName } from './notification.processor';

const REMINDER_DAYS = [7, 3, 1];

@Injectable()
export class DueReminderScheduler {
  private readonly logger = new Logger(DueReminderScheduler.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue(NOTIFICATION_QUEUE) private readonly notificationQueue: Queue,
  ) {}

  /**
   * Runs every day at 08:45 AM.
   * Scans PROVIDED requests whose due_date is exactly 7, 3, or 1 day(s) away
   * and enqueues a reminder notification for each.
   */
  @Cron('45 8 * * *')
  async handleDueReminders(): Promise<void> {
    this.logger.log('Starting daily due-date reminder scan');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let totalEnqueued = 0;

    const overdueRequests = await this.prisma.borrowRequests.findMany({
      where: {
        status: BorrowStatus.OVERDUE,
      },
      include: {
        user: { select: { first_name: true, last_name: true, email: true } },
        asset: { select: { name: true } },
        kit: { select: { template: { select: { name: true } } } },
      },
    });

    for (const request of overdueRequests) {
      if (!request.user.email) continue;
      const ctx = this.buildContext(request, 0);
      await this.notificationQueue.add('request-overdue' as NotificationJobName, ctx, {
        removeOnComplete: 100,
        removeOnFail: 200,
        attempts: 3,
        backoff: { type: 'exponential', delay: 60_000 },
      });
      totalEnqueued++;
    }

    if (overdueRequests.length > 0) {
      this.logger.log(`Notifying ${overdueRequests.length} OVERDUE request(s)`);
    }

    // --- Upcoming due-date reminders: 7, 3, 1 day(s) away ---
    for (const days of REMINDER_DAYS) {
      const targetStart = new Date(today);
      targetStart.setDate(targetStart.getDate() + days);

      const targetEnd = new Date(targetStart);
      targetEnd.setDate(targetEnd.getDate() + 1);

      const requests = await this.prisma.borrowRequests.findMany({
        where: {
          status: BorrowStatus.PROVIDED,
          due_date: {
            gte: targetStart,
            lt: targetEnd,
          },
        },
        include: {
          user: { select: { first_name: true, last_name: true, email: true } },
          asset: { select: { name: true } },
          kit: { select: { template: { select: { name: true } } } },
        },
      });

      for (const request of requests) {
        if (!request.user.email) continue;

        const ctx = this.buildContext(request, days);
        await this.notificationQueue.add('request-due-reminder' as NotificationJobName, ctx, {
          removeOnComplete: 100,
          removeOnFail: 200,
          attempts: 3,
          backoff: { type: 'exponential', delay: 60_000 },
        });
        totalEnqueued++;
      }

      if (requests.length > 0) {
        this.logger.log(
          `Found ${requests.length} PROVIDED request(s) due in ${days} day(s)`,
        );
      }
    }

    this.logger.log(`Due-date reminder scan complete – ${totalEnqueued} notification(s) enqueued`);
  }

  private buildContext(
    request: {
      id: string;
      reason: string | null;
      due_date: Date;
      user: { first_name: string; last_name: string; email: string };
      asset?: { name: string } | null;
      kit?: { template: { name: string } } | null;
    },
    daysRemaining: number,
  ): BorrowMailContext {
    const assetName =
      request.asset?.name ??
      request.kit?.template?.name ??
      'Unknown Asset';

    return {
      recipientName: `${request.user.first_name} ${request.user.last_name}`,
      recipientEmail: request.user.email,
      requesterName: `${request.user.first_name} ${request.user.last_name}`,
      requesterEmail: request.user.email,
      assetName,
      requestId: request.id,
      reason: request.reason ?? undefined,
      dueDate: new Date(request.due_date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }),
      daysRemaining,
    };
  }
}
