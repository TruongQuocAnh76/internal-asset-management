import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/core/database/database.module';
import { RequestsController } from './requests.controller';
import { RequestsService } from './requests.service';
import { NotificationsModule } from './cron/notifications/notifications.module';
import { LifecycleModule } from './cron/lifecycle/lifecycle.module';

@Module({
  imports: [DatabaseModule, NotificationsModule, LifecycleModule],
  controllers: [RequestsController],
  providers: [RequestsService],
})
export class RequestsModule {}
