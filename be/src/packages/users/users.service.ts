import { Injectable } from '@nestjs/common';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from 'src/core/database/prisma.service';
import { SignupDto } from 'src/core/auth/dto/signup.dto';
import { DeploymentStatus } from '@prisma/client';
import { AuditService } from 'src/core/audit/audit.service';
import { Entity } from 'src/core/enums/entity.enum';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async create(dto: SignupDto) {
    const createdUser = await this.prisma.users.create({
      data: {
        username: dto.username,
        email: dto.email,
        first_name: dto.first_name,
        last_name: dto.last_name,
        password: dto.password,
        department: dto.department,
        status: DeploymentStatus.ACTIVE,
      },
    });

    // Add audit record
    await this.auditService.addRecord(
      createdUser.id,
      'CREATE',
      Entity.USER,
      createdUser.id,
      JSON.stringify({}),
      JSON.stringify(dto),
    );

    return createdUser;
  }

  findAll() {
    return `This action returns all users`;
  }

  findOne(id: number) {
    return `This action returns a #${id} user`;
  }

  update(id: number, updateUserDto: UpdateUserDto, userId: string) {
    return this.prisma.users
      .findUnique({
        where: { id: id.toString() },
      })
      .then(async (beforeUser) => {
        const updatedUser = await this.prisma.users.update({
          where: { id: id.toString() },
          data: updateUserDto,
        });

        // Add audit record
        await this.auditService.addRecord(
          userId,
          'UPDATE',
          Entity.USER,
          id.toString(),
          JSON.stringify(beforeUser),
          JSON.stringify(updateUserDto),
        );

        return updatedUser;
      });
  }

  remove(id: number, userId: string) {
    return this.prisma.users
      .findUnique({
        where: { id: id.toString() },
      })
      .then(async (beforeUser) => {
        const deletedUser = await this.prisma.users.delete({
          where: { id: id.toString() },
        });

        // Add audit record
        await this.auditService.addRecord(
          userId,
          'DELETE',
          Entity.USER,
          id.toString(),
          JSON.stringify(beforeUser),
          JSON.stringify({}),
        );

        return deletedUser;
      });
  }

  async findByCredential(credential: string) {
    return await this.prisma.users.findFirst({
      where: {
        OR: [{ email: credential }, { username: credential }],
      },
      select: {
        id: true,
        username: true,
        email: true,
        first_name: true,
        last_name: true,
        password: true,
        status: true,
      },
    });
  }

  async getUserInfo(user: any) {
    return await this.prisma.users.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        username: true,
        email: true,
        first_name: true,
        last_name: true,
        department: true,
        status: true,
        created_at: true,
        updated_at: true,
      },
    });
  }
}
