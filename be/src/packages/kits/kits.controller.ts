import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { KitsService } from './kits.service';
import { SessionAuthGuard } from 'src/core/auth/guards/session-auth.guard';
import { CurrentUser } from 'src/core/auth/decorator/current-user.decorator';
import { ZodValidationPipe } from 'nestjs-zod';
import {
  CreateKitDto,
  CreateKitDtoSchema,
  UpdateKitDto,
  UpdateKitDtoSchema,
} from './dto/create-kit.dto';
import { GetKitsParams, getKitsParamsSchema } from './dto/get-kits-params.dto';

@Controller('kits')
export class KitsController {
  constructor(private readonly kitsService: KitsService) {}

  @Get()
  @UseGuards(SessionAuthGuard)
  getAllKits(
    @Query(new ZodValidationPipe(getKitsParamsSchema)) query: GetKitsParams,
  ) {
    return this.kitsService.getAllKits(query);
  }

  @Get(':id')
  @UseGuards(SessionAuthGuard)
  getKitById(@Param('id') id: string) {
    return this.kitsService.getKitById(id);
  }

  @Post()
  @UseGuards(SessionAuthGuard)
  createKit(
    @Body(new ZodValidationPipe(CreateKitDtoSchema)) body: CreateKitDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.kitsService.createKit(body, userId);
  }

  @Put(':id')
  @UseGuards(SessionAuthGuard)
  updateKit(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateKitDtoSchema)) body: UpdateKitDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.kitsService.updateKit(id, body, userId);
  }

  @Delete(':id')
  @UseGuards(SessionAuthGuard)
  deleteKit(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.kitsService.deleteKit(id, userId);
  }

  @Post(':id/components')
  @UseGuards(SessionAuthGuard)
  addComponent(
    @Param('id') kitId: string,
    @Body()
    body: {
      assetId?: string;
      assetType: string;
      quantity: number;
      isPlaceholder: boolean;
    },
    @CurrentUser('id') userId: string,
  ) {
    return this.kitsService.addComponentToKit(kitId, body, userId);
  }

  @Delete(':id/components/:assetId')
  @UseGuards(SessionAuthGuard)
  removeComponent(
    @Param('id') kitId: string,
    @Param('assetId') assetId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.kitsService.removeComponentFromKit(kitId, assetId, userId);
  }

  @Put(':id/components/:assetId/replace')
  @UseGuards(SessionAuthGuard)
  replaceComponent(
    @Param('id') kitId: string,
    @Param('assetId') oldAssetId: string,
    @Body() body: { newAssetId: string },
    @CurrentUser('id') userId: string,
  ) {
    return this.kitsService.replaceComponentAsset(
      kitId,
      oldAssetId,
      body.newAssetId,
      userId,
    );
  }

  @Put(':id/components/:assetId/placeholder')
  @UseGuards(SessionAuthGuard)
  convertToPlaceholder(
    @Param('id') kitId: string,
    @Param('assetId') assetId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.kitsService.convertComponentToPlaceholder(
      kitId,
      assetId,
      userId,
    );
  }
}
