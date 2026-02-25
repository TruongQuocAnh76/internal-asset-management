import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/core/database/database.module';
import { RequestsController } from './requests.controller';
import { RequestsService } from './requests.service';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [DatabaseModule, NotificationsModule],
  controllers: [RequestsController],
  providers: [RequestsService],
})
export class RequestsModule {}
