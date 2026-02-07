import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/core/database/database.module';
import { RequestsController } from './requests.controller';
import { RequestsService } from './requests.service';
import { AuditModule } from 'src/core/audit/audit.module';

@Module({
  imports: [DatabaseModule, AuditModule],
  controllers: [RequestsController],
  providers: [RequestsService],
})
export class RequestsModule {}
