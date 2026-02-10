import { Module } from '@nestjs/common';
import { KitsService } from './kits.service';
import { KitsController } from './kits.controller';
import { DatabaseModule } from 'src/core/database/database.module';
import { AuditModule } from 'src/core/audit/audit.module';

@Module({
  imports: [DatabaseModule, AuditModule],
  controllers: [KitsController],
  providers: [KitsService],
  exports: [KitsService],
})
export class KitsModule {}
