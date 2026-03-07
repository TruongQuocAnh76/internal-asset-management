import { Module } from '@nestjs/common';
import { AuditService } from './audit.service';
import { AuditController } from './audit.controller';
import { DatabaseModule } from '../database/database.module';
import { UsersModule } from 'src/packages/users/users.module';
import { AssetsModule } from 'src/packages/assets/assets.module';
import { KitsModule } from 'src/packages/kits/kits.module';

@Module({
  imports: [DatabaseModule, UsersModule, AssetsModule, KitsModule],
  controllers: [AuditController],
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
