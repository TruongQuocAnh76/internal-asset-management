import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from 'src/core/database/prisma.service';
import { SignupDto } from 'src/core/auth/dto/signup.dto';
import { DeploymentStatus } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

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
        user_roles: {
          create: {
            role: {
              connect: { name: 'Employee' }
            }
          }
        }
      },
    });

    return createdUser;
  }

  findAll(search?: string) {
    return this.prisma.users.findMany({
      where: search
        ? {
            OR: [
              { first_name: { contains: search, mode: 'insensitive' } },
              { last_name: { contains: search, mode: 'insensitive' } },
              { username: { contains: search, mode: 'insensitive' } },
            ],
          }
        : undefined,
      select: {
        id: true,
        username: true,
        email: true,
        first_name: true,
        last_name: true,
        department: true,
        status: true,
        created_at: true,
        user_roles: {
          select: {
            role: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });
  }

  findOne(id: string) {
    return this.prisma.users.findUnique({
      where: { id },
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
        user_roles: {
          select: {
            role: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto, userId: string) {
    const existingUser = await this.prisma.users.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existingUser) {
      throw new NotFoundException('User not found');
    }

    const roleName = updateUserDto.role?.trim();
    if (roleName && !['Admin', 'Team Lead', 'Employee'].includes(roleName)) {
      throw new BadRequestException('Invalid role');
    }

    return this.prisma.$transaction(async (tx) => {
      if (updateUserDto.department || updateUserDto.status) {
        await tx.users.update({
          where: { id },
          data: {
            ...(updateUserDto.department ? { department: updateUserDto.department } : {}),
            ...(updateUserDto.status ? { status: updateUserDto.status } : {}),
          },
        });
      }

      if (roleName) {
        const role = await tx.roles.findUnique({
          where: { name: roleName },
          select: { id: true },
        });

        if (!role) {
          throw new NotFoundException('Role not found');
        }

        await tx.userRoles.deleteMany({
          where: { user_id: id },
        });

        await tx.userRoles.create({
          data: {
            user_id: id,
            role_id: role.id,
          },
        });
      }

      return tx.users.findUnique({
        where: { id },
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
          user_roles: {
            select: {
              role: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      });
    });
  }

  remove(id: string, userId: string) {
    return this.prisma.users.delete({
      where: { id },
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
