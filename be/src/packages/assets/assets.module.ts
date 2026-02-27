import { Module } from '@nestjs/common';
import { AssetsService } from './assets.service';
import { AssetsController } from './assets.controller';
import { DatabaseModule } from 'src/core/database/database.module';
import { StorageService } from 'src/core/storage/storage.service';
import { MailModule } from 'src/mail/mail.module';
import { KitsModule } from '../kits/kits.module';

@Module({
  imports: [DatabaseModule, MailModule, KitsModule],
  controllers: [AssetsController],
  providers: [AssetsService, StorageService],
  exports: [AssetsService],
})
export class AssetsModule {}
