import { Injectable } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { PrismaService } from 'src/core/database/prisma.service';
import { Prisma } from '@prisma/client';
import { AuditService } from 'src/core/audit/audit.service';
import { Entity } from 'src/core/enums/entity.enum';

@Injectable()
export class CategoryService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}
  create(createCategoryDto: CreateCategoryDto, userId: string) {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    return this.prisma.assetsCategories
      .create({
        data: {
          name: createCategoryDto.name,
          code: code,
        },
      })
      .then(async (category) => {
        // Add audit record
        await this.auditService.addRecord(
          userId,
          'CREATE',
          Entity.CATEGORY,
          category.id,
          {},
          JSON.stringify(createCategoryDto),
        );
        return category;
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

  update(id: number, updateCategoryDto: UpdateCategoryDto, userId: string) {
    return this.prisma.assetsCategories
      .findUnique({
        where: { id: id.toString() },
      })
      .then(async (beforeCategory) => {
        const updatedCategory = await this.prisma.assetsCategories.update({
          where: { id: id.toString() },
          data: {
            name: updateCategoryDto.name,
          },
        });

        // Add audit record
        await this.auditService.addRecord(
          userId,
          'UPDATE',
          Entity.CATEGORY,
          id.toString(),
          JSON.stringify(beforeCategory),
          JSON.stringify(updateCategoryDto),
        );

        return updatedCategory;
      });
  }

  remove(id: string, userId: string) {
    return this.prisma.assetsCategories
      .findUnique({
        where: { id: id },
      })
      .then(async (beforeCategory) => {
        const deletedCategory = await this.prisma.assetsCategories.delete({
          where: { id: id },
        });

        // Add audit record
        await this.auditService.addRecord(
          userId,
          'DELETE',
          Entity.CATEGORY,
          id,
          JSON.stringify(beforeCategory),
          JSON.stringify({}),
        );

        return deletedCategory;
      });
  }
}
