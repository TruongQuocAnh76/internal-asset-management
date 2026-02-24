import { Injectable } from '@nestjs/common';
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
      },
    });

    return createdUser;
  }

  findAll() {
    return `This action returns all users`;
  }

  findOne(id: number) {
    return `This action returns a #${id} user`;
  }

  update(id: number, updateUserDto: UpdateUserDto, userId: string) {
    return this.prisma.users.update({
      where: { id: id.toString() },
      data: updateUserDto,
    });
  }

  remove(id: number, userId: string) {
    return this.prisma.users.delete({
      where: { id: id.toString() },
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
