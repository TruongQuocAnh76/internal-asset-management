import { Module } from '@nestjs/common';
import { PurchaseRequestsController } from './purchase-requests.controller';
import { PurchaseRequestsService } from './purchase-requests.service';
import { AssetsModule } from '../assets/assets.module';
import { DatabaseModule } from 'src/core/database/database.module';
@Module({
  controllers: [PurchaseRequestsController],
  providers: [PurchaseRequestsService],
  imports: [DatabaseModule, AssetsModule],
  exports: [PurchaseRequestsService],
})
export class PurchaseRequestsModule {}
