import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ScheduleModule } from '@nestjs/schedule';
import { MailModule } from 'src/core/mail/mail.module';
import { DatabaseModule } from 'src/core/database/database.module';
import {
  NotificationProcessor,
  NOTIFICATION_QUEUE,
} from './notification.processor';
import { DueReminderScheduler } from './due-reminder.scheduler';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    BullModule.registerQueue({ name: NOTIFICATION_QUEUE }),
    MailModule,
    DatabaseModule,
  ],
  providers: [NotificationProcessor, DueReminderScheduler],
  exports: [BullModule],
})
export class NotificationsModule {}
