import {
  Body,
  Controller,
  Get,
  Param,
  Put,
  Query,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { AssetsService } from './assets.service';
import { SessionAuthGuard } from 'src/core/auth/guards/session-auth.guard';
import {
  GetAssetsParams,
  getAssetsParamsSchema,
} from './dto/get-assets-params.dto';
import { ZodValidationPipe } from 'nestjs-zod';
import { EditAssetDto, EditAssetDtoSchema } from './dto/edit-asset.dto';
import { CreateAssetDto, CreateAssetDtoSchema } from './dto/create-asset.dto';
import { CurrentUser } from 'src/core/auth/decorator/current-user.decorator';
import { Permission } from 'src/core/auth/decorator/permission.decorator';
import { PermissionAuthGuard } from 'src/core/auth/guards/permission-auth.guard';
import {
  SetMaintenanceDtoSchema,
  SetMaintenanceDto,
  ResolveMaintenanceDtoSchema,
  ResolveMaintenanceDto,
} from './dto/maintenance.dto';

@Controller('assets')
export class AssetsController {
  constructor(
    private readonly assetsService: AssetsService,
  ) {}

  @Get()
  @UseGuards(SessionAuthGuard)
  getAllAssets(
    @Query(new ZodValidationPipe(getAssetsParamsSchema)) query: GetAssetsParams,
  ) {
    return this.assetsService.getAssets(query);
  }

  @Get('export')
  @UseGuards(SessionAuthGuard)
  async exportAssets(
    @Query('format') format: string,
    @Res() res: Response,
  ) {
    const { buffer, contentType, filename } =
      await this.assetsService.exportStorageReport(format);

    res.set({
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }

  @Get('summary')
  @UseGuards(SessionAuthGuard)
  getSummary() {
    return this.assetsService.getSummary();
  }


  @Get('maintenance/items')
  @UseGuards(SessionAuthGuard)
  getMaintenanceItems() {
    return this.assetsService.getMaintenanceItems();
  }

  @Get('maintenance/repairs/:assetItemId')
  @UseGuards(SessionAuthGuard)
  getRepairHistory(@Param('assetItemId') assetItemId: string) {
    return this.assetsService.getRepairHistory(assetItemId);
  }

  @Get(':id')
  @UseGuards(SessionAuthGuard)
  getAssetById(@Param('id') id: string) {
    return this.assetsService.getAssetById(id);
  }

  @Get(':id/items')
  @UseGuards(SessionAuthGuard)
  getAssetItems(@Param('id') id: string) {
    return this.assetsService.getAssetItems(id);
  }

  @Get('/category/count')
  @UseGuards(SessionAuthGuard)
  getAllAssetsCountByCategory() {
    return this.assetsService.getAsssetsCountByCategory('');
  }

  @Get('/category/:category/count')
  @UseGuards(SessionAuthGuard)
  getAssetsCountByCategory(@Param('category') category: string) {
    return this.assetsService.getAsssetsCountByCategory(category);
  }

  @Put(':id')
  @UseGuards(SessionAuthGuard)
  updateAssetStatus(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(EditAssetDtoSchema)) body: EditAssetDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.assetsService.updateAsset(id, body, userId);
  }

  @Post()
  @UseGuards(SessionAuthGuard)
  @Permission('asset:create')
  createAsset(
    @Body(new ZodValidationPipe(CreateAssetDtoSchema)) body: CreateAssetDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.assetsService.createAsset(body);
  }

  @Post('maintenance/repair')
  @UseGuards(SessionAuthGuard)
  setMaintenance(
    @Body(new ZodValidationPipe(SetMaintenanceDtoSchema))
    body: SetMaintenanceDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.assetsService.setMaintenance(body, userId);
  }

  @Post('maintenance/resolve')
  @UseGuards(SessionAuthGuard)
  @Permission('asset:maintenance')
  @UseGuards(PermissionAuthGuard)
  resolveMaintenance(
    @Body(new ZodValidationPipe(ResolveMaintenanceDtoSchema))
    body: ResolveMaintenanceDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.assetsService.resolveMaintenance(body, userId);
  }
}
