import { Module } from '@nestjs/common';
import { AssetsService } from './assets.service';
import { AssetsController } from './assets.controller';
import { DatabaseModule } from 'src/core/database/database.module';
import { AuditModule } from 'src/core/audit/audit.module';

@Module({
  imports: [DatabaseModule, AuditModule],
  controllers: [AssetsController],
  providers: [AssetsService],
})
export class AssetsModule {}
