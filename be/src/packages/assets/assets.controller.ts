import {
  Body,
  Controller,
  Get,
  Param,
  Put,
  Query,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AssetsService } from './assets.service';
import { SessionAuthGuard } from 'src/core/auth/guards/session-auth.guard';
import {
  GetAssetsParams,
  getAssetsParamsSchema,
} from './dto/get-assets-params.dto';
import { ZodValidationPipe } from 'nestjs-zod';
import { EditAssetDto, EditAssetDtoSchema } from './dto/edit-asset.dto';
import { CreateAssetDto, CreateAssetDtoSchema } from './dto/create-asset.dto';

@Controller('assets')
export class AssetsController {
  constructor(private readonly assetsService: AssetsService) {}

  @Get()
  @UseGuards(SessionAuthGuard)
  getAllAssets(
    @Query(new ZodValidationPipe(getAssetsParamsSchema)) query: GetAssetsParams,
  ) {
    return this.assetsService.getAssets(query);
  }

  @Get('summary')
  @UseGuards(SessionAuthGuard)
  getSummary() {
    return this.assetsService.getSummary();
  }

  @Get(':id')
  @UseGuards(SessionAuthGuard)
  getAssetById(@Param('id') id: string) {
    return this.assetsService.getAssetById(id);
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
  ) {
    return this.assetsService.updateAsset(id, body);
  }

  @Post()
  @UseGuards(SessionAuthGuard)
  createAsset(
    @Body(new ZodValidationPipe(CreateAssetDtoSchema)) body: CreateAssetDto,
  ) {
    return this.assetsService.createAsset(body);
  }
}
