import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/core/database/database.module';
import { RequestsController } from './requests.controller';
import { RequestsService } from './requests.service';
import { NotificationsModule } from './cron/notifications/notifications.module';
import { LifecycleModule } from './cron/lifecycle/lifecycle.module';
import { AssetsModule } from '../assets/assets.module';

@Module({
  imports: [DatabaseModule, NotificationsModule, LifecycleModule, AssetsModule],
  controllers: [RequestsController],
  providers: [RequestsService],
})
export class RequestsModule {}
