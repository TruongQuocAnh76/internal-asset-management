import { Injectable } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { PrismaService } from 'src/core/database/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class CategoryService {
  constructor(private prisma: PrismaService) {}
  create(createCategoryDto: CreateCategoryDto) {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    return this.prisma.assetsCategories.create({
      data: {
        name: createCategoryDto.name,
        code: code,
      },
    });
  }

  findAll(
    page: number,
    limit: number,
    sort: 'asc' | 'desc',
    filter: string,
    search: string,
  ) {
    const take = limit || 20;
    const skip = page ? (page - 1) * take : 0;
    const orderBy = filter ? { [filter]: { name: sort || 'asc' } } : undefined;

    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: Prisma.QueryMode.insensitive } },
            { code: { contains: search, mode: Prisma.QueryMode.insensitive } },
          ],
        }
      : {};

    return this.prisma.assetsCategories.findMany({
      where: where,
      orderBy: orderBy,
      skip: skip,
      take: take,
    });
  }

  findOne(id: string) {
    return this.prisma.assetsCategories.findUnique({
      where: { id: id },
    });
  }

  update(id: number, updateCategoryDto: UpdateCategoryDto) {
    return this.prisma.assetsCategories.update({
      where: { id: id.toString() },
      data: {
        name: updateCategoryDto.name,
      },
    });
  }

  remove(id: string) {
    return this.prisma.assetsCategories.delete({
      where: { id: id },
    });
  }
}
