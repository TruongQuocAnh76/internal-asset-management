import { Module } from '@nestjs/common';
import { AssetsService } from './assets.service';
import { AssetsController } from './assets.controller';
import { DatabaseModule } from 'src/core/database/database.module';
import { StorageService } from 'src/core/storage/storage.service';

@Module({
  imports: [DatabaseModule],
  controllers: [AssetsController],
  providers: [AssetsService, StorageService],
  exports: [AssetsService],
})
export class AssetsModule {}
