import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { SessionAuthGuard } from 'src/core/auth/guards/session-auth.guard';
import { CurrentUser } from 'src/core/auth/decorator/current-user.decorator';

@Controller('category')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post()
  @UseGuards(SessionAuthGuard)
  create(
    @Body() createCategoryDto: CreateCategoryDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.categoryService.create(createCategoryDto, userId);
  }

  @Get()
  @UseGuards(SessionAuthGuard)
  findAll(
    @Query('page') page: number,
    @Query('limit') limit: number,
    @Query('sort') sort: 'asc' | 'desc',
    @Query('filter') filter: string,
    @Query('search') search: string,
  ) {
    return this.categoryService.findAll(page, limit, sort, filter, search);
  }

  @Get(':id')
  @UseGuards(SessionAuthGuard)
  findOne(@Param('id') id: string) {
    return this.categoryService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(SessionAuthGuard)
  update(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.categoryService.update(id, updateCategoryDto, userId);
  }

  @Delete(':id')
  @UseGuards(SessionAuthGuard)
  remove(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.categoryService.remove(id, userId);
  }
}
