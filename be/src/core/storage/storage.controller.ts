import { Controller, Get, Res, Param, UseGuards } from '@nestjs/common';
import { StorageService } from './storage.service';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { Response } from 'express';

@Controller('storage')
export class StorageController {
  constructor(private storageService: StorageService) {}

  @Get('files/:key')
  @UseGuards(SessionAuthGuard)
  async getFile(@Param('key') key: string, @Res() res: Response) {
    const fileStream = await this.storageService.getFileStream(key);
    fileStream.pipe(res);
  }
}
