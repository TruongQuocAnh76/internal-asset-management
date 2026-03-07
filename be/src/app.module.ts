import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './core/database/database.module';
import { UsersModule } from './packages/users/users.module';
import { AuthModule } from './core/auth/auth.module';
import { AssetsModule } from './packages/assets/assets.module';
import { RequestsModule } from './packages/requests/requests.module';
import { CategoryModule } from './packages/category/category.module';
import { StorageModule } from './core/storage/storage.module';
import { KitsModule } from './packages/kits/kits.module';
import { DepreciationModule } from './packages/assets/cron/depreciation/depreciation.module';
import { MailModule } from './core/mail/mail.module';
import { NotificationsModule } from './packages/requests/cron/notifications/notifications.module';
import { PurchaseRequestsController } from './packages/purchase-requests/purchase-requests.controller';
import { PurchaseRequestsService } from './packages/purchase-requests/purchase-requests.service';
import { PurchaseRequestsModule } from './packages/purchase-requests/purchase-requests.module';
import { AuditModule } from './core/audit/audit.module';

@Module({
  imports: [
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT!, 10),
      },
    }),
    DatabaseModule,
    UsersModule,
    AuthModule,
    AssetsModule,
    KitsModule,
    RequestsModule,
    CategoryModule,
    StorageModule,
    DepreciationModule,
    MailModule,
    NotificationsModule,
    PurchaseRequestsModule,
    AuditModule,
  ],
  controllers: [AppController, PurchaseRequestsController],
  providers: [AppService, PurchaseRequestsService],
})
export class AppModule {}
