import { Module } from '@nestjs/common';
import { CategoryService } from './category.service';
import { CategoryController } from './category.controller';
import { DatabaseModule } from 'src/core/database/database.module';
import { AuditModule } from 'src/core/audit/audit.module';

@Module({
  imports: [DatabaseModule, AuditModule],
  controllers: [CategoryController],
  providers: [CategoryService],
})
export class CategoryModule {}
