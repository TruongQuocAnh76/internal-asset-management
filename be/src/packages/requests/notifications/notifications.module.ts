import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { MailModule } from 'src/mail/mail.module';
import { NotificationProcessor, NOTIFICATION_QUEUE } from './notification.processor';

@Module({
  imports: [
    BullModule.registerQueue({ name: NOTIFICATION_QUEUE }),
    MailModule,
  ],
  providers: [NotificationProcessor],
  exports: [BullModule],
})
export class NotificationsModule {}
